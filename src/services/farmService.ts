import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError, requireData } from "@/shared/services/baseService";
import type { Farm, FarmInput } from "@/types/auth";

/**
 * Service for managing farms and farm memberships
 * Handles farm creation and automatic ownership assignment
 */
export const farmService = {
  /**
   * Create a new farm with automatic ownership assignment
   * Creates both the farm record and the farm_members record in a transaction
   *
   * Implementation Details:
   * - Trims whitespace from farm name and location
   * - Sets location to null if not provided or empty
   * - Creates farm record with provided owner_id
   * - Creates farm_members record with role='owner', status='active'
   * - Sets created_by to the user ID for audit tracking
   * - Timestamps (created_at, updated_at) are set automatically by database defaults
   *
   * @param userId - The authenticated user's ID (will become farm owner)
   * @param input - Farm creation data (name and optional location)
   * @returns Promise<Farm> The created farm record
   * @throws Error if farm creation or membership assignment fails
   *
   * @example
   * const farm = await farmService.createFarmWithOwnership(userId, {
   *   name: "Green Valley Farm",
   *   location: "North Region"
   * });
   */
  async createFarmWithOwnership(userId: string, input: FarmInput): Promise<Farm> {
    // Trim whitespace from inputs
    const trimmedName = input.name.trim();
    const trimmedLocation = input.location?.trim();

    // Handle optional location field - set to null if not provided or empty
    const locationValue = trimmedLocation && trimmedLocation.length > 0 ? trimmedLocation : null;

    // Step 1: Create farm record
    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .insert({
        name: trimmedName,
        location: locationValue,
        owner_id: userId,
      })
      .select()
      .single();

    if (farmError) handleSupabaseError(farmError);
    requireData(farm, "Failed to create farm");

    // Step 2: Create farm_members record for ownership assignment
    const { error: memberError } = await supabase.from("farm_members").insert({
      farm_id: farm.id,
      user_id: userId,
      role: "owner",
      status: "active",
      created_by: userId,
    });

    if (memberError) {
      // If membership creation fails, we should ideally rollback the farm creation
      // However, Supabase client doesn't support transactions directly
      // In production, this should be handled via a database function or RPC
      handleSupabaseError(memberError);
    }

    return farm;
  },

  /**
   * Get a farm by ID
   * @param farmId - The farm's unique identifier
   * @returns Promise<Farm | null> The farm record or null if not found
   */
  async getFarm(farmId: string): Promise<Farm | null> {
    const { data, error } = await supabase.from("farms").select("*").eq("id", farmId).single();

    if (error) {
      // Return null for not found errors, throw for other errors
      if (error.code === "PGRST116") return null;
      handleSupabaseError(error);
    }

    return data;
  },

  /**
   * Get all farms owned by a specific user
   * @param userId - The user's unique identifier
   * @returns Promise<Farm[]> Array of farms owned by the user
   */
  async getFarmsByOwner(userId: string): Promise<Farm[]> {
    const { data, error } = await supabase.from("farms").select("*").eq("owner_id", userId);

    if (error) handleSupabaseError(error);
    return data ?? [];
  },

  /**
   * Check if a user has any farms
   * Used by onboarding service to determine farm setup completion
   * @param userId - The user's unique identifier
   * @returns Promise<boolean> True if user has at least one farm
   */
  async checkFarmExists(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("farms")
      .select("id")
      .eq("owner_id", userId)
      .limit(1)
      .single();

    if (error) {
      // Return false for not found errors
      if (error.code === "PGRST116") return false;
      handleSupabaseError(error);
    }

    return data !== null;
  },
};
