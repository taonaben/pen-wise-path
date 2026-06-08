/**
 * Profile Service Tests
 * 
 * Tests for profile creation and retrieval operations
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { profileService } from "./profileService";
import { supabase } from "@/shared/lib/supabase";

// Mock the supabase client
vi.mock("@/shared/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe("profileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProfile", () => {
    it("should create a profile with trimmed names and concatenated full_name", async () => {
      const userId = "test-user-id";
      const input = {
        firstName: "  John  ",
        lastName: "  Doe  ",
      };

      const mockProfile = {
        id: userId,
        full_name: "John Doe",
        email: "john.doe@example.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock getUser
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: "john.doe@example.com",
          },
        },
        error: null,
      } as any);

      // Mock from chain
      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await profileService.createProfile(userId, input);

      expect(result).toEqual(mockProfile);
      expect(mockInsert).toHaveBeenCalledWith({
        id: userId,
        full_name: "John Doe",
        email: "john.doe@example.com",
      });
    });

    it("should throw error if user is not authenticated", async () => {
      const userId = "test-user-id";
      const input = {
        firstName: "John",
        lastName: "Doe",
      };

      // Mock getUser to return no user
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: {
          user: null,
        },
        error: null,
      } as any);

      await expect(profileService.createProfile(userId, input)).rejects.toThrow(
        "User not authenticated"
      );
    });

    it("should trim whitespace from first and last names", async () => {
      const userId = "test-user-id";
      const input = {
        firstName: "   Jane   ",
        lastName: "   Smith   ",
      };

      const mockProfile = {
        id: userId,
        full_name: "Jane Smith",
        email: "jane.smith@example.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock getUser
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: "jane.smith@example.com",
          },
        },
        error: null,
      } as any);

      // Mock from chain
      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await profileService.createProfile(userId, input);

      expect(result.full_name).toBe("Jane Smith");
      expect(mockInsert).toHaveBeenCalledWith({
        id: userId,
        full_name: "Jane Smith",
        email: "jane.smith@example.com",
      });
    });
  });

  describe("getProfile", () => {
    it("should retrieve an existing profile", async () => {
      const userId = "test-user-id";
      const mockProfile = {
        id: userId,
        full_name: "John Doe",
        email: "john.doe@example.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock from chain
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await profileService.getProfile(userId);

      expect(result).toEqual(mockProfile);
      expect(supabase.from).toHaveBeenCalledWith("profiles");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockEq).toHaveBeenCalledWith("id", userId);
    });

    it("should return null if profile does not exist", async () => {
      const userId = "non-existent-user";

      // Mock from chain with PGRST116 error (not found)
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: "PGRST116",
          message: "Not found",
        },
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await profileService.getProfile(userId);

      expect(result).toBeNull();
    });
  });
});
