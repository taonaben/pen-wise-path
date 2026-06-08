# Implementation Plan: User Registration and Onboarding

## Overview

This implementation plan guides the creation of a complete user registration and onboarding system using TypeScript, React, TanStack Router, Supabase Auth, and the existing database schema. The system implements a sequential flow: Registration → Email Verification → Profile Setup → Farm Creation → Dashboard. The implementation follows a layered architecture with service layer for business logic, presentation layer using React components with shadcn/ui, and Zod validation schemas.

## Tasks

- [ ] 1. Set up authentication service layer and types
  - [x] 1.1 Create auth service with registration and OTP verification
    - Create `src/services/authService.ts` with methods for `registerWithPassword()`, `verifyOTP()`, and `resendOTP()`
    - Integrate with Supabase Auth using `@supabase/supabase-js`
    - Export `AuthService` interface and implementation
    - _Requirements: 1.1, 1.2, 2.1, 2.4, 2.8, 2.9_
  - [x] 1.2 Create TypeScript type definitions for auth and onboarding
    - Create `src/types/auth.ts` with interfaces for `RegistrationInput`, `OTPVerificationInput`, `ProfileInput`, `FarmInput`, `OnboardingStep`, and `OnboardingStatus`
    - Define all types matching the design document specifications
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 6.1_
  - [x] 1.3 Create Zod validation schemas
    - Create `src/schemas/auth.ts` with schemas for `registrationSchema`, `otpSchema`, `profileSchema`, and `farmSchema`
    - Include all validation rules: email format, password length, whitespace trimming, required fields
    - _Requirements: 1.3, 1.4, 1.5, 3.7, 3.8, 3.9, 4.7, 4.8_

- [ ] 2. Implement onboarding service and state management
  - [x] 2.1 Create onboarding service
    - Create `src/services/onboardingService.ts` with `getOnboardingStatus()` method
    - Implement logic to check email verification, profile existence, and farm existence
    - Return appropriate `OnboardingStatus` with next route based on completion state
    - _Requirements: 6.7, 6.8, 7.1, 7.2, 7.3, 7.4_
  - [x] 2.2 Create useOnboardingGuard hook
    - Create `src/hooks/useOnboardingGuard.ts` that checks onboarding status
    - Implement automatic navigation to next incomplete step
    - Handle loading states and redirect unauthenticated users to login
    - _Requirements: 6.7, 6.8, 7.1, 7.2, 7.3_

- [ ] 3. Implement profile service
  - [x] 3.1 Create profile service with database operations
    - Create `src/services/profileService.ts` with `createProfile()` and `getProfile()` methods
    - Implement full name concatenation logic with space separator
    - Implement whitespace trimming for first and last names
    - Set created_at and updated_at timestamps
    - _Requirements: 3.1, 3.2, 3.4, 3.6, 3.9_

- [x] 4. Implement farm service
  - [x] 4.1 Create farm service with ownership assignment
    - Create `src/services/farmService.ts` with `createFarmWithOwnership()` method
    - Implement transactional creation of farm record and farm_members record
    - Set role to 'owner', status to 'active', and created_by to user ID
    - Handle optional location field (null if not provided)
    - Implement whitespace trimming for farm name and location
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.8, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 5. Checkpoint - Verify service layer implementation
  - Ensure all services are properly typed and integrated with Supabase
  - Verify validation schemas work correctly
  - Ask the user if questions arise

- [x] 6. Create registration route and components
  - [x] 6.1 Create registration page route
    - Create `src/routes/register.tsx` with TanStack Router route definition
    - Implement form state management with email, password, and confirmPassword fields
    - Implement form validation using registrationSchema before submission
    - Handle successful registration by navigating to `/verify-email` with email in search params
    - Display validation errors and submission errors to user
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.2, 8.1, 8.2, 8.5, 8.6_
  - [x] 6.2 Create registration form component
    - Create `src/components/auth/RegistrationForm.tsx` using shadcn/ui components
    - Include email input, password input, confirm password input, and submit button
    - Display error messages for each field
    - Show loading state during submission
    - Include link to login page for existing users
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 6.2, 8.1, 8.2_

- [x] 7. Create email verification route and components
  - [x] 7.1 Create email verification page route
    - Create `src/routes/verify-email.tsx` with TanStack Router route definition
    - Implement 6-digit OTP input state using `input-otp` library
    - Implement attempt counter (max 5 attempts) with 15-minute lockout
    - Implement auto-submit when 6 digits are entered
    - Handle successful verification by navigating to `/profile-setup`
    - Handle verification errors by incrementing attempt counter and displaying error
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 2.7, 6.3, 8.1, 8.2, 8.5_
  - [x] 7.2 Create OTP verification form component
    - Create `src/components/auth/VerifyEmailForm.tsx` using shadcn/ui components
    - Include 6-digit OTP input component from `input-otp`
    - Include "Resend OTP" button with 60-second cooldown timer
    - Display lockout message when max attempts exceeded
    - Show clear error messages for invalid/expired OTP
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 2.7, 2.8, 8.1, 8.2, 8.4_

- [x] 8. Create profile setup route and components
  - [x] 8.1 Create profile setup page route
    - Create `src/routes/profile-setup.tsx` with TanStack Router route definition
    - Implement form state management with firstName and lastName fields
    - Implement form validation using profileSchema before submission
    - Handle successful profile creation by navigating to `/farm-setup`
    - Display validation errors and submission errors to user
    - Include progress indicator showing "Step 1 of 2"
    - _Requirements: 3.1, 3.2, 3.7, 3.8, 3.9, 6.4, 8.1, 8.2, 8.5, 8.6_
  - [x] 8.2 Create profile setup form component
    - Create `src/components/auth/ProfileSetupForm.tsx` using shadcn/ui components
    - Include first name input and last name input
    - Display error messages for each field
    - Show loading state during submission
    - Include progress indicator
    - _Requirements: 3.1, 3.7, 3.8, 8.1, 8.2_

- [ ] 9. Create farm setup route and components
  - [~] 9.1 Create farm setup page route
    - Create `src/routes/farm-setup.tsx` with TanStack Router route definition
    - Implement form state management with name and location (optional) fields
    - Implement form validation using farmSchema before submission
    - Handle successful farm creation by navigating to `/dashboard`
    - Display validation errors and submission errors to user
    - Include progress indicator showing "Step 2 of 2"
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.7, 4.8, 6.5, 6.6, 8.1, 8.2, 8.5, 8.6_
  - [~] 9.2 Create farm setup form component
    - Create `src/components/auth/FarmSetupForm.tsx` using shadcn/ui components
    - Include farm name input and location input (optional)
    - Display error messages for each field
    - Show loading state during submission
    - Include progress indicator
    - Display success message with welcoming text
    - _Requirements: 4.1, 4.4, 4.5, 4.7, 8.1, 8.2, 8.5_

- [~] 10. Checkpoint - Verify UI implementation
  - Test all forms render correctly with shadcn/ui styling
  - Verify validation messages display properly
  - Ensure navigation flow works between routes
  - Ask the user if questions arise

- [ ] 11. Integrate onboarding guard with protected routes
  - [~] 11.1 Update ProtectedRoute component with onboarding guard
    - Modify existing `src/components/ProtectedRoute.tsx` (or create if doesn't exist)
    - Integrate `useOnboardingGuard` hook to check onboarding status
    - Redirect incomplete onboarding users to appropriate step
    - Show loading spinner while checking status
    - _Requirements: 6.7, 6.8, 7.1, 7.2, 7.3, 7.4_
  - [~] 11.2 Apply ProtectedRoute to dashboard and main app routes
    - Wrap dashboard route with ProtectedRoute component
    - Ensure all authenticated routes check onboarding completion
    - _Requirements: 6.6, 6.7, 6.8_

- [ ] 12. Add error handling and user feedback
  - [~] 12.1 Implement toast notifications for success and error states
    - Use `sonner` library (already in dependencies) for toast notifications
    - Add success toasts for: registration, email verification, profile creation, farm creation
    - Add error toasts for: validation failures, network errors, email sending failures
    - Ensure toasts display within 2 seconds of events
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - [~] 12.2 Implement retry mechanism for email sending failures
    - Add retry button in error state for email verification
    - Handle network errors gracefully with user-friendly messages
    - _Requirements: 8.3, 8.4_

- [ ] 13. Add login route integration
  - [x] 13.1 Create or update login route with registration link
    - Create/update `src/routes/login.tsx` to display login form
    - Add "Create an account" link that navigates to `/register`
    - Ensure login route is the default for unauthenticated users
    - _Requirements: 6.1, 6.2_

- [~] 14. Final checkpoint and integration testing
  - Verify complete onboarding flow from registration to dashboard
  - Test state persistence by interrupting flow at each step
  - Verify all error cases display appropriate messages
  - Ensure database records are created correctly for auth.users, profiles, farms, and farm_members
  - Test edge cases: expired OTP, max attempts, duplicate emails, whitespace trimming
  - Ask the user if questions arise

## Notes

- All form components use shadcn/ui primitives (Button, Input, Label, Card, etc.) for consistent styling
- The `input-otp` library is already in dependencies for the OTP input component
- Supabase handles OTP generation and email sending automatically when using `signUp()` and `verifyOtp()`
- TanStack Router search params are used to pass email between registration and verification steps
- The onboarding guard prevents users from accessing the main application until all steps are complete
- All services follow the existing project structure and integrate with Supabase client
- Error messages follow user-friendly language without technical jargon
- Timestamps (created_at, updated_at) are handled automatically by database defaults
- The implementation uses React Hook Form with Zod resolver for form validation
- Toast notifications provide immediate feedback for all user actions

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "6.1", "7.1", "8.1", "9.1", "13.1"] },
    { "id": 3, "tasks": ["6.2", "7.2", "8.2", "9.2"] },
    { "id": 4, "tasks": ["11.1"] },
    { "id": 5, "tasks": ["11.2", "12.1", "12.2"] }
  ]
}
```
