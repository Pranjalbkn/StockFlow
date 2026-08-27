export type Sale = {
  id: number;
  customer_name: string | null;
  customer_phone: string | null;
  invoice_number: string | null;
  sale_date: string;
  total_amount: string;
  item_count: number;
  created_by_name: string | null;
};

export type Invoice = {
  id: number;
  customer_name: string | null;
  customer_phone: string | null;
  invoice_number: string | null;
  sale_date: string;
  total_amount: string;
  brand_name: string;
  created_by_name: string | null;
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    unit_price: string;
    line_total: string;
  }>;
};
