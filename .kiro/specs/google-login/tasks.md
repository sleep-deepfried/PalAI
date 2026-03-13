# Implementation Plan: Google Login (Passwordless Auth)

## Overview

Replace PalAI's credentials-based authentication with passwordless Google OAuth + email OTP. Implement a unified `/auth` page, NextAuth provider configuration, new user onboarding flow, and legacy route consolidation. All code is TypeScript targeting Next.js 15 App Router with NextAuth v4 and Supabase.

## Tasks

- [x] 1. Set up database schema and types
  - [x] 1.1 Clear existing data from the Supabase database (scans, users, etc.) to start fresh with the new auth system
    - Truncate or delete all rows from existing tables (scans, users, and any related tables) since old data was created without proper auth
    - This is a destructive one-time migration before the new auth schema is applied

  - [x] 1.2 Create SQL migration to add `image_url` and `is_onboarded` columns to the `users` table, and create the `verification_tokens` table for NextAuth email OTP
    - Add `image_url TEXT` and `is_onboarded BOOLEAN NOT NULL DEFAULT false` to `users`
    - Create `verification_tokens` table with `identifier`, `token` (unique), and `expires` columns
    - _Requirements: 4.1, 2.3_

  - [x] 1.3 Update the database types in `apps/palai/src/types/database.ts`
    - Add `image_url: string | null` and `is_onboarded: boolean` to the `users` Row, Insert, and Update types
    - Add `verification_tokens` type definitions
    - _Requirements: 4.1, 6.1, 6.2_

- [ ] 2. Implement auth utilities and NextAuth configuration
  - [x] 2.1 Create email validation utility at `apps/palai/src/lib/validation.ts`
    - Implement `isValidEmail(email: string): boolean` using RFC 5322 regex
    - _Requirements: 2.4_

  - [ ] 2.2 Write property test for email validation
    - **Property 2: Invalid email rejection**
    - Generate arbitrary strings (unicode, whitespace, partial emails) and verify `isValidEmail` rejects all invalid formats; generate valid-format emails and verify acceptance
    - **Validates: Requirements 2.4**

  - [x] 2.3 Create auth utility at `apps/palai/src/lib/auth.ts`
    - Export `authOptions: NextAuthOptions` with Google and Email providers
    - Implement `getProviders()` that conditionally includes Google provider based on env vars, logging a warning if missing
    - Implement `upsertUser(email, name?, image?)` that creates or updates user in Supabase, returning `{id, isOnboarded}`
    - Implement `markUserOnboarded(userId)` that sets `is_onboarded = true` in Supabase
    - Configure `EmailProvider` with `maxAge: 10 * 60` (10 minutes)
    - Configure JWT and session callbacks to include `userId` and `isOnboarded`
    - Configure redirect callback to route new users to `/onboarding` and returning users to `/`
    - Set `pages.signIn` to `/auth`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.3, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2, 6.3, 6.4, 7.4_

  - [ ] 2.4 Write property test for conditional Google provider inclusion
    - **Property 1: Conditional Google provider inclusion**
    - Generate random boolean pairs for env var presence, verify `getProviders()` includes Google provider iff both vars are defined and non-empty
    - **Validates: Requirements 1.4**

  - [ ] 2.5 Write property test for post-auth redirect logic
    - **Property 4: Post-auth redirect based on onboarding status**
    - Generate random boolean `isOnboarded` values, verify redirect URL is `/onboarding` when false and `/` when true
    - **Validates: Requirements 4.2, 5.1, 5.2**

  - [ ] 2.6 Write property test for session user identity
    - **Property 5: Session contains user identity**
    - Generate random user profiles with varying fields (email always present, name/image optional), verify session object contains `email` and `id` at minimum, plus `name`/`image` when provided
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Update NextAuth route handler and implement auth page
  - [x] 4.1 Update the NextAuth route handler at `apps/palai/src/app/api/auth/[...nextauth]/route.ts`
    - Remove the existing `CredentialsProvider` configuration
    - Import and use `authOptions` from `apps/palai/src/lib/auth.ts`
    - Export GET and POST handlers
    - _Requirements: 1.1, 2.1, 7.4_

  - [x] 4.2 Create the unified auth page at `apps/palai/src/app/auth/page.tsx`
    - Implement as a client component with `AuthView` state (`'initial' | 'otp-verify'`)
    - Render Google button with Google icon and "Sign in with Google" label (call `signIn("google")` on click)
    - Render email input with submit button, separated from Google button by an "or" divider
    - No password fields, no sign-in/sign-up distinction
    - On valid email submit, call `signIn("email", {email, redirect: false})` and transition to OTP verification view
    - On invalid email, display inline validation error without calling signIn
    - In OTP verification view, show OTP code input with submit and resend options
    - Display error messages for incorrect OTP, expired OTP (with resend option), and email delivery failures
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 2.4, 2.5_

  - [ ] 4.3 Write unit tests for the auth page component
    - Test Google button renders with correct label and icon
    - Test email input and submit button render
    - Test "or" divider is present
    - Test no password fields exist
    - Test Google button click calls `signIn("google")`
    - Test valid email submission transitions to OTP view
    - Test invalid email shows validation error
    - Test OTP error and expiry message display
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 3.9, 3.10_

- [ ] 5. Implement onboarding tour and user flag management
  - [x] 5.1 Create the onboarding tour page at `apps/palai/src/app/onboarding/page.tsx`
    - Implement as a client component introducing PalAI's core features (rice leaf scanning for disease diagnosis)
    - Include "Complete" and "Skip" actions
    - On complete or skip, call a server action that invokes `markUserOnboarded(userId)` and redirect to `/`
    - _Requirements: 4.2, 4.3, 4.4_

  - [x] 5.2 Create the server action for marking onboarding complete at `apps/palai/src/app/actions/onboarding.ts`
    - Import `markUserOnboarded` from `apps/palai/src/lib/auth.ts`
    - Get current user session, call `markUserOnboarded`, redirect to `/`
    - _Requirements: 4.4_

  - [ ] 5.3 Write property test for onboarding flag round-trip
    - **Property 3: Onboarding flag round-trip**
    - Generate random email/name pairs, call `upsertUser` then `markUserOnboarded`, verify `is_onboarded` transitions from `false` to `true`
    - **Validates: Requirements 4.1, 4.4**

  - [ ] 5.4 Write property test for cross-provider account linking
    - **Property 6: Cross-provider account linking by email**
    - Generate random emails, simulate upsert from two different providers with the same email, verify same user ID returned
    - **Validates: Requirements 6.4**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement middleware and legacy route consolidation
  - [x] 7.1 Create or update middleware at `apps/palai/middleware.ts`
    - Redirect unauthenticated users to `/auth` for protected routes
    - Redirect `/auth/signin` to `/auth`
    - Redirect `/auth/signup` to `/auth`
    - Allow `/auth`, `/api/auth/*`, and static assets through without auth check
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.2 Remove legacy auth pages
    - Delete `apps/palai/src/app/auth/signin/page.tsx`
    - Delete `apps/palai/src/app/auth/signup/page.tsx`
    - Update `apps/palai/src/app/auth/layout.tsx` if needed for the new unified page
    - _Requirements: 7.1, 7.2_

  - [ ] 7.3 Write unit tests for middleware redirect logic
    - Test `/auth/signin` redirects to `/auth`
    - Test `/auth/signup` redirects to `/auth`
    - Test unauthenticated access to protected routes redirects to `/auth`
    - Test `/auth` and `/api/auth/*` are accessible without auth
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 8. Update environment variable documentation
  - [x] 8.1 Update `.env.example` in the palai app directory
    - Add Google OAuth section with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
    - Add Email OTP section with `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, and `EMAIL_FROM`
    - _Requirements: 8.1, 8.2_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` + `vitest` (already installed)
- Checkpoints ensure incremental validation
- The implementation language is TypeScript throughout
