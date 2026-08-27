import type { User } from "../types/User";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

type AuthDetails = { email: string; password: string };
type RegisterDetails = AuthDetails & { name: string };

async function authRequest(path: string, details: AuthDetails | RegisterDetails) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(details),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Something went wrong");
  }

  return data.user as User;
}

export function login(details: AuthDetails) {
  return authRequest("/api/auth/login", details);
}

export function register(details: RegisterDetails) {
  return authRequest("/api/auth/register", details);
}

export async function getCurrentUser() {
  const response = await fetch(`${API_URL}/api/auth/me`, { credentials: "include" });

  if (!response.ok) throw new Error("Not authenticated");

  const data = await response.json();
  return data.user as User;
}

export async function logout() {
  await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}
