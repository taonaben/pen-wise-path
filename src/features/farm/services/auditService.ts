import { supabase } from "@/shared/lib/supabase";

export const auditService = {
  async getAuditLogs(farmId: string) {
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("farm_id", farmId)
      .order("created_at", { ascending: false })
      .limit(100);
    return data ?? [];
  },
};
