import { type FormEvent, useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { getProducts } from "../services/inventoryApi";
import { createSale, getSales } from "../services/saleApi";
import { getInvoice } from "../services/saleApi";
import { downloadInvoice, shareInvoice } from "../services/invoicePdf";
import { Download, MessageCircle, Plus, Trash2 } from "lucide-react";
import type { Product } from "../types/Inventory";
import type { Sale } from "../types/Sale";
import type { User } from "../types/User";

type SalesPageProps = {
  user: User;
  onLogout: () => void;
};

type SaleItem = {
  productId: number;
  quantity: number;
  unitPrice: number;
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function SalesPage({ user, onLogout }: SalesPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [sale, setSale] = useState({
    customerName: "",
    customerPhone: "",
    invoiceNumber: "",
    saleDate: getToday(),
  });
  const [draftItem, setDraftItem] = useState<SaleItem>({
    productId: 0,
    quantity: 1,
    unitPrice: 0,
  });
  const [items, setItems] = useState<SaleItem[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([getProducts(), getSales()])
      .then(([productList, saleList]) => {
        setProducts(productList);
        setSales(saleList);
      })
      .catch((requestError) => setError((requestError as Error).message));
  }, []);

  function selectProduct(productId: number) {
    const product = products.find((item) => item.id === productId);
    setDraftItem({
      ...draftItem,
      productId,
      unitPrice: product ? Number(product.selling_price) : 0,
    });
  }

  function addItem() {
    setError("");
    const product = products.find((item) => item.id === draftItem.productId);

    if (!product) {
      setError("Please select a product.");
      return;
    }
    if (items.some((item) => item.productId === draftItem.productId)) {
      setError("This product is already in the sale. Remove it first if you want to change it.");
      return;
    }
    if (draftItem.quantity < 1 || draftItem.quantity > product.quantity) {
      setError(`Only ${product.quantity} units of ${product.name} are available.`);
      return;
    }

    setItems([...items, draftItem]);
    setDraftItem({ productId: 0, quantity: 1, unitPrice: 0 });
  }

  function removeItem(productId: number) {
    setItems(items.filter((item) => item.productId !== productId));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      await createSale({ ...sale, items });
      const [productList, saleList] = await Promise.all([getProducts(), getSales()]);
      setProducts(productList);
      setSales(saleList);
      setSale({
        customerName: "",
        customerPhone: "",
        invoiceNumber: "",
        saleDate: getToday(),
      });
      setItems([]);
      setDraftItem({ productId: 0, quantity: 1, unitPrice: 0 });
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadInvoice(saleId: number) {
    setError("");
    try {
      await downloadInvoice(await getInvoice(saleId));
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  async function handleShareInvoice(saleId: number) {
    setError("");
    setMessage("");
    try {
      const result = await shareInvoice(await getInvoice(saleId));
      setMessage(result === "shared" ? "Invoice opened in the device share menu." : "PDF downloaded and WhatsApp opened. Attach the downloaded PDF to the chat.");
    } catch (requestError) {
      if ((requestError as Error).name !== "AbortError") {
        setError((requestError as Error).message);
      }
    }
  }

  const selectedProduct = products.find((item) => item.id === draftItem.productId);
  const saleTotal = items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  const inputClass = "mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50/40 px-3 py-2.5 text-sm shadow-sm outline-none hover:border-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15";
  const labelClass = "block text-sm font-medium text-slate-700";

  return (
    <AppShell user={user} onLogout={onLogout}>
      <p className="text-sm font-medium text-emerald-700">Inventory</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Sales</h1>
      <p className="mt-2 text-slate-600">Record outgoing stock and review your sales history.</p>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}

      <div className="mt-6 grid min-w-0 gap-5 sm:mt-8 xl:grid-cols-[440px_minmax(0,1fr)] xl:gap-6">
        <section className="self-start rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-200/60">
          <h2 className="font-semibold text-slate-900">Record sale</h2>
          {products.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-slate-500">Add a product before recording a sale.</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-5">
              <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                <label className={labelClass}>Customer <span className="font-normal text-slate-400">(optional)</span><input value={sale.customerName} onChange={(event) => setSale({ ...sale, customerName: event.target.value })} className={inputClass} /></label>
                <label className={labelClass}>WhatsApp <span className="font-normal text-slate-400">(optional)</span><input type="tel" value={sale.customerPhone} onChange={(event) => setSale({ ...sale, customerPhone: event.target.value })} placeholder="919876543210" className={inputClass} /></label>
              </div>
              <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                <label className={labelClass}>Sale date<input type="date" required value={sale.saleDate} onChange={(event) => setSale({ ...sale, saleDate: event.target.value })} className={inputClass} /></label>
                <label className={labelClass}>Invoice no. <span className="font-normal text-slate-400">(optional)</span><input value={sale.invoiceNumber} onChange={(event) => setSale({ ...sale, invoiceNumber: event.target.value })} className={inputClass} /></label>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <p className="text-sm font-semibold text-slate-900">Add products</p>
                <label className={`${labelClass} mt-3`}>Product
                <select value={draftItem.productId || ""} onChange={(event) => selectProduct(Number(event.target.value))} className={inputClass}>
                  <option value="">Select product</option>
                  {products.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.quantity} available</option>)}
                </select>
              </label>
              {selectedProduct && <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">Available stock: <strong className="text-slate-900">{selectedProduct.quantity}</strong></p>}
              <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                <label className={labelClass}>Quantity<input type="number" min="1" max={selectedProduct?.quantity} value={draftItem.quantity} onChange={(event) => setDraftItem({ ...draftItem, quantity: Number(event.target.value) })} className={inputClass} /></label>
                <label className={labelClass}>Unit price<input type="number" min="0" step="0.01" value={draftItem.unitPrice} onChange={(event) => setDraftItem({ ...draftItem, unitPrice: Number(event.target.value) })} className={inputClass} /></label>
              </div>
                <button type="button" onClick={addItem} disabled={!draftItem.productId} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-700 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"><Plus size={16} /> Add item</button>
              </div>

              {items.length > 0 && <div className="overflow-hidden rounded-lg border border-slate-200">
                {items.map((item) => {
                  const product = products.find((productItem) => productItem.id === item.productId);
                  return <div key={item.productId} className="flex items-center gap-3 border-b border-slate-100 px-3 py-3 last:border-0">
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900">{product?.name}</p><p className="text-xs text-slate-500">{item.quantity} × ₹{item.unitPrice.toLocaleString("en-IN")}</p></div>
                    <p className="text-sm font-semibold text-slate-900">₹{(item.quantity * item.unitPrice).toLocaleString("en-IN")}</p>
                    <button type="button" onClick={() => removeItem(item.productId)} title="Remove item" className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>;
                })}
              </div>}

              <div className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 text-sm text-white"><span>Invoice total</span><strong className="text-base">₹{saleTotal.toLocaleString("en-IN")}</strong></div>
              <button disabled={saving || items.length === 0} className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">{saving ? "Saving..." : `Record sale (${items.length} ${items.length === 1 ? "item" : "items"})`}</button>
            </form>
          )}
        </section>

        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm shadow-slate-200/60">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Sales history</h2></div>
          {sales.length === 0 ? (
            <div className="px-6 py-16 text-center"><p className="font-medium text-slate-900">No sales yet</p><p className="mt-2 text-sm text-slate-500">Recorded sales will appear here.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="responsive-table w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Invoice</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{sales.map((item) => <tr key={item.id}><td data-label="Date" className="px-4 py-4 text-slate-700">{new Date(item.sale_date).toLocaleDateString("en-IN")}</td><td data-label="Customer" className="px-4 py-4"><div className="min-w-0"><p className="break-words font-medium text-slate-900">{item.customer_name ?? "Walk-in customer"}</p><p className="mt-1 break-all text-xs text-slate-500">{item.customer_phone ?? item.created_by_name ?? "—"}</p></div></td><td data-label="Total" className="px-4 py-4 font-medium text-slate-900">₹{Number(item.total_amount).toLocaleString("en-IN")}</td><td data-label="Invoice" className="px-4 py-4"><div className="flex gap-2"><button type="button" onClick={() => handleDownloadInvoice(item.id)} title="Download PDF" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><Download size={16} /></button><button type="button" onClick={() => handleShareInvoice(item.id)} title="Share on WhatsApp" className="rounded-lg border border-emerald-200 p-2 text-emerald-700 hover:bg-emerald-50"><MessageCircle size={16} /></button></div></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default SalesPage;
