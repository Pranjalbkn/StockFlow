import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  ReceiptText,
  Settings,
  ShoppingCart,
  AudioLines,
} from "lucide-react";
import { logout } from "../services/authApi";
import type { User } from "../types/User";

type AppShellProps = {
  user: User;
  onLogout: () => void;
  children: ReactNode;
};

function AppShell({ user, onLogout, children }: AppShellProps) {
  async function handleLogout() {
    await logout();
    onLogout();
  }

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/products", label: "Products", icon: Boxes },
    ...(user.role === "SALESPERSON" ? [] : [{ to: "/purchases", label: "Purchases", icon: ShoppingCart }]),
    { to: "/sales", label: "Sales & invoices", icon: ReceiptText },
    { to: "/voice-entry", label: "Voice entry", icon: AudioLines },
    { to: "/stock-history", label: "Stock history", icon: History },
    { to: "/reports", label: "Reports", icon: BarChart3 },
    ...(user.role === "OWNER" ? [{ to: "/team", label: "Team & brand", icon: Settings }] : []),
  ];

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
      isActive
        ? "bg-emerald-500/15 text-emerald-300"
        : "text-slate-400 hover:bg-white/5 hover:text-white"
    }`;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${
      isActive ? "bg-slate-900 text-white" : "text-slate-600"
    }`;

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-[#f5f7fa] lg:flex">
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-gradient-to-b from-slate-950 via-slate-950 to-emerald-950 px-4 py-5 lg:sticky lg:top-0 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/40"><PackageCheck size={21} strokeWidth={2.4} /></div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{user.brandName}</p>
            <p className="text-xs text-slate-500">StockFlow workspace</p>
          </div>
        </div>

        <div className="mt-8 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">Workspace</div>
        <nav className="mt-3 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return <NavLink key={link.to} to={link.to} className={desktopLinkClass}><Icon size={18} />{link.label}</NavLink>;
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.06] p-3 shadow-lg shadow-black/10">
          <p className="truncate text-sm font-medium text-white">{user.name}</p>
          <p className="mt-0.5 text-xs capitalize text-slate-500">{user.role.toLowerCase()}</p>
          <button type="button" onClick={handleLogout} className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"><LogOut size={16} />Sign out</button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.055),transparent_32rem)]">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur lg:hidden">
          <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-900 text-emerald-400"><PackageCheck size={19} /></div>
              <div className="min-w-0"><p className="truncate font-semibold text-slate-900">{user.brandName}</p><p className="text-xs text-slate-500">{user.name} · {user.role.toLowerCase()}</p></div>
            </div>
            <button type="button" onClick={handleLogout} className="rounded-lg border border-slate-200 p-2 text-slate-600"><LogOut size={18} /></button>
          </div>
          <nav className="flex max-w-full gap-1 overflow-x-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {links.map((link) => <NavLink key={link.to} to={link.to} className={mobileLinkClass}>{link.label}</NavLink>)}
          </nav>
        </header>

        <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-8 shadow-sm backdrop-blur lg:flex">
          <div className="flex items-center gap-2 text-sm text-slate-500"><ClipboardList size={17} />Inventory operations</div>
          <div className="flex items-center gap-4"><div className="text-right"><p className="text-sm font-medium text-slate-900">{user.name}</p><p className="text-xs capitalize text-slate-500">{user.role.toLowerCase()}</p></div><button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><LogOut size={16} />Sign out</button></div>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-7xl overflow-x-hidden px-4 py-6 pb-24 sm:px-6 sm:py-7 sm:pb-24 lg:px-10 lg:py-9 lg:pb-24">{children}</main>

        <NavLink
          to="/voice-entry"
          aria-label="Open voice stock entry"
          title="Voice stock entry"
          className={({ isActive }) => `fixed bottom-5 right-4 z-40 flex h-14 items-center justify-center gap-2 rounded-full border px-4 shadow-xl shadow-slate-900/20 transition sm:bottom-6 sm:right-6 sm:h-auto sm:min-h-12 sm:px-5 ${isActive ? "border-emerald-300 bg-emerald-100 text-emerald-900" : "border-emerald-300 bg-emerald-500 text-slate-950 hover:bg-emerald-400"}`}
        >
          <AudioLines size={20} strokeWidth={2.4} />
          <span className="hidden text-sm font-semibold sm:inline">Voice entry</span>
        </NavLink>
      </div>
    </div>
  );
}

export default AppShell;
