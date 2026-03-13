# AI Work Log — PalAI Google Login Feature

## Session Date: March 14, 2026

---

## 1. Google Login Spec — Task Execution

Executed all required tasks from `.kiro/specs/google-login/tasks.md`:

- **Database**: Created migration `004_add_auth_columns.sql` adding `is_onboarded`, `image_url`, and `auth_provider` columns to users table. Created `003_clear_existing_data.sql` for clean slate. Added TypeScript types in `src/types/database.ts`.
- **Validation**: Built `src/lib/validation.ts` with `isValidEmail()` and corresponding tests.
- **Auth Utility**: Created `src/lib/auth.ts` with NextAuth config, custom Supabase adapter, JWT/session callbacks, `upsertUser()`, `markUserOnboarded()`, and conditional Google/Email providers.
- **Auth Page**: Built unified `/auth` page with Google sign-in button and email OTP flow (send code → verify code).
- **Onboarding**: Created `/onboarding` page with 4-step intro tour and `completeOnboarding` server action.
- **Middleware**: Implemented `middleware.ts` for route protection, legacy route consolidation, and onboarding redirect.
- **Environment**: Updated `.env.example` with all required variables (Supabase, NextAuth, Google OAuth, SMTP, Gemini).

Optional tasks (E2E tests, Supabase Auth migration) were skipped.

---

## 2. Post-Implementation Bug Fixes

### 2.1 EMAIL_REQUIRES_ADAPTER_ERROR

NextAuth's EmailProvider requires a database adapter. Built a custom `SupabaseAdapter()` implementing verification token CRUD, user CRUD, and account linking stubs. Added `adapter: SupabaseAdapter()` to `authOptions`.

### 2.2 RLS Infinite Recursion

Supabase RLS policies on the `users` table caused infinite recursion when queried with the anon key. Fixed by creating `getAdminClient()` helper that uses `supabaseAdmin` (service role key) for all auth DB operations, bypassing RLS.

### 2.3 Missing `is_onboarded` Column

Migration `004` hadn't been applied. Provided SQL for manual execution in Supabase Dashboard and CLI instructions (`npx supabase db push`).

### 2.4 Post-Onboarding Redirect Loop

After onboarding, users were redirected back to `/auth` instead of home. Root cause: `signIn` callback was returning URL strings which caused redirect before JWT was established. Fixed by returning `true` from `signIn` callback and handling redirects in middleware.

### 2.5 OAuthAccountNotLinked Error

Google sign-in failed when the email already existed in the database from a previous attempt. Fixed by adding `allowDangerousEmailAccountLinking: true` to the Google provider config.

### 2.6 Auth Page Redirect Loop

After Google OAuth, users were redirected back to `/auth` instead of home. Two fixes:

1. Updated `redirect` callback to never redirect to `/auth` after sign-in.
2. Added `callbackUrl: '/'` to the Google `signIn()` call.
3. Updated middleware to redirect authenticated users away from `/auth` to `/` or `/onboarding`.

### 2.7 Google Avatar Not Loading

Profile image from Google wasn't appearing. Three fixes:

1. Updated JWT callback to use `profile` parameter (from Google OAuth) instead of `user.image` for the avatar URL.
2. Added `referrerPolicy="no-referrer"` to the `<img>` tag (Google blocks requests with referrers).
3. Added `lh3.googleusercontent.com` to Next.js `images.domains` config.

---

## 3. UI Fixes

### 3.1 Auth Page Dark Mode

Auth page had invisible text against dark backgrounds. Tried `dark:` Tailwind variants and CSS `color-mix()` — neither worked. Fixed by using explicit light-mode colors (`bg-gray-50`, `text-gray-900`) matching the homepage style.

### 3.2 Homepage Public Access + Auth Button

Made `/` a public route in middleware. Created `SessionProvider` wrapper (`Providers.tsx`), and `AuthButton` component showing "Sign in" pill for guests and Google avatar with dropdown (name, email, sign out) for authenticated users.

---

## 4. Onboarding Tour

### 4.1 Guided Product Tour

Created `OnboardingTour` component — a spotlight/tooltip walkthrough that highlights actual UI elements on the homepage:

1. Scan Rice Leaf CTA
2. History card
3. Insights card
4. Bottom nav Scan button

Uses `data-tour` attributes on target elements, box-shadow cutout overlay, and fixed-position tooltips.

### 4.2 Tour Triggers

- Automatically starts after completing onboarding intro slides (redirects to `/?tour=1`)
- "Restart onboarding" option in avatar dropdown menu
- Tour auto-scrolls to position elements with room for tooltips

### 4.3 Tour Positioning Fixes

- Fixed tooltip appearing over wrong elements by clearing highlight (`setRect(null)`) before transitioning steps
- Fixed delays by measuring immediately when elements are visible, only scrolling when needed
- Fixed tooltip cutoff by scrolling to position elements at 25% from top of viewport

---

## 5. Route Protection

Added `useRequireAuth` hook for client-side auth protection on pages reachable via `<Link>` navigation (which bypasses middleware). Applied to `/scan` page.

---

## 6. ngrok / Google OAuth Setup

- Guided setup of Google Cloud Console OAuth credentials (redirect URI, JS origins)
- Added ngrok domain to authorized origins and redirect URIs
- Fixed `redirect_uri_mismatch` by updating `NEXTAUTH_URL` to ngrok URL

---

## 7. Git Secret Cleanup

GitHub push protection blocked push due to real credentials committed in `.env.example`. Fixed by:

1. Interactive rebase to the offending commit (`bffd0ef`)
2. Replaced credentials with empty placeholders
3. Amended commit and completed rebase
4. Force-pushed with clean history

---

## Files Created/Modified

### Created

- `apps/palai/src/lib/auth.ts` — NextAuth config, Supabase adapter, auth utilities
- `apps/palai/src/lib/validation.ts` — Email validation
- `apps/palai/src/lib/validation.test.ts` — Validation tests
- `apps/palai/src/types/database.ts` — TypeScript DB types
- `apps/palai/src/app/auth/page.tsx` — Unified auth page
- `apps/palai/src/app/onboarding/page.tsx` — Onboarding intro slides
- `apps/palai/src/app/actions/onboarding.ts` — Onboarding server action
- `apps/palai/middleware.ts` — Route protection middleware
- `apps/palai/src/components/layout/AuthButton.tsx` — Auth button with avatar dropdown
- `apps/palai/src/components/layout/Providers.tsx` — SessionProvider wrapper
- `apps/palai/src/components/ui/OnboardingTour.tsx` — Guided product tour
- `apps/palai/src/hooks/useRequireAuth.ts` — Client-side auth guard hook
- `apps/palai/supabase/migrations/003_clear_existing_data.sql`
- `apps/palai/supabase/migrations/004_add_auth_columns.sql`
- `apps/palai/.env.example`

### Modified

- `apps/palai/src/app/page.tsx` — Added AuthButton, OnboardingTour, data-tour attributes
- `apps/palai/src/app/layout.tsx` — Added Providers wrapper
- `apps/palai/src/app/scan/page.tsx` — Added useRequireAuth guard
- `apps/palai/src/components/layout/BottomNav.tsx` — Added data-tour attribute
- `apps/palai/next.config.js` — Added Google image domain
- `apps/palai/src/app/api/auth/[...nextauth]/route.ts` — NextAuth route handler
