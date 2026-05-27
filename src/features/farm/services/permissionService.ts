import type { FarmMemberViewModel, FarmRole } from "../types/farm.types";

export type Permission =
  | "viewDashboard"
  | "viewAnimals"
  | "addAnimals"
  | "recordWeights"
  | "recordFeed"
  | "manageMembers"
  | "changeMemberRoles"
  | "deactivateMembers"
  | "deleteRecords"
  | "viewAuditLogs"
  | "globalSearchMembers"
  | "globalSearchAuditLogs";

const rolePermissions: Record<FarmRole, Record<Permission, boolean>> = {
  owner: {
    viewDashboard: true,
    viewAnimals: true,
    addAnimals: true,
    recordWeights: true,
    recordFeed: true,
    manageMembers: true,
    changeMemberRoles: true,
    deactivateMembers: true,
    deleteRecords: true,
    viewAuditLogs: true,
    globalSearchMembers: true,
    globalSearchAuditLogs: true,
  },
  manager: {
    viewDashboard: true,
    viewAnimals: true,
    addAnimals: true,
    recordWeights: true,
    recordFeed: true,
    manageMembers: false,
    changeMemberRoles: false,
    deactivateMembers: false,
    deleteRecords: true,
    viewAuditLogs: true,
    globalSearchMembers: true,
    globalSearchAuditLogs: true,
  },
  worker: {
    viewDashboard: true,
    viewAnimals: true,
    addAnimals: false,
    recordWeights: true,
    recordFeed: true,
    manageMembers: false,
    changeMemberRoles: false,
    deactivateMembers: false,
    deleteRecords: false,
    viewAuditLogs: false,
    globalSearchMembers: false,
    globalSearchAuditLogs: false,
  },
};

export const permissionService = {
  getPermissions(role: FarmRole) {
    return rolePermissions[role];
  },

  can(role: FarmRole, permission: Permission) {
    return rolePermissions[role][permission];
  },

  canDeactivateMember(args: {
    currentUserId: string;
    currentRole: FarmRole;
    target: Pick<FarmMemberViewModel, "role" | "status" | "userId">;
    activeOwnerCount: number;
  }) {
    if (!this.can(args.currentRole, "deactivateMembers")) return false;
    if (args.target.status !== "active") return false;
    if (args.target.userId === args.currentUserId && args.activeOwnerCount <= 1) return false;
    return true;
  },

  canReactivateMember(currentRole: FarmRole, targetStatus: FarmMemberViewModel["status"]) {
    return this.can(currentRole, "deactivateMembers") && targetStatus === "inactive";
  },
};
