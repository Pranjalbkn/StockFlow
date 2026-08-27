import { type FormEvent, useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { getProducts } from "../services/inventoryApi";
import {
  createPurchase,
  createSupplier,
  getPurchases,
  getSuppliers,
} from "../services/purchaseApi";
import type { Product } from "../types/Inventory";
import type { Purchase, Supplier } from "../types/Purchase";
import type { User } from "../types/User";

type PurchasesPageProps = {
  user: User;
  onLogout: () => void;
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function PurchasesPage({ user, onLogout }: PurchasesPageProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [supplier, setSupplier] = useState({ name: "", email: "", phone: "" });
  const [purchase, setPurchase] = useState({
    supplierId: null as number | null,
    invoiceNumber: "",
    purchaseDate: getToday(),
    productId: 0,
    quantity: 1,
    unitCost: 0,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getSuppliers(), getProducts(), getPurchases()])
      .then(([supplierList, productList, purchaseList]) => {
        setSuppliers(supplierList);
        setProducts(productList);
        setPurchases(purchaseList);
      })
      .catch((requestError) => setError((requestError as Error).message));
  }, []);

  async function handleSupplierSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const savedSupplier = await createSupplier(supplier);
      setSuppliers((current) => [...current, savedSupplier].sort((a, b) => a.name.localeCompare(b.name)));
      setSupplier({ name: "", email: "", phone: "" });
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  async function handlePurchaseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      await createPurchase(purchase);
      setPurchases(await getPurchases());
      setPurchase({
        supplierId: null,
        invoiceNumber: "",
        purchaseDate: getToday(),
        productId: 0,
        quantity: 1,
        unitCost: 0,
      });
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50/40 px-3 py-2.5 text-sm shadow-sm outline-none hover:border-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15";
  const labelClass = "block text-sm font-medium text-slate-700";

  return (
    <AppShell user={user} onLogout={onLogout}>
      <p className="text-sm font-medium text-emerald-700">Inventory</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Purchases</h1>
      <p className="mt-2 text-slate-600">Record incoming stock from your suppliers.</p>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid min-w-0 gap-5 sm:mt-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-6">
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-200/60">
            <h2 className="font-semibold text-slate-900">Add supplier</h2>
            <form onSubmit={handleSupplierSubmit} className="mt-4 space-y-3">
              <label className={labelClass}>Supplier name<input required minLength={2} value={supplier.name} onChange={(event) => setSupplier({ ...supplier, name: event.target.value })} className={inputClass} /></label>
              <label className={labelClass}>Email <span className="font-normal text-slate-400">(optional)</span><input type="email" value={supplier.email} onChange={(event) => setSupplier({ ...supplier, email: event.target.value })} className={inputClass} /></label>
              <label className={labelClass}>Phone <span className="font-normal text-slate-400">(optional)</span><input value={supplier.phone} onChange={(event) => setSupplier({ ...supplier, phone: event.target.value })} className={inputClass} /></label>
              <button className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Add supplier</button>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-200/60">
            <h2 className="font-semibold text-slate-900">Record purchase</h2>
            {products.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-slate-500">Add a product before recording a purchase.</p>
            ) : (
              <form onSubmit={handlePurchaseSubmit} className="mt-4 space-y-4">
                <label className={labelClass}>Supplier<select value={purchase.supplierId ?? ""} onChange={(event) => setPurchase({ ...purchase, supplierId: event.target.value ? Number(event.target.value) : null })} className={inputClass}><option value="">No supplier</option>{suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label className={labelClass}>Product<select required value={purchase.productId || ""} onChange={(event) => setPurchase({ ...purchase, productId: Number(event.target.value) })} className={inputClass}><option value="">Select product</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>)}</select></label>
                <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                  <label className={labelClass}>Quantity<input type="number" min="1" required value={purchase.quantity} onChange={(event) => setPurchase({ ...purchase, quantity: Number(event.target.value) })} className={inputClass} /></label>
                  <label className={labelClass}>Unit cost<input type="number" min="0" step="0.01" required value={purchase.unitCost} onChange={(event) => setPurchase({ ...purchase, unitCost: Number(event.target.value) })} className={inputClass} /></label>
                </div>
                <label className={labelClass}>Purchase date<input type="date" required value={purchase.purchaseDate} onChange={(event) => setPurchase({ ...purchase, purchaseDate: event.target.value })} className={inputClass} /></label>
                <label className={labelClass}>Invoice number <span className="font-normal text-slate-400">(optional)</span><input value={purchase.invoiceNumber} onChange={(event) => setPurchase({ ...purchase, invoiceNumber: event.target.value })} className={inputClass} /></label>
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">Total: <strong className="text-slate-900">₹{(purchase.quantity * purchase.unitCost).toLocaleString("en-IN")}</strong></div>
                <button disabled={saving} className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">{saving ? "Saving..." : "Record purchase"}</button>
              </form>
            )}
          </section>
        </div>

        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm shadow-slate-200/60">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Purchase history</h2></div>
          {purchases.length === 0 ? (
            <div className="px-6 py-16 text-center"><p className="font-medium text-slate-900">No purchases yet</p><p className="mt-2 text-sm text-slate-500">Recorded purchases will appear here.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="responsive-table w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Total</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{purchases.map((item) => <tr key={item.id}><td data-label="Date" className="px-4 py-4 text-slate-700">{new Date(item.purchase_date).toLocaleDateString("en-IN")}</td><td data-label="Supplier" className="px-4 py-4 font-medium text-slate-900">{item.supplier_name ?? "Not specified"}</td><td data-label="Invoice" className="px-4 py-4 text-slate-600">{item.invoice_number ?? "—"}</td><td data-label="Total" className="px-4 py-4 font-medium text-slate-900">₹{Number(item.total_amount).toLocaleString("en-IN")}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default PurchasesPage;
