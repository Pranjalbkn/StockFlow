import { Router } from "express";
import { z } from "zod";
import { pool } from "../database/pool.js";
import { requireAuthentication, requireRole } from "../middleware/requireAuthentication.js";

const settingsRouter = Router();

settingsRouter.use(requireAuthentication);

settingsRouter.put("/brand", requireRole("OWNER"), async (request, response) => {
  const validation = z.object({ brandName: z.string().trim().min(2).max(120) }).safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({ message: "Brand name must contain 2 to 120 characters" });
    return;
  }

  const result = await pool.query(
    `UPDATE users
     SET brand_name = $1, updated_at = NOW()
     WHERE id = $2 AND role = 'OWNER'
     RETURNING brand_name AS "brandName"`,
    [validation.data.brandName, response.locals.user.accountId],
  );

  response.json({ brandName: result.rows[0].brandName });
});

export default settingsRouter;
