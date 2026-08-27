import express, { Router } from "express";
import { pool } from "../database/pool.js";
import { requireAuthentication } from "../middleware/requireAuthentication.js";
import { interpretWithGemini } from "../services/geminiCommandService.js";
import { findUniqueCatalogMatch } from "../utils/matchCatalogName.js";

const voiceCommandRouter = Router();
const supportedAudioTypes = new Set(["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"]);

voiceCommandRouter.use(requireAuthentication);

async function getCatalog(userId: number) {
  const [products, suppliers] = await Promise.all([
    pool.query(
      `SELECT id, name, sku
       FROM products
       WHERE user_id = $1 AND is_active = TRUE
       ORDER BY name
       LIMIT 250`,
      [userId],
    ),
    pool.query(
      `SELECT id, name
       FROM suppliers
       WHERE user_id = $1
       ORDER BY name
       LIMIT 250`,
      [userId],
    ),
  ]);

  return { products: products.rows, suppliers: suppliers.rows };
}

async function sendInterpretation(
  response: express.Response,
  input: { text?: string; audio?: { mimeType: string; data: Buffer } },
) {
  try {
    const user = response.locals.user;
    const catalog = await getCatalog(user.accountId);
    const command = await interpretWithGemini({
      catalog,
      canRecordPurchases: user.role === "OWNER" || user.role === "MANAGER",
      ...input,
    });

    const validProductIds = new Set(catalog.products.map((product) => product.id));
    const validSupplierIds = new Set(catalog.suppliers.map((supplier) => supplier.id));
    const safeCommand = {
      ...command,
      supplierId: command.supplierId && validSupplierIds.has(command.supplierId) ? command.supplierId : null,
      items: command.items.map((item) => {
        const trustedGeminiId = item.productId && validProductIds.has(item.productId)
          ? item.productId
          : null;
        const catalogMatch = trustedGeminiId
          ? null
          : findUniqueCatalogMatch(item.productName, catalog.products);

        return {
          ...item,
          productId: trustedGeminiId ?? catalogMatch?.id ?? null,
          productName: catalogMatch?.name ?? item.productName,
        };
      }),
    };

    response.json({ command: safeCommand });
  } catch (error) {
    const message = (error as Error).message;

    if (message === "GEMINI_NOT_CONFIGURED") {
      response.status(503).json({ message: "Voice entry is ready, but GEMINI_API_KEY is not configured yet." });
      return;
    }
    if (message === "GEMINI_REQUEST_FAILED") {
      response.status(502).json({ message: "Gemini could not process the command. Check the API key, model and quota." });
      return;
    }

    console.error(error);
    response.status(422).json({ message: "The command could not be understood. Please try a shorter sentence." });
  }
}

voiceCommandRouter.post(
  "/audio",
  express.raw({ type: ["audio/*", "application/octet-stream"], limit: "5mb" }),
  async (request, response) => {
    const contentType = request.headers["content-type"]?.split(";")[0] ?? "";

    if (!supportedAudioTypes.has(contentType)) {
      response.status(415).json({ message: "Use a WebM, OGG, MP4, MP3 or WAV recording." });
      return;
    }
    if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
      response.status(400).json({ message: "The audio recording is empty." });
      return;
    }

    await sendInterpretation(response, { audio: { mimeType: contentType, data: request.body } });
  },
);

export default voiceCommandRouter;
