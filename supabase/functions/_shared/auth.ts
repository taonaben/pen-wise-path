import { HttpError } from "./errors.ts";
import type { AnySupabaseClient } from "./supabaseAdmin.ts";

export type AuthContext = {
  userId: string;
  farmRole: "owner" | "manager" | "worker";
};

export async function requireAuth(callerClient: AnySupabaseClient): Promise<{ userId: string }> {
  const {
    data: { user },
    error,
  } = await callerClient.auth.getUser();

  if (error || !user) {
    throw new HttpError("UNAUTHORIZED", "No valid user", 401);
  }

  return { userId: user.id };
}

export async function requireFarmAccess(args: {
  adminClient: AnySupabaseClient;
  userId: string;
  farmId: string;
  mode: "single_animal" | "farm_scan" | "scheduled_scan";
}): Promise<AuthContext> {
  const { data, error } = await args.adminClient
    .from("farm_members")
    .select("role,status")
    .eq("farm_id", args.farmId)
    .eq("user_id", args.userId)
    .maybeSingle();

  if (error) {
    throw new HttpError("SCAN_FAILED", error.message, 500);
  }

  if (!data || data.status !== "active") {
    throw new HttpError("FORBIDDEN", "User does not belong to this farm", 403);
  }

  const role = data.role as "owner" | "manager" | "worker";
  if ((args.mode === "farm_scan" || args.mode === "scheduled_scan") && role === "worker") {
    throw new HttpError("FORBIDDEN", "Only owner or manager can run farm-wide scan", 403);
  }

  return {
    userId: args.userId,
    farmRole: role,
  };
}
