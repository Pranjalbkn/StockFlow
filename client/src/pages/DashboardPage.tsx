import { useEffect, useState } from "react";
import { ArrowUpRight, CircleDollarSign, Package, ShoppingCart, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { getProducts } from "../services/inventoryApi";
import { getSales } from "../services/saleApi";
import type { Product } from "../types/Inventory";
import type { Sale } from "../types/Sale";
import type { User } from "../types/User";

type DashboardPageProps = {
  user: User;
  onLogout: () => void;
};

function DashboardPage({ user, onLogout }: DashboardPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    Promise.all([getProducts(), getSales()])
      .then(([productList, saleList]) => {
        setProducts(productList);
        setSales(saleList);
      })
      .catch(() => {
        setProducts([]);
        setSales([]);
      });
  }, []);

  const lowStock = products.filter((product) => product.quantity <= product.minimum_stock).length;
  const stockValue = products.reduce(
    (total, product) => total + Number(product.cost_price) * product.quantity,
    0,
  );
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlySales = sales
    .filter((sale) => sale.sale_date.startsWith(currentMonth))
    .reduce((total, sale) => total + Number(sale.total_amount), 0);
  const summaries = [
    { label: "Active products", value: String(products.length), detail: "Items in your catalogue", icon: Package, accent: "bg-blue-50 text-blue-700" },
    { label: "Low stock", value: String(lowStock), detail: "Need attention", icon: TriangleAlert, accent: "bg-amber-50 text-amber-700" },
    { label: "Stock value", value: `₹${stockValue.toLocaleString("en-IN")}`, detail: "At current cost", icon: ShoppingCart, accent: "bg-violet-50 text-violet-700" },
    { label: "Sales this month", value: `₹${monthlySales.toLocaleString("en-IN")}`, detail: `${sales.filter((sale) => sale.sale_date.startsWith(currentMonth)).length} transactions`, icon: CircleDollarSign, accent: "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <AppShell user={user} onLogout={onLogout}>
        <section className="flex min-w-0 flex-col justify-between gap-5 rounded-2xl bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-7 md:flex-row md:items-center lg:px-8">
          <div className="min-w-0"><p className="text-sm font-medium text-emerald-400">Business overview</p><h1 className="mt-2 break-words text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back, {user.name.split(" ")[0]}</h1><p className="mt-2 max-w-xl break-words text-sm leading-6 text-slate-400">Monitor stock health, sales activity and the operational state of {user.brandName}.</p></div>
          <div className="flex w-full shrink-0 flex-col gap-2 min-[420px]:flex-row md:w-auto"><Link to="/products" className="flex flex-1 items-center justify-center rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5">View inventory</Link><Link to="/sales" className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300">Record sale <ArrowUpRight size={16} /></Link></div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaries.map((summary) => {
            const Icon = summary.icon;
            return <article key={summary.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${summary.accent}`}><Icon size={19} /></div>
              <p className="mt-5 text-sm font-medium text-slate-600">{summary.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{summary.value}</p>
              <p className="mt-2 text-xs text-slate-400">{summary.detail}</p>
            </article>
          })}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6"><div className="flex flex-col items-start gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between"><div><p className="font-semibold text-slate-900">Inventory health</p><p className="mt-1 text-sm text-slate-500">Products currently at or below their low-stock level.</p></div><Link to="/products" className="shrink-0 text-sm font-medium text-emerald-700">Review products</Link></div>{lowStock === 0 ? <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-5 sm:mt-8 sm:px-5 sm:py-6"><p className="font-medium text-emerald-900">Stock levels look healthy</p><p className="mt-1 text-sm text-emerald-700">No active product is currently below its configured threshold.</p></div> : <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-5 sm:mt-8 sm:px-5 sm:py-6"><p className="font-medium text-amber-900">{lowStock} products need attention</p><p className="mt-1 text-sm text-amber-700">Review quantities before the next sales cycle.</p></div>}</article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6"><p className="font-semibold text-slate-900">Quick actions</p><div className="mt-4 space-y-2"><Link to="/sales" className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-700">Create invoice <ArrowUpRight size={16} /></Link>{user.role !== "SALESPERSON" && <Link to="/purchases" className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-700">Record purchase <ArrowUpRight size={16} /></Link>}<Link to="/reports" className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-700">View daily report <ArrowUpRight size={16} /></Link></div></article>
        </section>
    </AppShell>
  );
}

export default DashboardPage;
