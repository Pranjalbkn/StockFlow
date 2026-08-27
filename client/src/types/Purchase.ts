export type Supplier = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
};

export type Purchase = {
  id: number;
  invoice_number: string | null;
  purchase_date: string;
  total_amount: string;
  supplier_name: string | null;
  item_count: number;
};
