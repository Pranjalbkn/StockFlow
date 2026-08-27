import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { createToken } from "../auth/token.js";
import { pool } from "../database/pool.js";
import { requireAuthentication } from "../middleware/requireAuthentication.js";

const authRouter = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  maxAge: 24 * 60 * 60 * 1000,
};

authRouter.post("/register", async (request, response) => {
  const validation = registerSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      message: "Please provide a valid name, email, and password",
    });
    return;
  }

  const { name, email, password } = validation.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, brand_name AS "brandName", created_at`,
      [name, email, passwordHash],
    );

    const user = result.rows[0];
    const token = createToken({ userId: user.id, accountId: user.id, role: user.role });

    response.cookie("accessToken", token, cookieOptions);
    response.status(201).json({ user });
  } catch (error) {
    const databaseError = error as { code?: string };

    if (databaseError.code === "23505") {
      response.status(409).json({ message: "Email is already registered" });
      return;
    }

    response.status(500).json({ message: "Unable to create account" });
  }
});

authRouter.post("/login", async (request, response) => {
  const validation = loginSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({ message: "Valid email and password required" });
    return;
  }

  const { email, password } = validation.data;
  const result = await pool.query(
    `SELECT id, name, email, password_hash, role, owner_user_id, is_active, created_at
     FROM users
     WHERE email = $1`,
    [email],
  );
  const user = result.rows[0];

  if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
    response.status(401).json({ message: "Incorrect email or password" });
    return;
  }

  const accountId = user.owner_user_id ?? user.id;
  const token = createToken({ userId: user.id, accountId, role: user.role });
  const brandResult = await pool.query(
    "SELECT brand_name FROM users WHERE id = $1",
    [accountId],
  );

  response.cookie("accessToken", token, cookieOptions);
  response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      brandName: brandResult.rows[0]?.brand_name ?? "StockFlow",
      created_at: user.created_at,
    },
  });
});

authRouter.get("/me", requireAuthentication, async (_request, response) => {
  const result = await pool.query(
    `SELECT
       users.id,
       users.name,
       users.email,
       users.role,
       users.created_at,
       owner.brand_name AS "brandName"
     FROM users
     JOIN users AS owner ON owner.id = $2
     WHERE users.id = $1 AND users.is_active = TRUE`,
    [response.locals.user.userId, response.locals.user.accountId],
  );

  if (!result.rows[0]) {
    response.status(404).json({ message: "User not found" });
    return;
  }

  response.json({ user: result.rows[0] });
});

authRouter.post("/logout", (_request, response) => {
  response.clearCookie("accessToken", cookieOptions);
  response.json({ message: "Logged out successfully" });
});

export default authRouter;
