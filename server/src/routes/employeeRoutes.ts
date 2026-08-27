import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { pool } from "../database/pool.js";
import { requireAuthentication, requireRole } from "../middleware/requireAuthentication.js";

const employeeRouter = Router();
const employeeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(72),
  role: z.enum(["MANAGER", "SALESPERSON"]),
});

employeeRouter.use(requireAuthentication, requireRole("OWNER"));

employeeRouter.get("/", async (_request, response) => {
  const result = await pool.query(
    `SELECT id, name, email, role, is_active, created_at
     FROM users
     WHERE owner_user_id = $1
     ORDER BY created_at DESC`,
    [response.locals.user.accountId],
  );

  response.json({ employees: result.rows });
});

employeeRouter.post("/", async (request, response) => {
  const validation = employeeSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({ message: "Please provide valid employee details" });
    return;
  }

  const employee = validation.data;
  const passwordHash = await bcrypt.hash(employee.password, 12);

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, owner_user_id, brand_name)
       VALUES ($1, $2, $3, $4, $5, NULL)
       RETURNING id, name, email, role, is_active, created_at`,
      [employee.name, employee.email, passwordHash, employee.role, response.locals.user.accountId],
    );

    response.status(201).json({ employee: result.rows[0] });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      response.status(409).json({ message: "This email is already registered" });
      return;
    }

    response.status(500).json({ message: "Unable to create employee" });
  }
});

employeeRouter.patch("/:id/status", async (request, response) => {
  const employeeId = Number(request.params.id);
  const validation = z.object({ isActive: z.boolean() }).safeParse(request.body);

  if (!Number.isInteger(employeeId) || !validation.success) {
    response.status(400).json({ message: "Invalid employee status" });
    return;
  }

  const result = await pool.query(
    `UPDATE users
     SET is_active = $1, updated_at = NOW()
     WHERE id = $2 AND owner_user_id = $3
     RETURNING id, name, email, role, is_active, created_at`,
    [validation.data.isActive, employeeId, response.locals.user.accountId],
  );

  if (!result.rows[0]) {
    response.status(404).json({ message: "Employee not found" });
    return;
  }

  response.json({ employee: result.rows[0] });
});

export default employeeRouter;
