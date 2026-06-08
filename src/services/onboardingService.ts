import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError } from "@/shared/services/baseService";
import type { OnboardingStatus, OnboardingStep } from "@/types/auth";

/**
 * Onboarding Service
 *
 * Manages the user onboarding flow by determining the current step
 * and next required action based on user completion status.
 *
 * Onboarding sequence:
 * 1. REGISTRATION - User creates account
 * 2. EMAIL_VERIFICATION - User verifies email via OTP
 * 3. PROFILE_SETUP - User provides first and last name
 * 4. FARM_SETUP - User creates first farm
 * 5. COMPLETE - User can access main application
 */
export const onboardingService = {
  /**
   * Determine the current onboarding status for a user
   *
   * Checks email verification, profile existence, and farm existence
   * to determine which step the user should be on and where to navigate.
   *
   * @param userId - The authenticated user's ID
   * @returns OnboardingStatus with current step, completion flag, and next route
   *
   * Logic:
   * - If email not verified -> EMAIL_VERIFICATION (/verify-email)
   * - If no profile exists -> PROFILE_SETUP (/profile-setup)
   * - If no farm exists -> FARM_SETUP (/farm-setup)
   * - Otherwise -> COMPLETE (/dashboard)
   */
  async getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
    try {
      // Check email verification status
      const emailVerified = await this.checkEmailVerified(userId);

      if (!emailVerified) {
        return {
          currentStep: "EMAIL_VERIFICATION",
          isComplete: false,
          nextRoute: "/verify-email",
        };
      }

      // Check if profile exists
      const profileExists = await this.checkProfileExists(userId);

      if (!profileExists) {
        return {
          currentStep: "PROFILE_SETUP",
          isComplete: false,
          nextRoute: "/profile-setup",
        };
      }

      // Check if farm exists
      const farmExists = await this.checkFarmExists(userId);

      if (!farmExists) {
        return {
          currentStep: "FARM_SETUP",
          isComplete: false,
          nextRoute: "/farm-setup",
        };
      }

      // All steps complete
      return {
        currentStep: "COMPLETE",
        isComplete: true,
        nextRoute: "/dashboard",
      };
    } catch (error) {
      handleSupabaseError(error);
    }
  },

  /**
   * Check if user's email has been verified
   *
   * @param userId - The user's ID
   * @returns true if email_confirmed_at is not null, false otherwise
   */
  async checkEmailVerified(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        handleSupabaseError(error);
      }

      // Check if the user ID matches and email is verified
      if (data.user && data.user.id === userId) {
        return data.user.email_confirmed_at !== null;
      }

      return false;
    } catch (error) {
      handleSupabaseError(error);
    }
  },

  /**
   * Check if a profile exists for the user
   *
   * @param userId - The user's ID
   * @returns true if profile record exists, false otherwise
   */
  async checkProfileExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        handleSupabaseError(error);
      }

      return data !== null;
    } catch (error) {
      handleSupabaseError(error);
    }
  },

  /**
   * Check if a farm exists for the user (as owner)
   *
   * Checks if the user has any farm where they are listed as owner_id
   *
   * @param userId - The user's ID
   * @returns true if at least one farm exists with user as owner, false otherwise
   */
  async checkFarmExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("farms")
        .select("id")
        .eq("owner_id", userId)
        .maybeSingle();

      if (error) {
        handleSupabaseError(error);
      }

      return data !== null;
    } catch (error) {
      handleSupabaseError(error);
    }
  },
};
