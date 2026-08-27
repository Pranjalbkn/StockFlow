import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import { login } from "../services/authApi";
import type { User } from "../types/User";

type LoginPageProps = { onLogin: (user: User) => void };

function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      onLogin(await login({ email, password }));
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Sign in" description="Access your inventory and sales workspace.">
      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <FormField id="email" label="Email address" type="email" value={email} autoComplete="email" placeholder="you@company.com" onChange={setEmail} />
        <FormField id="password" label="Password" type="password" value={password} autoComplete="current-password" placeholder="Enter your password" onChange={setPassword} />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={submitting} className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        New to StockFlow? <Link className="font-semibold text-emerald-700 hover:underline" to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}

export default LoginPage;
