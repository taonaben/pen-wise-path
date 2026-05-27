import { permissionService, type Permission } from "../services/permissionService";
import type { FarmRole } from "../types/farm.types";

export function useFarmPermissions(role: FarmRole | undefined) {
  const effectiveRole = role ?? "worker";
  const permissions = permissionService.getPermissions(effectiveRole);

  return {
    permissions,
    can: (permission: Permission) => permissionService.can(effectiveRole, permission),
  };
}
