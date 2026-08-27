import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { getDailyReport } from "../services/reportApi";
import type { DailyReport } from "../types/DailyReport";
import type { User } from "../types/User";

type ReportsPageProps = {
  user: User;
  onLogout: () => void;
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function ReportsPage({ user, onLogout }: ReportsPageProps) {
  const [date, setDate] = useState(getToday());
  const [report, setReport] = useState<DailyReport | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    getDailyReport(date)
      .then(setReport)
      .catch((requestError) => setError((requestError as Error).message));
  }, [date]);

  const cards = report ? [
    { label: "Sales revenue", value: `₹${Number(report.salesTotal).toLocaleString("en-IN")}` },
    { label: "Sales recorded", value: String(report.salesCount) },
    { label: "Units sold", value: String(report.unitsSold) },
    { label: "Purchase spending", value: `₹${Number(report.purchaseTotal).toLocaleString("en-IN")}` },
    { label: "Purchases recorded", value: String(report.purchaseCount) },
    { label: "Low-stock products", value: String(report.lowStockProducts) },
  ] : [];

  return (
    <AppShell user={user} onLogout={onLogout}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-700">Reporting</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Daily report</h1>
          <p className="mt-2 text-slate-600">Review sales and purchasing activity for a selected day.</p>
        </div>
        <label className="w-full text-sm font-medium text-slate-700 sm:w-auto">Report date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600" /></label>
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {report && (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => <article key={card.label} className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-200/60"><p className="text-sm text-slate-500">{card.label}</p><p className="mt-3 text-2xl font-semibold text-slate-900">{card.value}</p></article>)}
          </section>

          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm shadow-slate-200/60">
            <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Top-selling products</h2></div>
            {report.topProducts.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">No products were sold on this date.</div>
            ) : (
              <div className="divide-y divide-slate-100">{report.topProducts.map((product) => <div key={product.sku} className="flex min-w-0 items-center justify-between gap-3 px-4 py-4 sm:px-5"><div className="min-w-0"><p className="break-words font-medium text-slate-900">{product.name}</p><p className="mt-1 break-all text-xs text-slate-500">{product.sku}</p></div><p className="shrink-0 text-sm font-semibold text-slate-900">{product.quantity} units</p></div>)}</div>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}

export default ReportsPage;
