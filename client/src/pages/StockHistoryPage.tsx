import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { getStockMovements } from "../services/stockMovementApi";
import type { StockMovement } from "../types/StockMovement";
import type { User } from "../types/User";

type StockHistoryPageProps = {
  user: User;
  onLogout: () => void;
};

function StockHistoryPage({ user, onLogout }: StockHistoryPageProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [error, setError] = useState("");

  useEffect(() => {
    getStockMovements()
      .then(setMovements)
      .catch((requestError) => setError((requestError as Error).message));
  }, []);

  const filteredMovements = movements.filter((movement) => {
    const matchesType = type === "ALL" || movement.movement_type === type;
    const searchText = `${movement.product_name} ${movement.sku}`.toLowerCase();
    return matchesType && searchText.includes(search.toLowerCase());
  });

  return (
    <AppShell user={user} onLogout={onLogout}>
      <p className="text-sm font-medium text-emerald-700">Inventory</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Stock history</h1>
      <p className="mt-2 text-slate-600">Review every recorded change to your inventory.</p>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="mt-6 min-w-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm shadow-slate-200/60 sm:mt-8">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product or SKU" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 sm:max-w-xs" />
          <select value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-600 sm:w-auto">
            <option value="ALL">All movement types</option>
            <option value="INITIAL">Initial stock</option>
            <option value="PURCHASE">Purchases</option>
            <option value="SALE">Sales</option>
            <option value="ADJUSTMENT">Adjustments</option>
            <option value="RETURN">Returns</option>
            <option value="DAMAGE">Damaged stock</option>
          </select>
        </div>

        {filteredMovements.length === 0 ? (
          <div className="px-6 py-16 text-center"><p className="font-medium text-slate-900">No stock movements found</p><p className="mt-2 text-sm text-slate-500">Purchases, sales, and adjustments will appear here.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="responsive-table w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Change</th><th className="px-4 py-3">Reference</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td data-label="Date" className="whitespace-nowrap px-4 py-4 text-slate-600">{new Date(movement.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td data-label="Product" className="px-4 py-4"><div className="min-w-0"><p className="break-words font-medium text-slate-900">{movement.product_name}</p><p className="mt-1 break-all text-xs text-slate-500">{movement.sku}</p></div></td>
                    <td data-label="Type" className="px-4 py-4 text-slate-700">{movement.movement_type}</td>
                    <td data-label="Change" className={`px-4 py-4 font-semibold ${movement.quantity_change > 0 ? "text-emerald-700" : "text-red-700"}`}>{movement.quantity_change > 0 ? "+" : ""}{movement.quantity_change}</td>
                    <td data-label="Reference" className="px-4 py-4 text-slate-500">{movement.reference_type ? `${movement.reference_type} #${movement.reference_id}` : movement.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}

export default StockHistoryPage;
