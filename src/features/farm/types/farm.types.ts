import type { User } from "@supabase/supabase-js";

export type FarmRole = "owner" | "manager" | "worker";
export type FarmMemberStatus = "active" | "inactive";

export type Farm = {
  id: string;
  name: string;
  location: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type FarmMember = {
  id: string;
  farm_id: string;
  user_id: string;
  role: FarmRole;
  status: FarmMemberStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CurrentFarmContextValue = {
  currentUser: User;
  currentFarm: Farm;
  currentMembership: FarmMember;
  currentRole: FarmRole;
};

export type FarmMemberViewModel = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: FarmRole;
  status: FarmMemberStatus;
  joinedAt: string;
  lastActiveAt: string | null;
  canEditRole: boolean;
  canDeactivate: boolean;
  canReactivate: boolean;
  canRemove: boolean;
  isCurrentUser: boolean;
};

export type AuditLog = {
  id: string;
  farm_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AuditLogViewModel = {
  id: string;
  actorName: string;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type FarmUpdatePayload = Partial<Pick<Farm, "name" | "location">>;
