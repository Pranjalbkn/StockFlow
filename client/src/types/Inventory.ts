export type Category = {
  id: number;
  name: string;
};

export type Product = {
  id: number;
  name: string;
  sku: string;
  cost_price: string;
  selling_price: string;
  quantity: number;
  minimum_stock: number;
  category_id: number | null;
  category_name: string | null;
};

export type ProductDetails = {
  name: string;
  sku: string;
  categoryId: number | null;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  minimumStock: number;
};
