import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Leaf, X } from "lucide-react";
import { sidebarConfig, type SidebarItem } from "@/shared/config/sidebar";
import { theme } from "@/shared/config/theme";
import { cn } from "@/lib/utils";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { useFarmPermissions } from "@/features/farm/hooks/useFarmPermissions";

type SidebarProps = {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

function isItemActive(item: SidebarItem, pathname: string) {
  if (item.path && pathname === item.path) return true;
  if (item.children?.some((c) => pathname === c.path || pathname.startsWith(c.path + "/"))) {
    return true;
  }
  return false;
}

export function Sidebar({ mobileOpen, onMobileOpenChange }: SidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { currentFarm, currentRole } = useCurrentFarm();
  const { can } = useFarmPermissions(currentRole);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);

  const visibleSidebar = sidebarConfig
    .filter((item) => !item.permission || can(item.permission))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => !child.permission || can(child.permission)),
    }))
    .filter((item) => item.path || (item.children && item.children.length > 0));

  const meSidebarItem = visibleSidebar.find((item) => item.path === "/settings");
  const farmModuleItems = visibleSidebar.filter((item) => item.path !== "/settings");

  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    visibleSidebar.forEach((i) => {
      if (i.children && isItemActive(i, pathname)) init[i.title] = true;
    });
    return init;
  });

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onMobileOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onMobileOpenChange]);

  const renderSidebarContent = (expanded: boolean, onNavigate?: () => void) => (
    <>
      <div className="px-4 py-4 border-b border-sidebar-border">
        <div className={cn("flex items-center gap-2.5", !expanded && "justify-center")}>
          <div className="h-9 w-9 rounded-xl bg-farm-lime/15 text-farm-lime flex items-center justify-center shrink-0">
            <Leaf className="h-5 w-5" />
          </div>
          {expanded && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-tight truncate">
                  {theme.appName}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full bg-farm-lime/15 text-farm-lime px-2 py-0.5 shrink-0">
                  {theme.badge}
                </span>
              </div>
              <div className="text-[11px] text-farm-muted mt-0.5 truncate">{currentFarm.name}</div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {farmModuleItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item, pathname);

          if (!item.children) {
            return (
              <Link
                key={item.title}
                to={item.path!}
                onClick={() => onNavigate?.()}
                title={!expanded ? item.title : undefined}
                className={cn(
                  "flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  expanded ? "gap-3 justify-start" : "justify-center",
                  active
                    ? "bg-farm-lime/15 text-farm-lime"
                    : "text-sidebar-foreground/80 hover:bg-farm-700/40 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {expanded && <span className="truncate">{item.title}</span>}
              </Link>
            );
          }

          const isOpen = open[item.title] ?? active;
          return (
            <div key={item.title}>
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [item.title]: !isOpen }))}
                title={!expanded ? item.title : undefined}
                className={cn(
                  "w-full flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  expanded ? "gap-3" : "justify-center",
                  active
                    ? "text-farm-lime"
                    : "text-sidebar-foreground/80 hover:bg-farm-700/40 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {expanded && (
                  <>
                    <span className="flex-1 text-left truncate">{item.title}</span>
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")}
                    />
                  </>
                )}
              </button>
              {expanded && isOpen && (
                <div className="mt-1 ml-7 pl-3 border-l border-sidebar-border space-y-0.5">
                  {item.children.map((c) => {
                    const childActive = pathname === c.path;
                    return (
                      <Link
                        key={c.path}
                        to={c.path}
                        onClick={() => onNavigate?.()}
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

      {meSidebarItem && (
        <div className="border-t border-sidebar-border px-3 py-3">
          <Link
            to={meSidebarItem.path!}
            onClick={() => onNavigate?.()}
            title={!expanded ? meSidebarItem.title : undefined}
            className={cn(
              "flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              expanded ? "gap-3 justify-start" : "justify-center",
              isItemActive(meSidebarItem, pathname)
                ? "bg-farm-lime/15 text-farm-lime"
                : "text-sidebar-foreground/80 hover:bg-farm-700/40 hover:text-foreground",
            )}
          >
            <meSidebarItem.icon className="h-4 w-4 shrink-0" />
            {expanded && <span className="truncate">{meSidebarItem.title}</span>}
          </Link>
        </div>
      )}

      <div className="border-t border-sidebar-border p-3">
        {expanded ? (
          <div className="rounded-xl bg-farm-800/60 p-3 text-xs text-farm-muted">
            {theme.tagline}
          </div>
        ) : (
          <div className="h-8 rounded-xl bg-farm-800/60" />
        )}
      </div>
    </>
  );

  return (
    <>
      <div
        className={cn("fixed inset-0 z-50 lg:hidden", mobileOpen ? "" : "pointer-events-none")}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          aria-label="Close sidebar"
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => onMobileOpenChange(false)}
        />

        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="h-14 border-b border-sidebar-border px-4 flex items-center justify-end">
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => onMobileOpenChange(false)}
              className="h-8 w-8 rounded-md bg-farm-800/60 border border-sidebar-border flex items-center justify-center text-farm-muted hover:text-foreground transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {renderSidebarContent(true, () => onMobileOpenChange(false))}
        </aside>
      </div>

      <aside className="relative hidden lg:block w-16 shrink-0" aria-label="Sidebar rail">
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width,box-shadow] duration-200 ease-out",
            isDesktopExpanded ? "w-64 shadow-2xl" : "w-16",
          )}
          onMouseEnter={() => setIsDesktopExpanded(true)}
          onMouseLeave={() => setIsDesktopExpanded(false)}
        >
          {renderSidebarContent(isDesktopExpanded)}
        </div>
      </aside>
    </>
  );
}
