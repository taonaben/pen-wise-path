import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Leaf } from "lucide-react";
import { sidebarConfig, type SidebarItem } from "@/shared/config/sidebar";
import { theme } from "@/shared/config/theme";
import { cn } from "@/lib/utils";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { useFarmPermissions } from "@/features/farm/hooks/useFarmPermissions";

function isItemActive(item: SidebarItem, pathname: string) {
  if (item.path && pathname === item.path) return true;
  if (item.children?.some((c) => pathname === c.path || pathname.startsWith(c.path + "/")))
    return true;
  return false;
}

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { currentFarm, currentRole } = useCurrentFarm();
  const { can } = useFarmPermissions(currentRole);
  const visibleSidebar = sidebarConfig
    .filter((item) => !item.permission || can(item.permission))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => !child.permission || can(child.permission)),
    }))
    .filter((item) => item.path || (item.children && item.children.length > 0));
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    visibleSidebar.forEach((i) => {
      if (i.children && isItemActive(i, pathname)) init[i.title] = true;
    });
    return init;
  });

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-farm-lime/15 text-farm-lime flex items-center justify-center">
            <Leaf className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight">{theme.appName}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full bg-farm-lime/15 text-farm-lime px-2 py-0.5">
                {theme.badge}
              </span>
            </div>
            <div className="text-[11px] text-farm-muted mt-0.5">{currentFarm.name}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleSidebar.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item, pathname);

          if (!item.children) {
            return (
              <Link
                key={item.title}
                to={item.path!}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-farm-lime/15 text-farm-lime"
                    : "text-sidebar-foreground/80 hover:bg-farm-700/40 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          }

          const isOpen = open[item.title] ?? active;
          return (
            <div key={item.title}>
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [item.title]: !isOpen }))}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-farm-lime"
                    : "text-sidebar-foreground/80 hover:bg-farm-700/40 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.title}</span>
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")}
                />
              </button>
              {isOpen && (
                <div className="mt-1 ml-7 pl-3 border-l border-sidebar-border space-y-0.5">
                  {item.children.map((c) => {
                    const childActive = pathname === c.path;
                    return (
                      <Link
                        key={c.path}
                        to={c.path}
                        className={cn(
                          "block rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                          childActive
                            ? "bg-farm-lime/15 text-farm-lime font-medium"
                            : "text-sidebar-foreground/70 hover:text-foreground hover:bg-farm-700/30",
                        )}
                      >
                        {c.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-xl bg-farm-800/60 p-3 text-xs text-farm-muted">{theme.tagline}</div>
      </div>
    </aside>
  );
}
