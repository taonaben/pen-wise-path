import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError, requireData } from "@/shared/services/baseService";
import type {
  CurrentFarmContextValue,
  Farm,
  FarmMember,
  FarmUpdatePayload,
} from "../types/farm.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const farmService = {
  async getCurrentUserFarms(): Promise<Array<{ farm: Farm; membership: FarmMember }>> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) handleSupabaseError(userError);
    const user = requireData(userData.user, "No authenticated user");

    const { data: memberships, error: membershipError } = await db
      .from("farm_members")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: true });

    if (membershipError) handleSupabaseError(membershipError);

    const rows = (memberships ?? []) as FarmMember[];
    if (rows.length === 0) return [];

    const { data: farms, error: farmError } = await db
      .from("farms")
      .select("*")
      .in(
        "id",
        rows.map((row) => row.farm_id),
      );

    if (farmError) handleSupabaseError(farmError);

    const farmById = new Map((farms ?? []).map((farm: Farm) => [farm.id, farm]));

    return rows.flatMap((membership) => {
      const farm = farmById.get(membership.farm_id);
      return farm ? [{ farm, membership }] : [];
    });
  },

  async getCurrentFarm(): Promise<CurrentFarmContextValue | null> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) handleSupabaseError(userError);
    const currentUser = requireData(userData.user, "No authenticated user");

    const farms = await this.getCurrentUserFarms();
    const first = farms[0];
    if (!first) return null;

    return {
      currentUser,
      currentFarm: first.farm,
      currentMembership: first.membership,
      currentRole: first.membership.role,
    };
  },

  async getFarmById(farmId: string): Promise<Farm> {
    const { data, error } = await db.from("farms").select("*").eq("id", farmId).single();
    if (error) handleSupabaseError(error);
    return requireData(data, "Farm not found") as Farm;
  },

  async updateFarm(farmId: string, payload: FarmUpdatePayload): Promise<Farm> {
    const { data, error } = await db
      .from("farms")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", farmId)
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    return requireData(data, "Farm update returned no data") as Farm;
  },
};
