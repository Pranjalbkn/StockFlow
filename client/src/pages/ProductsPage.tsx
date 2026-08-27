import { type FormEvent, useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import {
  createCategory,
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  updateProduct,
} from "../services/inventoryApi";
import type { Category, Product, ProductDetails } from "../types/Inventory";
import type { User } from "../types/User";

type ProductsPageProps = {
  user: User;
  onLogout: () => void;
};

const emptyProduct: ProductDetails = {
  name: "",
  sku: "",
  categoryId: null,
  costPrice: 0,
  sellingPrice: 0,
  quantity: 0,
  minimumStock: 5,
};

function ProductsPage({ user, onLogout }: ProductsPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<ProductDetails>(emptyProduct);
  const [categoryName, setCategoryName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([productList, categoryList]) => {
        setProducts(productList);
        setCategories(categoryList);
      })
      .catch((requestError) => setError((requestError as Error).message));
  }, []);

  function updateProductField(field: keyof ProductDetails, value: string | number | null) {
    setProduct((current) => ({ ...current, [field]: value }));
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const category = await createCategory(categoryName);
      setCategories((current) => [...current, category].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryName("");
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (editingId) {
        await updateProduct(editingId, product);
      } else {
        await createProduct(product);
      }
      setProducts(await getProducts());
      setProduct(emptyProduct);
      setEditingId(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function startEditing(item: Product) {
    setEditingId(item.id);
    setProduct({
      name: item.name,
      sku: item.sku,
      categoryId: item.category_id,
      costPrice: Number(item.cost_price),
      sellingPrice: Number(item.selling_price),
      quantity: item.quantity,
      minimumStock: item.minimum_stock,
    });
    window.scrollTo(0, 0);
  }

  function cancelEditing() {
    setEditingId(null);
    setProduct(emptyProduct);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Archive this product? It will remain in historical records.")) return;

    try {
      await deleteProduct(id);
      setProducts((current) => current.filter((item) => item.id !== id));
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  const inputClass = "mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50/40 px-3 py-2.5 text-sm shadow-sm outline-none hover:border-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15";
  const labelClass = "block text-sm font-medium text-slate-700";
  const visibleProducts = products.filter((item) =>
    `${item.name} ${item.sku} ${item.category_name ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <AppShell user={user} onLogout={onLogout}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-700">Inventory</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Products</h1>
          <p className="mt-2 text-slate-600">Create categories and manage your current stock.</p>
        </div>
        <p className="text-sm text-slate-500">{products.length} products</p>
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid min-w-0 gap-5 sm:mt-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-6">
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-200/60">
            <h2 className="font-semibold text-slate-900">Add category</h2>
            <form onSubmit={handleCategorySubmit} className="mt-4 flex gap-2">
              <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="e.g. Electronics" required minLength={2} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600" />
              <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Add</button>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">{editingId ? "Edit product" : "Add product"}</h2>
              {editingId && <button type="button" onClick={cancelEditing} className="text-sm font-medium text-slate-600 hover:underline">Cancel</button>}
            </div>
            <form onSubmit={handleProductSubmit} className="mt-4 space-y-4">
              <label className={labelClass}>Product name<input value={product.name} onChange={(event) => updateProductField("name", event.target.value)} required minLength={2} className={inputClass} /></label>
              <label className={labelClass}>SKU<input value={product.sku} onChange={(event) => updateProductField("sku", event.target.value)} required minLength={2} className={inputClass} /></label>
              <label className={labelClass}>Category
                <select value={product.categoryId ?? ""} onChange={(event) => updateProductField("categoryId", event.target.value ? Number(event.target.value) : null)} className={inputClass}>
                  <option value="">No category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                <label className={labelClass}>Cost price<input type="number" min="0" step="0.01" value={product.costPrice} onChange={(event) => updateProductField("costPrice", Number(event.target.value))} required className={inputClass} /></label>
                <label className={labelClass}>Selling price<input type="number" min="0" step="0.01" value={product.sellingPrice} onChange={(event) => updateProductField("sellingPrice", Number(event.target.value))} required className={inputClass} /></label>
                <label className={labelClass}>Quantity<input type="number" min="0" value={product.quantity} onChange={(event) => updateProductField("quantity", Number(event.target.value))} required className={inputClass} /></label>
                <label className={labelClass}>Low-stock level<input type="number" min="0" value={product.minimumStock} onChange={(event) => updateProductField("minimumStock", Number(event.target.value))} required className={inputClass} /></label>
              </div>
              <button disabled={saving} className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
                {saving ? "Saving..." : editingId ? "Save changes" : "Add product"}
              </button>
            </form>
          </section>
        </div>

        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm shadow-slate-200/60">
          <div className="border-b border-slate-200 p-4">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, SKU, or category" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600" />
          </div>
          {visibleProducts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h2 className="font-semibold text-slate-900">No products yet</h2>
              <p className="mt-2 text-sm text-slate-500">Use the form to add your first inventory item.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="responsive-table w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleProducts.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Product" className="px-4 py-4"><div className="min-w-0"><p className="break-words font-medium text-slate-900">{item.name}</p><p className="mt-1 break-all text-xs text-slate-500">{item.sku} · {item.category_name ?? "Uncategorized"}</p></div></td>
                      <td data-label="Price" className="px-4 py-4 text-slate-700">₹{Number(item.selling_price).toLocaleString("en-IN")}</td>
                      <td data-label="Stock" className="px-4 py-4"><span className={item.quantity <= item.minimum_stock ? "font-medium text-amber-700" : "text-slate-700"}>{item.quantity}</span></td>
                      <td data-label="Actions" className="px-4 py-4 text-right"><div className="flex justify-end gap-3"><button type="button" onClick={() => startEditing(item)} className="text-sm font-medium text-emerald-700 hover:underline">Edit</button><button type="button" onClick={() => handleDelete(item.id)} className="text-sm font-medium text-red-700 hover:underline">Archive</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default ProductsPage;
