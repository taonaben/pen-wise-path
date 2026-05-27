import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Beef, ClipboardList, Search, Users, Wheat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import type {
  GlobalSearchPermissions,
  SearchResult,
  SearchResultType,
} from "../types/search.types";

const icons: Record<SearchResultType, ComponentType<{ className?: string }>> = {
  animal: Beef,
  member: Users,
  alert: AlertTriangle,
  audit_log: ClipboardList,
  feed_type: Wheat,
};

function groupResults(results: SearchResult[]) {
  return results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    acc[result.group] = acc[result.group] ?? [];
    acc[result.group].push(result);
    return acc;
  }, {});
}

export function GlobalSearchBox(args: {
  farmId: string;
  permissions: GlobalSearchPermissions;
  className?: string;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const search = useGlobalSearch({
    farmId: args.farmId,
    permissions: args.permissions,
    limit: 5,
  });
  const groups = useMemo(() => groupResults(search.results), [search.results]);
  const hasQuery = search.query.trim().length > 0;
  const canSearch = search.debouncedQuery.length >= 2;

  const goToResult = (result: SearchResult) => {
    navigate({ to: result.path as never });
    setOpen(false);
    search.setQuery("");
  };

  return (
    <div
      className={cn("relative", args.className)}
      onBlur={() => window.setTimeout(() => setOpen(false), 120)}
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-farm-muted" />
      <input
        value={search.query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          search.setQuery(event.target.value);
          setOpen(true);
        }}
        placeholder="Search animals, feed, members..."
        className="w-full rounded-full bg-farm-800/70 border pl-9 pr-4 py-2 text-sm placeholder:text-farm-muted/70 focus:outline-none focus:ring-2 focus:ring-farm-lime/40"
      />

      {open && (
        <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border bg-farm-900 shadow-xl">
          {!hasQuery && (
            <div className="px-4 py-5 text-sm text-farm-muted">
              Search animals, feed, members...
            </div>
          )}
          {hasQuery && !canSearch && (
            <div className="px-4 py-5 text-sm text-farm-muted">Type at least 2 characters.</div>
          )}
          {canSearch && search.isLoading && (
            <div className="px-4 py-5 text-sm text-farm-muted">Searching...</div>
          )}
          {canSearch && search.isError && (
            <div className="px-4 py-5 text-sm text-farm-danger">Search failed.</div>
          )}
          {canSearch && !search.isLoading && !search.isError && search.results.length === 0 && (
            <div className="px-4 py-5 text-sm text-farm-muted">
              No results found for "{search.debouncedQuery}".
            </div>
          )}
          {Object.entries(groups).map(([group, results]) => (
            <div key={group} className="border-t border-farm-700/60 first:border-t-0">
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-farm-muted">
                {group}
              </div>
              {results.map((result) => {
                const Icon = icons[result.type];
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => goToResult(result)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-farm-800"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-farm-800 text-farm-lime">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{result.title}</span>
                      <span className="block truncate text-xs text-farm-muted">
                        {result.subtitle}
                      </span>
                    </span>
                    <Badge variant="outline" className="capitalize">
                      {result.type.replace("_", " ")}
                    </Badge>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
