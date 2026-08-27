import { Router } from "express";
import { z } from "zod";
import { pool } from "../database/pool.js";
import { requireAuthentication, requireRole } from "../middleware/requireAuthentication.js";

const supplierRouter = Router();
const supplierSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.union([z.email(), z.literal("")]).optional(),
  phone: z.string().trim().max(30).optional(),
});

supplierRouter.use(requireAuthentication);

supplierRouter.get("/", async (_request, response) => {
  const result = await pool.query(
    `SELECT id, name, email, phone, created_at
     FROM suppliers
     WHERE user_id = $1
     ORDER BY name`,
    [response.locals.user.accountId],
  );

  response.json({ suppliers: result.rows });
});

supplierRouter.post("/", requireRole("OWNER", "MANAGER"), async (request, response) => {
  const validation = supplierSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({ message: "Please provide valid supplier details" });
    return;
  }

  const supplier = validation.data;

  try {
    const result = await pool.query(
      `INSERT INTO suppliers (user_id, name, email, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone, created_at`,
      [
        response.locals.user.accountId,
        supplier.name,
        supplier.email || null,
        supplier.phone || null,
      ],
    );

    response.status(201).json({ supplier: result.rows[0] });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      response.status(409).json({ message: "This supplier already exists" });
      return;
    }

    response.status(500).json({ message: "Unable to create supplier" });
  }
});

export default supplierRouter;
