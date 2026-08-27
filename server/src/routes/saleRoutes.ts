import { Router } from "express";
import { z } from "zod";
import { pool } from "../database/pool.js";
import { requireAuthentication } from "../middleware/requireAuthentication.js";
import { calculateTotal } from "../utils/calculateTotal.js";

const saleRouter = Router();

const saleSchema = z.object({
  customerName: z.string().trim().max(120).optional(),
  customerPhone: z.string().trim().max(20).optional(),
  invoiceNumber: z.string().trim().max(80).optional(),
  saleDate: z.iso.date(),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().min(0),
    }),
  ).min(1).refine(
    (items) => new Set(items.map((item) => item.productId)).size === items.length,
    { message: "Each product can appear only once per sale" },
  ),
});

saleRouter.use(requireAuthentication);

saleRouter.get("/", async (_request, response) => {
  const result = await pool.query(
    `SELECT
       sales.id,
       sales.customer_name,
       sales.customer_phone,
       sales.invoice_number,
       sales.sale_date,
       sales.total_amount,
       sales.created_at,
       creator.name AS created_by_name,
       COUNT(sale_items.id)::INTEGER AS item_count
     FROM sales
     LEFT JOIN users AS creator ON creator.id = sales.created_by_user_id
     LEFT JOIN sale_items ON sale_items.sale_id = sales.id
     WHERE sales.user_id = $1
     GROUP BY sales.id, creator.name
     ORDER BY sales.sale_date DESC, sales.id DESC`,
    [response.locals.user.accountId],
  );

  response.json({ sales: result.rows });
});

saleRouter.get("/:id/invoice", async (request, response) => {
  const saleId = Number(request.params.id);

  if (!Number.isInteger(saleId)) {
    response.status(400).json({ message: "Invalid sale ID" });
    return;
  }

  const saleResult = await pool.query(
    `SELECT
       sales.id,
       sales.customer_name,
       sales.customer_phone,
       sales.invoice_number,
       sales.sale_date,
       sales.total_amount,
       sales.created_at,
       owner.brand_name,
       creator.name AS created_by_name
     FROM sales
     JOIN users AS owner ON owner.id = sales.user_id
     LEFT JOIN users AS creator ON creator.id = sales.created_by_user_id
     WHERE sales.id = $1 AND sales.user_id = $2`,
    [saleId, response.locals.user.accountId],
  );

  if (!saleResult.rows[0]) {
    response.status(404).json({ message: "Sale not found" });
    return;
  }

  const itemsResult = await pool.query(
    `SELECT
       products.name,
       products.sku,
       sale_items.quantity,
       sale_items.unit_price,
       (sale_items.quantity * sale_items.unit_price) AS line_total
     FROM sale_items
     JOIN products ON products.id = sale_items.product_id
     WHERE sale_items.sale_id = $1
     ORDER BY sale_items.id`,
    [saleId],
  );

  response.json({
    invoice: {
      ...saleResult.rows[0],
      items: itemsResult.rows,
    },
  });
});

saleRouter.post("/", async (request, response) => {
  const validation = saleSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({ message: "Please provide valid sale details" });
    return;
  }

  const userId = response.locals.user.accountId;
  const createdByUserId = response.locals.user.userId;
  const sale = validation.data;
  const totalAmount = calculateTotal(
    sale.items.map((item) => ({
      quantity: item.quantity,
      unitAmount: item.unitPrice,
    })),
  );
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const saleResult = await client.query(
      `INSERT INTO sales
        (user_id, customer_name, customer_phone, invoice_number, sale_date, total_amount, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, customer_name, customer_phone, invoice_number, sale_date, total_amount, created_at`,
      [
        userId,
        sale.customerName || null,
        sale.customerPhone || null,
        sale.invoiceNumber || null,
        sale.saleDate,
        totalAmount,
        createdByUserId,
      ],
    );
    const savedSale = saleResult.rows[0];

    for (const item of sale.items) {
      const productResult = await client.query(
        `UPDATE products
         SET quantity = quantity - $1,
             updated_at = NOW()
         WHERE id = $2
           AND user_id = $3
           AND quantity >= $1
           AND is_active = TRUE
         RETURNING id`,
        [item.quantity, item.productId, userId],
      );

      if (!productResult.rowCount) throw new Error("INSUFFICIENT_STOCK");

      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [savedSale.id, item.productId, item.quantity, item.unitPrice],
      );

      await client.query(
        `INSERT INTO stock_movements
          (user_id, product_id, movement_type, quantity_change, reference_type, reference_id)
         VALUES ($1, $2, 'SALE', $3, 'SALE', $4)`,
        [userId, item.productId, -item.quantity, savedSale.id],
      );
    }

    await client.query("COMMIT");
    response.status(201).json({ sale: savedSale });
  } catch (error) {
    await client.query("ROLLBACK");

    if ((error as Error).message === "INSUFFICIENT_STOCK") {
      response.status(409).json({ message: "A product does not have enough stock" });
      return;
    }

    response.status(500).json({ message: "Unable to record sale" });
  } finally {
    client.release();
  }
});

export default saleRouter;
