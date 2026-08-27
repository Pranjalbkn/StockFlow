import { Router } from "express";
import { z } from "zod";
import { pool } from "../database/pool.js";
import { requireAuthentication } from "../middleware/requireAuthentication.js";

const reportRouter = Router();
reportRouter.use(requireAuthentication);

reportRouter.get("/daily", async (request, response) => {
  const validation = z.iso.date().safeParse(request.query.date);

  if (!validation.success) {
    response.status(400).json({ message: "A valid report date is required" });
    return;
  }

  const accountId = response.locals.user.accountId;
  const date = validation.data;
  const [sales, purchases, units, lowStock, topProducts] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::INTEGER AS count, COALESCE(SUM(total_amount), 0) AS total
       FROM sales WHERE user_id = $1 AND sale_date = $2`,
      [accountId, date],
    ),
    pool.query(
      `SELECT COUNT(*)::INTEGER AS count, COALESCE(SUM(total_amount), 0) AS total
       FROM purchases WHERE user_id = $1 AND purchase_date = $2`,
      [accountId, date],
    ),
    pool.query(
      `SELECT COALESCE(SUM(sale_items.quantity), 0)::INTEGER AS total
       FROM sale_items
       JOIN sales ON sales.id = sale_items.sale_id
       WHERE sales.user_id = $1 AND sales.sale_date = $2`,
      [accountId, date],
    ),
    pool.query(
      `SELECT COUNT(*)::INTEGER AS total
       FROM products
       WHERE user_id = $1 AND is_active = TRUE AND quantity <= minimum_stock`,
      [accountId],
    ),
    pool.query(
      `SELECT products.name, products.sku, SUM(sale_items.quantity)::INTEGER AS quantity
       FROM sale_items
       JOIN sales ON sales.id = sale_items.sale_id
       JOIN products ON products.id = sale_items.product_id
       WHERE sales.user_id = $1 AND sales.sale_date = $2
       GROUP BY products.id
       ORDER BY quantity DESC
       LIMIT 5`,
      [accountId, date],
    ),
  ]);

  response.json({
    report: {
      date,
      salesCount: sales.rows[0].count,
      salesTotal: sales.rows[0].total,
      purchaseCount: purchases.rows[0].count,
      purchaseTotal: purchases.rows[0].total,
      unitsSold: units.rows[0].total,
      lowStockProducts: lowStock.rows[0].total,
      topProducts: topProducts.rows,
    },
  });
});

export default reportRouter;
