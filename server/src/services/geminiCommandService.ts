import { z } from "zod";

export const interpretedCommandSchema = z.object({
  action: z.enum(["SALE", "PURCHASE", "UNKNOWN"]),
  customerName: z.string().trim().nullable(),
  supplierId: z.number().int().positive().nullable(),
  supplierName: z.string().trim().nullable(),
  items: z.array(z.object({
    productId: z.number().int().positive().nullable(),
    productName: z.string().trim().min(1),
    quantity: z.number().int().positive(),
    unitAmount: z.number().min(0).nullable(),
  })),
  missingFields: z.array(z.string()),
});

type Catalog = {
  products: Array<{ id: number; name: string; sku: string }>;
  suppliers: Array<{ id: number; name: string }>;
};

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

const responseSchema = {
  type: "OBJECT",
  properties: {
    action: { type: "STRING", enum: ["SALE", "PURCHASE", "UNKNOWN"] },
    customerName: { type: "STRING", nullable: true },
    supplierId: { type: "INTEGER", nullable: true },
    supplierName: { type: "STRING", nullable: true },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          productId: { type: "INTEGER", nullable: true },
          productName: { type: "STRING" },
          quantity: { type: "INTEGER" },
          unitAmount: { type: "NUMBER", nullable: true },
        },
        required: ["productId", "productName", "quantity", "unitAmount"],
      },
    },
    missingFields: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["action", "customerName", "supplierId", "supplierName", "items", "missingFields"],
};

function createPrompt(catalog: Catalog, canRecordPurchases: boolean) {
  return `You interpret short inventory commands for StockFlow.
Return only the requested structured JSON.

Allowed actions: SALE${canRecordPurchases ? ", PURCHASE" : ""}, UNKNOWN.
- SALE examples: sold, sell, customer bought.
- PURCHASE examples: purchased, received, bought from supplier.
- unitAmount means selling price for SALE and unit cost for PURCHASE.
- A price followed by "each" is a unit amount.
- Support English and Hinglish.
- Never invent an ID. Match only against the catalog below.
- productName must contain only the product name. Never prefix it with words such as select, choose, product, item, or add.
- If a product is ambiguous or absent, use null for productId and retain the spoken name.
- If a supplier is ambiguous or absent, use null for supplierId and retain its spoken name.
- If quantity is missing or invalid, use 1 and add a clear message to missingFields.
- If price is missing, use null and add a clear message to missingFields.
- If the command is not an allowed sale or purchase, return UNKNOWN.

PRODUCT CATALOG:
${JSON.stringify(catalog.products)}

SUPPLIER CATALOG:
${JSON.stringify(catalog.suppliers)}`;
}

export async function interpretWithGemini(options: {
  catalog: Catalog;
  canRecordPurchases: boolean;
  text?: string;
  audio?: { mimeType: string; data: Buffer };
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

  if (!apiKey) {
    throw new Error("GEMINI_NOT_CONFIGURED");
  }

  const parts: GeminiPart[] = [{ text: createPrompt(options.catalog, options.canRecordPurchases) }];

  if (options.text) parts.push({ text: `Inventory command: ${options.text}` });
  if (options.audio) {
    parts.push({
      inlineData: {
        mimeType: options.audio.mimeType,
        data: options.audio.data.toString("base64"),
      },
    });
    parts.push({ text: "Interpret the inventory command spoken in this audio." });
  }

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );

  if (!geminiResponse.ok) {
    const details = await geminiResponse.text();
    console.error(`Gemini request failed (${geminiResponse.status}): ${details.slice(0, 500)}`);
    throw new Error("GEMINI_REQUEST_FAILED");
  }

  const result = await geminiResponse.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const output = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!output) throw new Error("GEMINI_EMPTY_RESPONSE");

  const command = interpretedCommandSchema.parse(JSON.parse(output));

  return {
    ...command,
    items: command.items.map((item) => ({
      ...item,
      productName: item.productName.replace(/^(select|choose|add)\s+(the\s+)?(product|item)?\s*/i, "").trim(),
    })),
  };
}
