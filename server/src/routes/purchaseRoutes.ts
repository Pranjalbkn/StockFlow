import { Router } from "express";
import { z } from "zod";
import { pool } from "../database/pool.js";
import { requireAuthentication, requireRole } from "../middleware/requireAuthentication.js";
import { calculateTotal } from "../utils/calculateTotal.js";

const purchaseRouter = Router();

const purchaseSchema = z.object({
  supplierId: z.number().int().positive().nullable(),
  invoiceNumber: z.string().trim().max(80).optional(),
  purchaseDate: z.iso.date(),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().positive(),
      unitCost: z.number().min(0),
    }),
  ).min(1),
});

purchaseRouter.use(requireAuthentication);

purchaseRouter.get("/", async (_request, response) => {
  const result = await pool.query(
    `SELECT
       purchases.id,
       purchases.invoice_number,
       purchases.purchase_date,
       purchases.total_amount,
       purchases.created_at,
       suppliers.name AS supplier_name,
       COUNT(purchase_items.id)::INTEGER AS item_count
     FROM purchases
     LEFT JOIN suppliers ON suppliers.id = purchases.supplier_id
     LEFT JOIN purchase_items ON purchase_items.purchase_id = purchases.id
     WHERE purchases.user_id = $1
     GROUP BY purchases.id, suppliers.name
     ORDER BY purchases.purchase_date DESC, purchases.id DESC`,
    [response.locals.user.accountId],
  );

  response.json({ purchases: result.rows });
});

purchaseRouter.post("/", requireRole("OWNER", "MANAGER"), async (request, response) => {
  const validation = purchaseSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({ message: "Please provide valid purchase details" });
    return;
  }

  const userId = response.locals.user.accountId;
  const purchase = validation.data;
  const totalAmount = calculateTotal(
    purchase.items.map((item) => ({
      quantity: item.quantity,
      unitAmount: item.unitCost,
    })),
  );
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (purchase.supplierId) {
      const supplier = await client.query(
        "SELECT 1 FROM suppliers WHERE id = $1 AND user_id = $2",
        [purchase.supplierId, userId],
      );

      if (!supplier.rowCount) throw new Error("INVALID_SUPPLIER");
    }

    const purchaseResult = await client.query(
      `INSERT INTO purchases
        (user_id, supplier_id, invoice_number, purchase_date, total_amount)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, invoice_number, purchase_date, total_amount, created_at`,
      [
        userId,
        purchase.supplierId,
        purchase.invoiceNumber || null,
        purchase.purchaseDate,
        totalAmount,
      ],
    );
    const savedPurchase = purchaseResult.rows[0];

    for (const item of purchase.items) {
      const productResult = await client.query(
        `UPDATE products
         SET quantity = quantity + $1,
             cost_price = $2,
             updated_at = NOW()
         WHERE id = $3 AND user_id = $4 AND is_active = TRUE
         RETURNING id`,
        [item.quantity, item.unitCost, item.productId, userId],
      );

      if (!productResult.rowCount) throw new Error("INVALID_PRODUCT");

      await client.query(
        `INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost)
         VALUES ($1, $2, $3, $4)`,
        [savedPurchase.id, item.productId, item.quantity, item.unitCost],
      );

      await client.query(
        `INSERT INTO stock_movements
          (user_id, product_id, movement_type, quantity_change, reference_type, reference_id)
         VALUES ($1, $2, 'PURCHASE', $3, 'PURCHASE', $4)`,
        [userId, item.productId, item.quantity, savedPurchase.id],
      );
    }

    await client.query("COMMIT");
    response.status(201).json({ purchase: savedPurchase });
  } catch (error) {
    await client.query("ROLLBACK");
    const message = (error as Error).message;

    if (message === "INVALID_SUPPLIER" || message === "INVALID_PRODUCT") {
      response.status(400).json({ message: "Selected supplier or product is invalid" });
      return;
    }

    response.status(500).json({ message: "Unable to record purchase" });
  } finally {
    client.release();
  }
});

export default purchaseRouter;
