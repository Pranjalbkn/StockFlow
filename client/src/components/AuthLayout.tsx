import type { ReactNode } from "react";
import { BarChart3, Boxes, PackageCheck, ShieldCheck } from "lucide-react";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28rem)] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-400 text-slate-950"><PackageCheck size={23} /></div><div><p className="text-lg font-semibold">StockFlow</p><p className="text-xs text-slate-500">Inventory operations platform</p></div></div>
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">Run inventory with clarity</p>
          <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">Products, purchases, sales and reports in one dependable workspace.</h2>
          <div className="mt-10 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4"><Boxes className="text-emerald-400" size={20} /><p className="mt-3 text-sm font-medium">Stock control</p></div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4"><BarChart3 className="text-emerald-400" size={20} /><p className="mt-3 text-sm font-medium">Daily reports</p></div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4"><ShieldCheck className="text-emerald-400" size={20} /><p className="mt-3 text-sm font-medium">Role security</p></div>
          </div>
        </div>
        <p className="text-xs text-slate-600">Built for small teams that need reliable stock visibility.</p>
      </section>

      <section className="grid min-h-screen min-w-0 place-items-center px-4 py-7 sm:px-10 sm:py-10">
        <div className="w-full max-w-md">
          <header className="mb-8 flex items-center gap-3 lg:hidden"><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-emerald-400"><PackageCheck size={21} /></div><div><p className="font-semibold text-slate-900">StockFlow</p><p className="text-xs text-slate-500">Inventory operations</p></div></header>
          <section className="min-w-0 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.09)] sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Secure workspace</p>
            <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            {children}
          </section>
        </div>
      </section>
    </main>
  );
}

export default AuthLayout;
