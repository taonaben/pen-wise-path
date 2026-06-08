import { describe, it, expect, vi, beforeEach } from "vitest";
import { farmService } from "./farmService";
import { supabase } from "@/shared/lib/supabase";
import type { Farm } from "@/types/auth";

// Mock the supabase client
vi.mock("@/shared/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("farmService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createFarmWithOwnership", () => {
    it("should create farm with trimmed name and location", async () => {
      const mockFarm: Farm = {
        id: "farm-123",
        name: "Green Valley Farm",
        location: "North Region",
        owner_id: "user-123",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockFromFarms = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockFarm, error: null }),
      };

      const mockFromMembers = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      // @ts-expect-error - Mocking supabase
      supabase.from = vi.fn((table: string) => {
        if (table === "farms") return mockFromFarms;
        if (table === "farm_members") return mockFromMembers;
        return {};
      });

      const result = await farmService.createFarmWithOwnership("user-123", {
        name: "  Green Valley Farm  ",
        location: "  North Region  ",
      });

      expect(result).toEqual(mockFarm);
      expect(mockFromFarms.insert).toHaveBeenCalledWith({
        name: "Green Valley Farm",
        location: "North Region",
        owner_id: "user-123",
      });
      expect(mockFromMembers.insert).toHaveBeenCalledWith({
        farm_id: "farm-123",
        user_id: "user-123",
        role: "owner",
        status: "active",
        created_by: "user-123",
      });
    });

    it("should handle optional location by setting to null when empty", async () => {
      const mockFarm: Farm = {
        id: "farm-123",
        name: "Simple Farm",
        location: null,
        owner_id: "user-123",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockFromFarms = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockFarm, error: null }),
      };

      const mockFromMembers = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      // @ts-expect-error - Mocking supabase
      supabase.from = vi.fn((table: string) => {
        if (table === "farms") return mockFromFarms;
        if (table === "farm_members") return mockFromMembers;
        return {};
      });

      const result = await farmService.createFarmWithOwnership("user-123", {
        name: "Simple Farm",
        location: "",
      });

      expect(result.location).toBeNull();
      expect(mockFromFarms.insert).toHaveBeenCalledWith({
        name: "Simple Farm",
        location: null,
        owner_id: "user-123",
      });
    });

    it("should handle location not provided (undefined)", async () => {
      const mockFarm: Farm = {
        id: "farm-123",
        name: "No Location Farm",
        location: null,
        owner_id: "user-123",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockFromFarms = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockFarm, error: null }),
      };

      const mockFromMembers = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      // @ts-expect-error - Mocking supabase
      supabase.from = vi.fn((table: string) => {
        if (table === "farms") return mockFromFarms;
        if (table === "farm_members") return mockFromMembers;
        return {};
      });

      const result = await farmService.createFarmWithOwnership("user-123", {
        name: "No Location Farm",
      });

      expect(result.location).toBeNull();
      expect(mockFromFarms.insert).toHaveBeenCalledWith({
        name: "No Location Farm",
        location: null,
        owner_id: "user-123",
      });
    });

    it("should throw error when farm creation fails", async () => {
      const mockError = new Error("Database error");

      const mockFromFarms = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      // @ts-expect-error - Mocking supabase
      supabase.from = vi.fn(() => mockFromFarms);

      await expect(
        farmService.createFarmWithOwnership("user-123", {
          name: "Test Farm",
        }),
      ).rejects.toThrow();
    });

    it("should throw error when farm_members creation fails", async () => {
      const mockFarm: Farm = {
        id: "farm-123",
        name: "Test Farm",
        location: null,
        owner_id: "user-123",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockError = new Error("Membership error");

      const mockFromFarms = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockFarm, error: null }),
      };

      const mockFromMembers = {
        insert: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      // @ts-expect-error - Mocking supabase
      supabase.from = vi.fn((table: string) => {
        if (table === "farms") return mockFromFarms;
        if (table === "farm_members") return mockFromMembers;
        return {};
      });

      await expect(
        farmService.createFarmWithOwnership("user-123", {
          name: "Test Farm",
        }),
      ).rejects.toThrow();
    });
  });

  describe("checkFarmExists", () => {
    it("should return true when user has a farm", async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: "farm-123" }, error: null }),
      };

      // @ts-expect-error - Mocking supabase
      supabase.from = vi.fn(() => mockFrom);

      const result = await farmService.checkFarmExists("user-123");

      expect(result).toBe(true);
    });

    it("should return false when user has no farms", async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
      };

      // @ts-expect-error - Mocking supabase
      supabase.from = vi.fn(() => mockFrom);

      const result = await farmService.checkFarmExists("user-123");

      expect(result).toBe(false);
    });
  });

  describe("getFarmsByOwner", () => {
    it("should return array of farms for a user", async () => {
      const mockFarms: Farm[] = [
        {
          id: "farm-1",
          name: "Farm 1",
          location: "Location 1",
          owner_id: "user-123",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "farm-2",
          name: "Farm 2",
          location: null,
          owner_id: "user-123",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockFarms, error: null }),
      };

      // @ts-expect-error - Mocking supabase
      supabase.from = vi.fn(() => mockFrom);

      const result = await farmService.getFarmsByOwner("user-123");

      expect(result).toEqual(mockFarms);
      expect(result.length).toBe(2);
    });

    it("should return empty array when user has no farms", async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      // @ts-expect-error - Mocking supabase
      supabase.from = vi.fn(() => mockFrom);

      const result = await farmService.getFarmsByOwner("user-123");

      expect(result).toEqual([]);
    });
  });
});
