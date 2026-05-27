import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchService } from "../services/searchService";
import type { GlobalSearchPermissions } from "../types/search.types";

export function useGlobalSearch(args: {
  farmId: string;
  permissions: GlobalSearchPermissions;
  limit?: number;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const permissionsKey = useMemo(() => JSON.stringify(args.permissions), [args.permissions]);

  const searchQuery = useQuery({
    queryKey: ["global-search", args.farmId, debouncedQuery, args.limit ?? 5, permissionsKey],
    queryFn: () =>
      searchService.globalSearch({
        farmId: args.farmId,
        query: debouncedQuery,
        limit: args.limit ?? 5,
        permissions: args.permissions,
      }),
    enabled: debouncedQuery.length >= 2,
  });

  return {
    query,
    setQuery,
    debouncedQuery,
    results: searchQuery.data ?? [],
    isLoading: searchQuery.isFetching,
    isError: searchQuery.isError,
  };
}
