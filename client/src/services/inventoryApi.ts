import type { Category, Product, ProductDetails } from "../types/Inventory";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function request(path: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed");
  }

  return data;
}

export async function getCategories() {
  const data = await request("/api/categories");
  return data.categories as Category[];
}

export async function createCategory(name: string) {
  const data = await request("/api/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return data.category as Category;
}

export async function getProducts() {
  const data = await request("/api/products");
  return data.products as Product[];
}

export async function createProduct(details: ProductDetails) {
  const data = await request("/api/products", {
    method: "POST",
    body: JSON.stringify(details),
  });
  return data.product as Product;
}

export async function updateProduct(id: number, details: ProductDetails) {
  const data = await request(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(details),
  });
  return data.product as Product;
}

export async function deleteProduct(id: number) {
  await request(`/api/products/${id}`, { method: "DELETE" });
}
