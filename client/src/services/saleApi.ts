import type { Invoice, Sale } from "../types/Sale";

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

export async function getSales() {
  const data = await request("/api/sales");
  return data.sales as Sale[];
}

export async function createSale(details: {
  customerName: string;
  customerPhone: string;
  invoiceNumber: string;
  saleDate: string;
  items: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
  }>;
}) {
  const data = await request("/api/sales", {
    method: "POST",
    body: JSON.stringify({
      customerName: details.customerName,
      customerPhone: details.customerPhone,
      invoiceNumber: details.invoiceNumber,
      saleDate: details.saleDate,
      items: details.items,
    }),
  });
  return data.sale as Sale;
}

export async function getInvoice(saleId: number) {
  const data = await request(`/api/sales/${saleId}/invoice`);
  return data.invoice as Invoice;
}
