import type { Employee } from "../types/Employee";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function request(path: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = await response.json();

  if (!response.ok) throw new Error(data.message ?? "Request failed");
  return data;
}

export async function getEmployees() {
  const data = await request("/api/employees");
  return data.employees as Employee[];
}

export async function createEmployee(details: {
  name: string;
  email: string;
  password: string;
  role: "MANAGER" | "SALESPERSON";
}) {
  const data = await request("/api/employees", {
    method: "POST",
    body: JSON.stringify(details),
  });
  return data.employee as Employee;
}

export async function updateEmployeeStatus(id: number, isActive: boolean) {
  const data = await request(`/api/employees/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
  return data.employee as Employee;
}

export async function updateBrandName(brandName: string) {
  const data = await request("/api/settings/brand", {
    method: "PUT",
    body: JSON.stringify({ brandName }),
  });
  return data.brandName as string;
}
