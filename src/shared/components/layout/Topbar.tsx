import { useEffect, useState } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Menu, Search } from "lucide-react";
import { sidebarConfig } from "@/shared/config/sidebar";
import { authService } from "@/features/auth/services/authService";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { useFarmPermissions } from "@/features/farm/hooks/useFarmPermissions";
import { GlobalSearchBox } from "@/features/search/components/GlobalSearchBox";

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

type TopbarProps = {
  onOpenMobileSidebar: () => void;
};

export function Topbar({ onOpenMobileSidebar }: TopbarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { currentFarm, currentRole } = useCurrentFarm();
  const { permissions } = useFarmPermissions(currentRole);
  const title = deriveTitle(pathname);
  const roleLabel = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);
  const farmInitials =
    currentFarm.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "F";

  useEffect(() => {
    setMobileSearchOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await authService.logout();
    navigate({ to: "/login" });
  };

  return (
    <header className="h-16 border-b bg-farm-900/60 backdrop-blur-md flex items-center gap-4 px-6 sticky top-0 z-10">
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        className="lg:hidden h-9 w-9 rounded-full bg-farm-800/70 border flex items-center justify-center text-farm-muted hover:text-foreground transition"
        aria-label="Open sidebar"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <div className="text-[11px] text-farm-muted">{currentFarm.name}</div>
      </div>

      <div className="ml-6 flex-1 max-w-md hidden md:block">
        <GlobalSearchBox
          farmId={currentFarm.id}
          permissions={{
            viewAnimals: permissions.viewAnimals,
            globalSearchMembers: permissions.globalSearchMembers,
            globalSearchAuditLogs: permissions.globalSearchAuditLogs,
          }}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMobileSearchOpen((open) => !open)}
          className="md:hidden h-9 w-9 rounded-full bg-farm-800/70 border flex items-center justify-center text-farm-muted hover:text-foreground transition"
          aria-label="Open search"
          aria-expanded={mobileSearchOpen}
        >
          <Search className="h-4 w-4" />
        </button>
        <button className="h-9 w-9 rounded-full bg-farm-800/70 border flex items-center justify-center text-farm-muted hover:text-foreground transition">
          <Bell className="h-4 w-4" />
        </button>
        <div className="h-9 px-3 rounded-full bg-farm-800/70 border flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-farm-lime text-farm-950 text-xs font-bold flex items-center justify-center">
            {farmInitials}
          </div>
          <span className="text-xs text-farm-muted hidden sm:inline">{roleLabel}</span>
        </div>
        <button
          onClick={handleLogout}
          className="h-9 w-9 rounded-full bg-farm-800/70 border flex items-center justify-center text-farm-muted hover:text-farm-danger transition"
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {mobileSearchOpen && (
        <div className="fixed left-3 right-3 top-18 z-50 md:hidden rounded-xl border bg-farm-900/95 p-2 shadow-xl backdrop-blur">
          <GlobalSearchBox
            className="w-full"
            farmId={currentFarm.id}
            permissions={{
              viewAnimals: permissions.viewAnimals,
              globalSearchMembers: permissions.globalSearchMembers,
              globalSearchAuditLogs: permissions.globalSearchAuditLogs,
            }}
          />
        </div>
      )}
    </header>
  );
}
