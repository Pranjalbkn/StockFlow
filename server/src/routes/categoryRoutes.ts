import { Router } from "express";
import { z } from "zod";
import { pool } from "../database/pool.js";
import { requireAuthentication, requireRole } from "../middleware/requireAuthentication.js";

const categoryRouter = Router();
const categorySchema = z.object({ name: z.string().trim().min(2).max(80) });

categoryRouter.use(requireAuthentication);

categoryRouter.get("/", async (_request, response) => {
  const result = await pool.query(
    `SELECT id, name, created_at
     FROM categories
     WHERE user_id = $1
     ORDER BY name`,
    [response.locals.user.accountId],
  );

  response.json({ categories: result.rows });
});

categoryRouter.post("/", requireRole("OWNER", "MANAGER"), async (request, response) => {
  const validation = categorySchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({ message: "Category name must contain 2 to 80 characters" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO categories (user_id, name)
       VALUES ($1, $2)
       RETURNING id, name, created_at`,
      [response.locals.user.accountId, validation.data.name],
    );

    response.status(201).json({ category: result.rows[0] });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      response.status(409).json({ message: "This category already exists" });
      return;
    }

    response.status(500).json({ message: "Unable to create category" });
  }
});

export default categoryRouter;
