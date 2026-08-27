import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { isAllowedOrigin } from "./config/cors.js";
import { pool } from "./database/pool.js";
import authRouter from "./routes/authRoutes.js";
import categoryRouter from "./routes/categoryRoutes.js";
import productRouter from "./routes/productRoutes.js";
import purchaseRouter from "./routes/purchaseRoutes.js";
import stockMovementRouter from "./routes/stockMovementRoutes.js";
import supplierRouter from "./routes/supplierRoutes.js";
import saleRouter from "./routes/saleRoutes.js";
import employeeRouter from "./routes/employeeRoutes.js";
import reportRouter from "./routes/reportRoutes.js";
import settingsRouter from "./routes/settingsRoutes.js";
import voiceCommandRouter from "./routes/voiceCommandRoutes.js";

const app = express();
const configuredClientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});
const voiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many voice requests. Please wait a minute and try again." },
});

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin, configuredClientUrl, process.env.NODE_ENV === "production")) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", async (_request, response) => {
  try {
    await pool.query("SELECT 1");

    response.json({
      message: "StockFlow API is running",
      database: "connected",
    });
  } catch {
    response.status(503).json({
      message: "StockFlow API is running",
      database: "disconnected",
    });
  }
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/suppliers", supplierRouter);
app.use("/api/purchases", purchaseRouter);
app.use("/api/stock-movements", stockMovementRouter);
app.use("/api/sales", saleRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/reports", reportRouter);
app.use("/api/voice-commands", voiceLimiter, voiceCommandRouter);

app.use((_request, response) => {
  response.status(404).json({ message: "API route not found" });
});

app.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error.message);
  response.status(500).json({ message: "Unexpected server error" });
});

export default app;
