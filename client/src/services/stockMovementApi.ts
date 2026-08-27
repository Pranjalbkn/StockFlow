import type { StockMovement } from "../types/StockMovement";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export async function getStockMovements() {
  const response = await fetch(`${API_URL}/api/stock-movements`, {
    credentials: "include",
  });
  const data = await response.json();

  if (!response.ok) throw new Error(data.message ?? "Unable to load stock history");
  return data.movements as StockMovement[];
}
