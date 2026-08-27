export type DailyReport = {
  date: string;
  salesCount: number;
  salesTotal: string;
  purchaseCount: number;
  purchaseTotal: string;
  unitsSold: number;
  lowStockProducts: number;
  topProducts: Array<{ name: string; sku: string; quantity: number }>;
};
