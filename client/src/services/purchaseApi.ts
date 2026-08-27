import type { Purchase, Supplier } from "../types/Purchase";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function request(path: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = await response.json();

  if (!response.ok) throw new Error(data.message ?? "Request failed");
  return data;
}

export async function getSuppliers() {
  const data = await request("/api/suppliers");
  return data.suppliers as Supplier[];
}

export async function createSupplier(details: { name: string; email: string; phone: string }) {
  const data = await request("/api/suppliers", {
    method: "POST",
    body: JSON.stringify(details),
  });
  return data.supplier as Supplier;
}

export async function getPurchases() {
  const data = await request("/api/purchases");
  return data.purchases as Purchase[];
}

export async function createPurchase(details: {
  supplierId: number | null;
  invoiceNumber: string;
  purchaseDate: string;
  productId: number;
  quantity: number;
  unitCost: number;
}) {
  const data = await request("/api/purchases", {
    method: "POST",
    body: JSON.stringify({
      supplierId: details.supplierId,
      invoiceNumber: details.invoiceNumber,
      purchaseDate: details.purchaseDate,
      items: [{
        productId: details.productId,
        quantity: details.quantity,
        unitCost: details.unitCost,
      }],
    }),
  });
  return data.purchase as Purchase;
}

export async function createMultiItemPurchase(details: {
  supplierId: number | null;
  invoiceNumber: string;
  purchaseDate: string;
  items: Array<{ productId: number; quantity: number; unitCost: number }>;
}) {
  const data = await request("/api/purchases", {
    method: "POST",
    body: JSON.stringify(details),
  });
  return data.purchase as Purchase;
}
