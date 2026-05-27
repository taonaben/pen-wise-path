import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError } from "@/shared/services/baseService";

export const authService = {
  async loginWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) handleSupabaseError(error);
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) handleSupabaseError(error);
  },

  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  onAuthStateChange(cb: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(cb);
  },
};
