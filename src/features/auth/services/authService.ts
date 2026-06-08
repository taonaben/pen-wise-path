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

  /**
   * Register a new user with email and password
   * Supabase automatically sends OTP email upon signup
   * @param email - User's email address
   * @param password - User's password (minimum 8 characters)
   * @returns AuthResponse with user object (email_confirmed_at: null until verified)
   */
  async registerWithPassword(email: string, password: string) {
    const emailRedirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/verify-email` : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });
    if (error) handleSupabaseError(error);
    return data;
  },

  /**
   * Verify user's email address using OTP code
   * @param email - User's email address
   * @param token - 6-digit OTP code sent to email
   * @returns AuthResponse with verified user (email_confirmed_at set)
   */
  async verifyOTP(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) handleSupabaseError(error);
    return data;
  },

  /**
   * Resend OTP verification code to user's email
   * Invalidates any previously generated OTP for that user
   * @param email - User's email address
   */
  async resendOTP(email: string) {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) handleSupabaseError(error);
  },
};
