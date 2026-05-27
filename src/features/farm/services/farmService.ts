import { supabase } from "@/shared/lib/supabase";

// Placeholder implementations. Replace with real Supabase queries once farms exist.
export const farmService = {
  async getCurrentUserFarms() {
    const { data } = await supabase.from("farms").select("*").limit(10);
    return data ?? [];
  },
  async getCurrentFarm() {
    return { id: "placeholder", name: "Green Valley Farm", location: "—" };
  },
  async getFarmMembers() {
    return [] as Array<Record<string, unknown>>;
  },
};
