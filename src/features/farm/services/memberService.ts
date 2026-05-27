import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError, requireData } from "@/shared/services/baseService";
import { auditService } from "./auditService";
import { permissionService } from "./permissionService";
import type { FarmMember, FarmMemberViewModel, FarmRole, Profile } from "../types/farm.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function displayName(profile: Profile | undefined, member: FarmMember) {
  return profile?.full_name || profile?.email || `User ${member.user_id.slice(0, 8)}`;
}

function mapMember(args: {
  member: FarmMember;
  profile?: Profile;
  currentUserId: string;
  currentRole: FarmRole;
  activeOwnerCount: number;
}): FarmMemberViewModel {
  return {
    id: args.member.id,
    userId: args.member.user_id,
    name: displayName(args.profile, args.member),
    email: args.profile?.email ?? "Profile unavailable",
    role: args.member.role,
    status: args.member.status,
    joinedAt: args.member.created_at,
    lastActiveAt: args.profile?.last_active_at ?? null,
    isCurrentUser: args.member.user_id === args.currentUserId,
    canEditRole:
      permissionService.can(args.currentRole, "changeMemberRoles") &&
      args.member.status === "active" &&
      args.member.user_id !== args.currentUserId,
    canDeactivate: permissionService.canDeactivateMember({
      currentUserId: args.currentUserId,
      currentRole: args.currentRole,
      target: {
        role: args.member.role,
        status: args.member.status,
        userId: args.member.user_id,
      },
      activeOwnerCount: args.activeOwnerCount,
    }),
    canReactivate: permissionService.canReactivateMember(args.currentRole, args.member.status),
    canRemove: permissionService.canDeactivateMember({
      currentUserId: args.currentUserId,
      currentRole: args.currentRole,
      target: {
        role: args.member.role,
        status: "active",
        userId: args.member.user_id,
      },
      activeOwnerCount: args.activeOwnerCount,
    }),
  };
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) handleSupabaseError(error);
  return requireData(data.user, "No authenticated user").id;
}

async function getProfilesByUserId(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, Profile>();

  const { data, error } = await db.from("profiles").select("*").in("id", userIds);
  if (error) handleSupabaseError(error);

  return new Map(((data ?? []) as Profile[]).map((profile) => [profile.id, profile]));
}

export const memberService = {
  async inviteFarmMember(payload: {
    farmId: string;
    fullName: string;
    email: string;
    role: Exclude<FarmRole, "owner">;
  }) {
    const { data, error } = await supabase.functions.invoke("invite-farm-member", {
      body: payload,
    });

    if (error) handleSupabaseError(error);
    return data as {
      member: Pick<FarmMember, "id" | "farm_id" | "user_id" | "role" | "status">;
      invitedUser: { id: string; email: string; fullName: string };
    };
  },

  async getFarmMembers(args: {
    farmId: string;
    currentRole: FarmRole;
    currentUserId?: string;
  }): Promise<FarmMemberViewModel[]> {
    const currentUserId = args.currentUserId ?? (await getCurrentUserId());

    const { data, error } = await db
      .from("farm_members")
      .select("*")
      .eq("farm_id", args.farmId)
      .order("created_at", { ascending: true });

    if (error) handleSupabaseError(error);

    const members = (data ?? []) as FarmMember[];
    const profilesById = await getProfilesByUserId(members.map((member) => member.user_id));
    const activeOwnerCount = members.filter(
      (member) => member.role === "owner" && member.status === "active",
    ).length;

    return members.map((member) =>
      mapMember({
        member,
        profile: profilesById.get(member.user_id),
        currentUserId,
        currentRole: args.currentRole,
        activeOwnerCount,
      }),
    );
  },

  async getFarmMemberById(memberId: string): Promise<FarmMember> {
    const { data, error } = await db.from("farm_members").select("*").eq("id", memberId).single();
    if (error) handleSupabaseError(error);
    return requireData(data, "Farm member not found") as FarmMember;
  },

  async updateFarmMemberRole(memberId: string, role: FarmRole): Promise<FarmMember> {
    const previous = await this.getFarmMemberById(memberId);

    const { data, error } = await db
      .from("farm_members")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", memberId)
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    const updated = requireData(data, "Role update returned no data") as FarmMember;

    await auditService.createAuditLog({
      farmId: updated.farm_id,
      action: "MEMBER_ROLE_UPDATED",
      entityType: "farm_member",
      entityId: updated.id,
      description: `Changed member role from ${previous.role} to ${updated.role}`,
      metadata: {
        previous_role: previous.role,
        new_role: updated.role,
        user_id: updated.user_id,
      },
    });

    return updated;
  },

  async deactivateFarmMember(memberId: string): Promise<FarmMember> {
    const previous = await this.getFarmMemberById(memberId);

    const { data, error } = await db
      .from("farm_members")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .eq("id", memberId)
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    const updated = requireData(data, "Deactivate returned no data") as FarmMember;

    await auditService.createAuditLog({
      farmId: updated.farm_id,
      action: "MEMBER_DEACTIVATED",
      entityType: "farm_member",
      entityId: updated.id,
      description: "Deactivated farm member access",
      metadata: {
        previous_status: previous.status,
        new_status: updated.status,
        user_id: updated.user_id,
      },
    });

    return updated;
  },

  async activateFarmMember(memberId: string): Promise<FarmMember> {
    const previous = await this.getFarmMemberById(memberId);

    const { data, error } = await db
      .from("farm_members")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", memberId)
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    const updated = requireData(data, "Reactivate returned no data") as FarmMember;

    await auditService.createAuditLog({
      farmId: updated.farm_id,
      action: "MEMBER_REACTIVATED",
      entityType: "farm_member",
      entityId: updated.id,
      description: "Reactivated farm member access",
      metadata: {
        previous_status: previous.status,
        new_status: updated.status,
        user_id: updated.user_id,
      },
    });

    return updated;
  },

  async removeFarmMember(memberId: string): Promise<FarmMember> {
    const previous = await this.getFarmMemberById(memberId);

    const { error } = await db.from("farm_members").delete().eq("id", memberId);
    if (error) handleSupabaseError(error);

    await auditService.createAuditLog({
      farmId: previous.farm_id,
      action: "MEMBER_REMOVED",
      entityType: "farm_member",
      entityId: previous.id,
      description: "Removed farm member access",
      metadata: {
        previous_role: previous.role,
        previous_status: previous.status,
        user_id: previous.user_id,
      },
    });

    return previous;
  },
};
