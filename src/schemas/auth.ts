import { z } from "zod";

/**
 * Registration validation schema
 * Validates email format, password strength, and password confirmation matching
 *
 * Requirements: 1.3, 1.4, 1.5
 */
export const registrationSchema = z
  .object({
    email: z.string().trim().min(1, "Email is required").email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * OTP validation schema
 * Validates 6-digit numeric one-time password format
 *
 * Requirements: 1.3, 2.1, 2.4, 2.5, 2.6
 */
export const otpSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  token: z
    .string()
    .trim()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

/**
 * Profile validation schema
 * Validates user profile information with whitespace trimming
 *
 * Requirements: 3.7, 3.8, 3.9
 */
export const profileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, "First name cannot be empty"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, "Last name cannot be empty"),
});

/**
 * Farm validation schema
 * Validates farm creation with name (required) and optional location
 * Implements whitespace trimming for both fields
 *
 * Requirements: 4.7, 4.8
 */
export const farmSchema = z.object({
  name: z
    .string()
    .min(1, "Farm name is required")
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, "Farm name cannot be empty"),
  location: z
    .string()
    .transform((s) => s.trim())
    .optional(),
});

/**
 * TypeScript type inference for form inputs
 * These types can be used in React components for type-safe form handling
 */
export type RegistrationInput = z.infer<typeof registrationSchema>;
export type OTPVerificationInput = z.infer<typeof otpSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type FarmInput = z.infer<typeof farmSchema>;
