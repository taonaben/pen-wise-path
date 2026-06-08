import type { Permission } from "@/features/farm/services/permissionService";

export type SearchResultType =
  | "animal"
  | "member"
  | "alert"
  | "audit_log"
  | "feed_type"
  | "feeding_event"
  | "sale_record"
  | "report";

export type SearchResult = {
  id: string;
  type: SearchResultType;
  group: string;
  title: string;
  subtitle: string;
  path: string;
  metadata?: Record<string, unknown>;
};

export type GlobalSearchPermissions = Pick<
  Record<Permission, boolean>,
  "viewAnimals" | "globalSearchMembers" | "globalSearchAuditLogs"
>;

export type GlobalSearchArgs = {
  farmId: string;
  query: string;
  limit?: number;
  permissions: GlobalSearchPermissions;
};
