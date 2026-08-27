import { Router } from "express";
import { pool } from "../database/pool.js";
import { requireAuthentication } from "../middleware/requireAuthentication.js";

const stockMovementRouter = Router();
stockMovementRouter.use(requireAuthentication);

stockMovementRouter.get("/", async (_request, response) => {
  const result = await pool.query(
    `SELECT
       stock_movements.id,
       stock_movements.movement_type,
       stock_movements.quantity_change,
       stock_movements.reference_type,
       stock_movements.reference_id,
       stock_movements.note,
       stock_movements.created_at,
       products.name AS product_name,
       products.sku
     FROM stock_movements
     JOIN products ON products.id = stock_movements.product_id
     WHERE stock_movements.user_id = $1
     ORDER BY stock_movements.created_at DESC
     LIMIT 100`,
    [response.locals.user.accountId],
  );

  response.json({ movements: result.rows });
});

export default stockMovementRouter;
