export type StockMovement = {
  id: number;
  movement_type: "INITIAL" | "PURCHASE" | "SALE" | "RETURN" | "ADJUSTMENT" | "DAMAGE";
  quantity_change: number;
  reference_type: string | null;
  reference_id: number | null;
  note: string | null;
  created_at: string;
  product_name: string;
  sku: string;
};
