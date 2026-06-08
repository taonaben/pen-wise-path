/**
 * Type definitions for user registration and onboarding system
 *
 * This module defines all TypeScript interfaces and types used throughout
 * the registration, email verification, profile setup, and farm creation flow.
 */

// ============================================================================
// Auth Types
// ============================================================================

/**
 * Input data for user registration
 * Used in the registration form to collect user credentials
 */
export interface RegistrationInput {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Input data for OTP (One-Time Password) verification
 * Used in the email verification step
 */
export interface OTPVerificationInput {
  email: string;
  token: string;
}

// ============================================================================
// Profile Types
// ============================================================================

/**
 * Input data for profile creation
 * Collects user's first and last name during onboarding
 */
export interface ProfileInput {
  firstName: string;
  lastName: string;
}

/**
 * Complete user profile data
 * Represents a record from the profiles table
 */
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  last_active_at?: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Farm Types
// ============================================================================

/**
 * Input data for farm creation
 * Collects farm name and optional location during onboarding
 */
export interface FarmInput {
  name: string;
  location?: string;
}

/**
 * Complete farm data
 * Represents a record from the farms table
 */
export interface Farm {
  id: string;
  name: string;
  location: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Farm membership data
 * Represents a record from the farm_members table
 * Links users to farms with specific roles and status
 */
export interface FarmMembership {
  id: string;
  farm_id: string;
  user_id: string;
  role: "owner" | "manager" | "worker";
  status: "active" | "inactive";
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Onboarding Types
// ============================================================================

/**
 * Enumeration of all onboarding steps
 * Represents the sequential flow through the registration and onboarding process
 */
export type OnboardingStep =
  | "REGISTRATION"
  | "EMAIL_VERIFICATION"
  | "PROFILE_SETUP"
  | "FARM_SETUP"
  | "COMPLETE";

/**
 * Current onboarding status for a user
 * Used to determine which step the user should be on and where to navigate
 */
export interface OnboardingStatus {
  /**
   * The current step in the onboarding process
   */
  currentStep: OnboardingStep;

  /**
   * Whether the user has completed all onboarding steps
   */
  isComplete: boolean;

  /**
   * The route path the user should be navigated to
   * Based on their current onboarding progress
   */
  nextRoute: string;
}
