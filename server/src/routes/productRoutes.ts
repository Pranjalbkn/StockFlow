import { Router } from "express";
import { z } from "zod";
import { pool } from "../database/pool.js";
import { requireAuthentication, requireRole } from "../middleware/requireAuthentication.js";

const productRouter = Router();

const productSchema = z.object({
  name: z.string().trim().min(2).max(150),
  sku: z.string().trim().min(2).max(60).transform((value) => value.toUpperCase()),
  categoryId: z.number().int().positive().nullable(),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  quantity: z.number().int().min(0),
  minimumStock: z.number().int().min(0),
});

productRouter.use(requireAuthentication);

productRouter.get("/", async (_request, response) => {
  const result = await pool.query(
    `SELECT
       products.id,
       products.name,
       products.sku,
       products.cost_price,
       products.selling_price,
       products.quantity,
       products.minimum_stock,
       products.category_id,
       categories.name AS category_name,
       products.created_at
     FROM products
     LEFT JOIN categories ON categories.id = products.category_id
     WHERE products.user_id = $1 AND products.is_active = TRUE
     ORDER BY products.created_at DESC`,
    [response.locals.user.accountId],
  );

  response.json({ products: result.rows });
});

productRouter.post("/", requireRole("OWNER", "MANAGER"), async (request, response) => {
  const validation = productSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({ message: "Please provide valid product details" });
    return;
  }

  const product = validation.data;
  const userId = response.locals.user.accountId;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO products
        (user_id, category_id, name, sku, cost_price, selling_price, quantity, minimum_stock)
       SELECT $1, $2, $3, $4, $5, $6, $7, $8
       WHERE $2::INTEGER IS NULL
          OR EXISTS (
            SELECT 1 FROM categories WHERE id = $2 AND user_id = $1
          )
       RETURNING *`,
      [
        userId,
        product.categoryId,
        product.name,
        product.sku,
        product.costPrice,
        product.sellingPrice,
        product.quantity,
        product.minimumStock,
      ],
    );

    if (!result.rows[0]) {
      await client.query("ROLLBACK");
      response.status(400).json({ message: "Selected category is invalid" });
      return;
    }

    if (product.quantity > 0) {
      await client.query(
        `INSERT INTO stock_movements
          (user_id, product_id, movement_type, quantity_change, note)
         VALUES ($1, $2, 'INITIAL', $3, 'Opening stock')`,
        [userId, result.rows[0].id, product.quantity],
      );
    }

    await client.query("COMMIT");

    response.status(201).json({ product: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");

    if ((error as { code?: string }).code === "23505") {
      response.status(409).json({ message: "A product with this SKU already exists" });
      return;
    }

    response.status(500).json({ message: "Unable to create product" });
  } finally {
    client.release();
  }
});

productRouter.put("/:id", requireRole("OWNER", "MANAGER"), async (request, response) => {
  const productId = Number(request.params.id);
  const validation = productSchema.safeParse(request.body);

  if (!Number.isInteger(productId) || !validation.success) {
    response.status(400).json({ message: "Please provide valid product details" });
    return;
  }

  const product = validation.data;
  const userId = response.locals.user.accountId;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const currentResult = await client.query(
      `SELECT quantity
       FROM products
       WHERE id = $1 AND user_id = $2 AND is_active = TRUE
       FOR UPDATE`,
      [productId, userId],
    );

    if (!currentResult.rows[0]) {
      await client.query("ROLLBACK");
      response.status(404).json({ message: "Product not found" });
      return;
    }

    if (product.categoryId) {
      const categoryResult = await client.query(
        "SELECT 1 FROM categories WHERE id = $1 AND user_id = $2",
        [product.categoryId, userId],
      );

      if (!categoryResult.rowCount) {
        await client.query("ROLLBACK");
        response.status(400).json({ message: "Selected category is invalid" });
        return;
      }
    }

    const result = await client.query(
      `UPDATE products
       SET category_id = $1,
           name = $2,
           sku = $3,
           cost_price = $4,
           selling_price = $5,
           quantity = $6,
           minimum_stock = $7,
           updated_at = NOW()
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        product.categoryId,
        product.name,
        product.sku,
        product.costPrice,
        product.sellingPrice,
        product.quantity,
        product.minimumStock,
        productId,
        userId,
      ],
    );

    const previousQuantity = currentResult.rows[0].quantity as number;
    const quantityChange = product.quantity - previousQuantity;

    if (quantityChange !== 0) {
      await client.query(
        `INSERT INTO stock_movements
          (user_id, product_id, movement_type, quantity_change, note)
         VALUES ($1, $2, 'ADJUSTMENT', $3, 'Product quantity edited')`,
        [userId, productId, quantityChange],
      );
    }

    await client.query("COMMIT");
    response.json({ product: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");

    if ((error as { code?: string }).code === "23505") {
      response.status(409).json({ message: "A product with this SKU already exists" });
      return;
    }

    response.status(500).json({ message: "Unable to update product" });
  } finally {
    client.release();
  }
});

productRouter.delete("/:id", requireRole("OWNER", "MANAGER"), async (request, response) => {
  const productId = Number(request.params.id);

  if (!Number.isInteger(productId)) {
    response.status(400).json({ message: "Invalid product ID" });
    return;
  }

  const result = await pool.query(
    `UPDATE products
     SET is_active = FALSE, updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND is_active = TRUE
     RETURNING id`,
    [productId, response.locals.user.accountId],
  );

  if (!result.rows[0]) {
    response.status(404).json({ message: "Product not found" });
    return;
  }

  response.json({ message: "Product archived" });
});

export default productRouter;
