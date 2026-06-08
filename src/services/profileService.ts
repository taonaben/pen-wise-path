/**
 * Profile Service
 *
 * Handles profile creation and retrieval operations during user onboarding.
 * Implements full name concatenation logic, whitespace trimming, and timestamp management.
 *
 * Requirements: 3.1, 3.2, 3.4, 3.6, 3.9
 */

import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError } from "@/shared/services/baseService";
import type { ProfileInput, Profile } from "@/types/auth";

export const profileService = {
  /**
   * Create a new user profile
   *
   * This method:
   * - Trims whitespace from first and last names (Requirement 3.9)
   * - Concatenates first and last name with space separator for full_name (Requirement 3.2)
   * - Retrieves email from authenticated user (Requirement 3.4)
   * - Sets created_at and updated_at timestamps automatically (Requirement 3.6)
   *
   * @param userId - The authenticated user's ID (from auth.users)
   * @param input - Profile input containing firstName and lastName
   * @returns Created profile record
   * @throws Error if profile creation fails or user is not authenticated
   */
  async createProfile(userId: string, input: ProfileInput): Promise<Profile> {
    // Trim whitespace from input fields (Requirement 3.9)
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();

    // Concatenate first and last name with space separator (Requirement 3.2)
    const fullName = `${firstName} ${lastName}`;

    // Get authenticated user's email (Requirement 3.4)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) handleSupabaseError(userError);
    if (!userData.user) {
      throw new Error("User not authenticated");
    }

    const email = userData.user.email;
    if (!email) {
      throw new Error("User email not found");
    }

    // Create profile record (Requirement 3.1)
    // Timestamps created_at and updated_at are set automatically by database defaults (Requirement 3.6)
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        full_name: fullName,
        email: email,
      })
      .select()
      .single();

    if (error) handleSupabaseError(error);
    if (!data) {
      throw new Error("Profile creation failed - no data returned");
    }

    return data as Profile;
  },

  /**
   * Get a user's profile by user ID
   *
   * @param userId - The user's ID
   * @returns User profile or null if not found
   * @throws Error if database query fails
   */
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

    if (error) {
      // Return null if profile doesn't exist (not found is expected for new users)
      if (error.code === "PGRST116") {
        return null;
      }
      handleSupabaseError(error);
    }

    return data as Profile | null;
  },
};
