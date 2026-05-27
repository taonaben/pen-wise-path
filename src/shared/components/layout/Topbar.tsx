import { useRouterState, useNavigate } from "@tanstack/react-router";
import { Bell, Search, LogOut } from "lucide-react";
import { sidebarConfig } from "@/shared/config/sidebar";
import { theme } from "@/shared/config/theme";
import { authService } from "@/features/auth/services/authService";

function deriveTitle(pathname: string): string {
  for (const item of sidebarConfig) {
    if (item.path === pathname) return item.title;
    if (item.children) {
      const c = item.children.find((c) => pathname === c.path || pathname.startsWith(c.path + "/"));
      if (c) return c.title;
    }
  }
  return "PenSmart";
}

export function Topbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const title = deriveTitle(pathname);

  const handleLogout = async () => {
    await authService.logout();
    navigate({ to: "/login" });
  };

  return (
    <header className="h-16 border-b bg-farm-900/60 backdrop-blur-md flex items-center gap-4 px-6 sticky top-0 z-10">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <div className="text-[11px] text-farm-muted">{theme.defaultFarmName}</div>
      </div>

      <div className="ml-6 flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-farm-muted" />
          <input
            placeholder="Search animals, feed, members…"
            className="w-full rounded-full bg-farm-800/70 border pl-9 pr-4 py-2 text-sm placeholder:text-farm-muted/70 focus:outline-none focus:ring-2 focus:ring-farm-lime/40"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="h-9 w-9 rounded-full bg-farm-800/70 border flex items-center justify-center text-farm-muted hover:text-foreground transition">
          <Bell className="h-4 w-4" />
        </button>
        <div className="h-9 px-3 rounded-full bg-farm-800/70 border flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-farm-lime text-farm-950 text-xs font-bold flex items-center justify-center">
            FM
          </div>
          <span className="text-xs text-farm-muted hidden sm:inline">Farm Manager</span>
        </div>
        <button
          onClick={handleLogout}
          className="h-9 w-9 rounded-full bg-farm-800/70 border flex items-center justify-center text-farm-muted hover:text-farm-danger transition"
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
