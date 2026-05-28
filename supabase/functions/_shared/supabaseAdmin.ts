import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "./errors.ts";

export function getSupabaseClients(authorization: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new HttpError("SCAN_FAILED", "Supabase function environment is not configured", 500);
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  return { callerClient, adminClient };
}

export type AnySupabaseClient = SupabaseClient;
