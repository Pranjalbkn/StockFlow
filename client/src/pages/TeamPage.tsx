import { type FormEvent, useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import {
  createEmployee,
  getEmployees,
  updateBrandName,
  updateEmployeeStatus,
} from "../services/teamApi";
import type { Employee } from "../types/Employee";
import type { User } from "../types/User";

type TeamPageProps = {
  user: User;
  onLogout: () => void;
  onBrandChange: (brandName: string) => void;
};

function TeamPage({ user, onLogout, onBrandChange }: TeamPageProps) {
  const [brandName, setBrandName] = useState(user.brandName);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employee, setEmployee] = useState({
    name: "",
    email: "",
    password: "",
    role: "SALESPERSON" as "MANAGER" | "SALESPERSON",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getEmployees()
      .then(setEmployees)
      .catch((requestError) => setError((requestError as Error).message));
  }, []);

  function clearNotices() {
    setError("");
    setMessage("");
  }

  async function handleBrandSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearNotices();

    try {
      const updatedName = await updateBrandName(brandName);
      onBrandChange(updatedName);
      setMessage("Brand name updated");
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  async function handleEmployeeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearNotices();

    try {
      const savedEmployee = await createEmployee(employee);
      setEmployees((current) => [savedEmployee, ...current]);
      setEmployee({ name: "", email: "", password: "", role: "SALESPERSON" });
      setMessage("Employee account created");
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  async function toggleEmployee(item: Employee) {
    clearNotices();

    try {
      const updated = await updateEmployeeStatus(item.id, !item.is_active);
      setEmployees((current) => current.map((employeeItem) => employeeItem.id === updated.id ? updated : employeeItem));
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  const inputClass = "mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50/40 px-3 py-2.5 text-sm shadow-sm outline-none hover:border-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15";
  const labelClass = "block text-sm font-medium text-slate-700";

  return (
    <AppShell user={user} onLogout={onLogout}>
      <p className="text-sm font-medium text-emerald-700">Administration</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Team & brand</h1>
      <p className="mt-2 text-slate-600">Manage the shared brand identity and employee access.</p>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}

      <div className="mt-6 grid min-w-0 gap-5 sm:mt-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-6">
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-200/60">
            <h2 className="font-semibold text-slate-900">Brand name</h2>
            <p className="mt-1 text-sm text-slate-500">This name appears for the owner and every employee.</p>
            <form onSubmit={handleBrandSubmit} className="mt-4 space-y-3">
              <label className={labelClass}>Business or brand name<input required minLength={2} value={brandName} onChange={(event) => setBrandName(event.target.value)} className={inputClass} /></label>
              <button className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Save brand name</button>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-200/60">
            <h2 className="font-semibold text-slate-900">Add employee</h2>
            <form onSubmit={handleEmployeeSubmit} className="mt-4 space-y-3">
              <label className={labelClass}>Full name<input required minLength={2} value={employee.name} onChange={(event) => setEmployee({ ...employee, name: event.target.value })} className={inputClass} /></label>
              <label className={labelClass}>Email address<input type="email" required value={employee.email} onChange={(event) => setEmployee({ ...employee, email: event.target.value })} className={inputClass} /></label>
              <label className={labelClass}>Temporary password<input type="password" minLength={8} required value={employee.password} onChange={(event) => setEmployee({ ...employee, password: event.target.value })} className={inputClass} /></label>
              <label className={labelClass}>Role<select value={employee.role} onChange={(event) => setEmployee({ ...employee, role: event.target.value as "MANAGER" | "SALESPERSON" })} className={inputClass}><option value="SALESPERSON">Salesperson</option><option value="MANAGER">Manager</option></select></label>
              <button className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Create employee</button>
            </form>
          </section>
        </div>

        <section className="min-w-0 self-start overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm shadow-slate-200/60">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Employees</h2></div>
          {employees.length === 0 ? (
            <div className="px-6 py-16 text-center"><p className="font-medium text-slate-900">No employees yet</p><p className="mt-2 text-sm text-slate-500">Create the first employee account using the form.</p></div>
          ) : (
            <div className="divide-y divide-slate-100">{employees.map((item) => (
              <div key={item.id} className="flex min-w-0 flex-col items-start gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0"><p className="break-words font-medium text-slate-900">{item.name}</p><p className="mt-1 break-all text-sm text-slate-500">{item.email} · {item.role === "MANAGER" ? "Manager" : "Salesperson"}</p></div>
                <button type="button" onClick={() => toggleEmployee(item)} className={`w-full shrink-0 rounded-lg border px-3 py-2 text-sm font-medium sm:w-auto ${item.is_active ? "border-red-200 text-red-700" : "border-emerald-200 text-emerald-700"}`}>{item.is_active ? "Deactivate" : "Activate"}</button>
              </div>
            ))}</div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default TeamPage;
