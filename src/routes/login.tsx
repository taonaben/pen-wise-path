import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Leaf } from "lucide-react";
import { authService } from "@/features/auth/services/authService";
import { theme } from "@/shared/config/theme";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.loginWithPassword(email, password);
      toast.success("Welcome back");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-farm-950 p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(183,243,74,0.08),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(34,197,94,0.06),transparent_55%)] pointer-events-none" />
      <div className="relative w-full max-w-md rounded-3xl border bg-farm-900/80 backdrop-blur p-8 shadow-2xl">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-10 w-10 rounded-xl bg-farm-lime/15 text-farm-lime flex items-center justify-center">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">{theme.appName}</div>
            <div className="text-[11px] text-farm-muted">{theme.tagline}</div>
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-farm-muted">
          Manage your feedlot operations from one place.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-farm-muted mb-1.5">
              Email or Username
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@farm.com"
              className="w-full rounded-xl bg-farm-800/80 border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-farm-lime/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-farm-muted mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-farm-800/80 border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-farm-lime/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-farm-lime text-farm-950 font-semibold py-2.5 text-sm hover:bg-farm-limeSoft transition disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="flex items-center justify-between text-xs">
            <a href="#" className="text-farm-muted hover:text-farm-lime">
              Forgot password?
            </a>
            <Link to="/register" className="text-farm-muted hover:text-farm-lime">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
