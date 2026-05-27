import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl) {
  // eslint-disable-next-line no-console
  console.warn("Missing VITE_SUPABASE_URL — Supabase client will not work until configured.");
}
if (!supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn("Missing VITE_SUPABASE_ANON_KEY — Supabase client will not work until configured.");
}

export const supabase = createClient<Database>(
  supabaseUrl ?? "http://placeholder.local",
  supabaseAnonKey ?? "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
