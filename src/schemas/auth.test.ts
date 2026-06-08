import { describe, it, expect } from "vitest";
import { registrationSchema, otpSchema, profileSchema, farmSchema } from "./auth";

describe("Auth Validation Schemas", () => {
  describe("registrationSchema", () => {
    it("should validate correct registration data", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      };
      expect(() => registrationSchema.parse(validData)).not.toThrow();
    });

    it("should reject invalid email format", () => {
      const invalidData = {
        email: "not-an-email",
        password: "password123",
        confirmPassword: "password123",
      };
      expect(() => registrationSchema.parse(invalidData)).toThrow("Invalid email format");
    });

    it("should reject password shorter than 8 characters", () => {
      const invalidData = {
        email: "test@example.com",
        password: "short",
        confirmPassword: "short",
      };
      expect(() => registrationSchema.parse(invalidData)).toThrow(
        "Password must be at least 8 characters",
      );
    });

    it("should reject mismatched passwords", () => {
      const invalidData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "different123",
      };
      expect(() => registrationSchema.parse(invalidData)).toThrow("Passwords don't match");
    });

    it("should trim whitespace from email", () => {
      const dataWithWhitespace = {
        email: "  test@example.com  ",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = registrationSchema.parse(dataWithWhitespace);
      expect(result.email).toBe("test@example.com");
    });
  });

  describe("otpSchema", () => {
    it("should validate correct OTP data", () => {
      const validData = {
        email: "test@example.com",
        token: "123456",
      };
      expect(() => otpSchema.parse(validData)).not.toThrow();
    });

    it("should reject OTP that is not 6 digits", () => {
      const invalidData = {
        email: "test@example.com",
        token: "12345",
      };
      expect(() => otpSchema.parse(invalidData)).toThrow("OTP must be 6 digits");
    });

    it("should reject OTP with non-numeric characters", () => {
      const invalidData = {
        email: "test@example.com",
        token: "12a456",
      };
      expect(() => otpSchema.parse(invalidData)).toThrow("OTP must contain only numbers");
    });

    it("should trim whitespace from email and token", () => {
      const dataWithWhitespace = {
        email: "  test@example.com  ",
        token: " 123456 ",
      };

      const result = otpSchema.parse(dataWithWhitespace);
      expect(result.email).toBe("test@example.com");
      expect(result.token).toBe("123456");
    });
  });

  describe("profileSchema", () => {
    it("should validate correct profile data", () => {
      const validData = {
        firstName: "John",
        lastName: "Doe",
      };
      const result = profileSchema.parse(validData);
      expect(result.firstName).toBe("John");
      expect(result.lastName).toBe("Doe");
    });

    it("should trim whitespace from names", () => {
      const dataWithWhitespace = {
        firstName: "  John  ",
        lastName: "  Doe  ",
      };
      const result = profileSchema.parse(dataWithWhitespace);
      expect(result.firstName).toBe("John");
      expect(result.lastName).toBe("Doe");
    });

    it("should reject empty first name after trimming", () => {
      const invalidData = {
        firstName: "   ",
        lastName: "Doe",
      };
      expect(() => profileSchema.parse(invalidData)).toThrow("First name cannot be empty");
    });

    it("should reject empty last name after trimming", () => {
      const invalidData = {
        firstName: "John",
        lastName: "   ",
      };
      expect(() => profileSchema.parse(invalidData)).toThrow("Last name cannot be empty");
    });
  });

  describe("farmSchema", () => {
    it("should validate correct farm data with location", () => {
      const validData = {
        name: "Green Pastures Farm",
        location: "Rural County",
      };
      const result = farmSchema.parse(validData);
      expect(result.name).toBe("Green Pastures Farm");
      expect(result.location).toBe("Rural County");
    });

    it("should validate farm data without location", () => {
      const validData = {
        name: "Green Pastures Farm",
      };
      const result = farmSchema.parse(validData);
      expect(result.name).toBe("Green Pastures Farm");
      expect(result.location).toBeUndefined();
    });

    it("should trim whitespace from farm name", () => {
      const dataWithWhitespace = {
        name: "  Green Pastures  ",
        location: "  Rural County  ",
      };
      const result = farmSchema.parse(dataWithWhitespace);
      expect(result.name).toBe("Green Pastures");
      expect(result.location).toBe("Rural County");
    });

    it("should reject empty farm name after trimming", () => {
      const invalidData = {
        name: "   ",
        location: "Rural County",
      };
      expect(() => farmSchema.parse(invalidData)).toThrow("Farm name cannot be empty");
    });
  });
});
