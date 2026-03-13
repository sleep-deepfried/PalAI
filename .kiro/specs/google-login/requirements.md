# Requirements Document

## Introduction

PalAI is a rice leaf disease diagnosis tool for Filipino farmers built with Next.js 15 and NextAuth. This feature implements a passwordless authentication system with a single unified auth page. Users can authenticate via Google OAuth or email OTP (one-time password). There are no passwords, no separate sign-in/sign-up pages. New users see an onboarding tour after first authentication; returning users are redirected straight to the homepage.

## Glossary

- **Auth_System**: The NextAuth-based authentication system configured in the PalAI Next.js application, responsible for managing user sessions, providers, and callbacks.
- **Google_Provider**: The NextAuth Google OAuth provider that handles the OAuth 2.0 flow with Google's authorization servers.
- **Email_OTP_Provider**: The NextAuth Email provider that sends a one-time password to the user's email address for passwordless verification.
- **Auth_Page**: The single unified authentication page at `/auth` that presents both Google OAuth and email OTP sign-in options. Replaces the former separate `/auth/signin` and `/auth/signup` pages.
- **User_Session**: The NextAuth session object containing user identity information (id, email, name, image) persisted across requests.
- **Google_Button**: A UI button on the Auth_Page that initiates the Google OAuth flow, labeled "Sign in with Google".
- **Email_Input**: A text input field on the Auth_Page where the user enters their email address to receive an OTP.
- **OTP_Code**: A one-time password sent to the user's email address for verification.
- **Supabase_Database**: The Supabase PostgreSQL database used by PalAI for persistent data storage.
- **New_User**: A user authenticating with PalAI for the first time, identified by having no prior session or account record.
- **Returning_User**: A user who has previously completed authentication and onboarding in PalAI.
- **Onboarding_Tour**: A guided walkthrough shown to New_Users after their first successful authentication, introducing key features of PalAI.

## Requirements

### Requirement 1: Google OAuth Provider Configuration

**User Story:** As a developer, I want the NextAuth configuration to include the Google OAuth provider, so that users can authenticate via Google without a password.

#### Acceptance Criteria for Requirement 1

1. THE Auth_System SHALL include the Google_Provider as a provider in the NextAuth configuration.
2. THE Auth_System SHALL read the Google client ID from the `GOOGLE_CLIENT_ID` environment variable.
3. THE Auth_System SHALL read the Google client secret from the `GOOGLE_CLIENT_SECRET` environment variable.
4. IF the `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` environment variables are missing, THEN THE Auth_System SHALL omit the Google_Provider from the available providers and log a warning at startup.

### Requirement 2: Email OTP Provider Configuration

**User Story:** As a developer, I want the NextAuth configuration to include an email OTP provider, so that users can authenticate by receiving a one-time password at their email address.

#### Acceptance Criteria for Requirement 2

1. THE Auth_System SHALL include the Email_OTP_Provider as a provider in the NextAuth configuration.
2. WHEN a user submits an email address via the Email_Input, THE Email_OTP_Provider SHALL send an OTP_Code to that email address.
3. THE Email_OTP_Provider SHALL generate an OTP_Code that expires after 10 minutes.
4. IF the user submits an invalid email format, THEN THE Auth_Page SHALL display a validation error without sending an OTP_Code.
5. IF the email delivery fails, THEN THE Auth_System SHALL display an error message instructing the user to try again.

### Requirement 3: Unified Auth Page

**User Story:** As a farmer using PalAI, I want a single authentication page with Google and email OTP options, so that I can sign in without remembering a password.

#### Acceptance Criteria for Requirement 3

1. THE Auth_Page SHALL display a Google_Button labeled "Sign in with Google" with a recognizable Google icon.
2. THE Auth_Page SHALL display an Email_Input field with a submit button for requesting an OTP_Code.
3. THE Google_Button and the Email_Input SHALL be visually separated by a divider with the text "or".
4. THE Auth_Page SHALL NOT display any password input fields.
5. THE Auth_Page SHALL NOT distinguish between sign-in and sign-up flows; both new and returning users use the same page.
6. WHEN a user clicks the Google_Button, THE Auth_Page SHALL initiate the Google OAuth sign-in flow via NextAuth.
7. WHEN a user submits a valid email address via the Email_Input, THE Auth_Page SHALL transition to an OTP verification view where the user enters the OTP_Code received by email.
8. WHEN the user enters a valid OTP_Code, THE Auth_System SHALL authenticate the user and create a User_Session.
9. IF the user enters an incorrect OTP_Code, THEN THE Auth_Page SHALL display an error message and allow the user to retry.
10. IF the OTP_Code has expired, THEN THE Auth_Page SHALL inform the user and allow requesting a new OTP_Code.

### Requirement 4: New User Detection and Onboarding Tour

**User Story:** As a new farmer using PalAI for the first time, I want to see a guided onboarding tour after signing in, so that I understand how to use the app to diagnose rice leaf diseases.

#### Acceptance Criteria for Requirement 4

1. WHEN a New_User completes authentication, THE Auth_System SHALL flag the user as new in the Supabase_Database.
2. WHEN a New_User completes authentication, THE Auth_System SHALL redirect the user to the Onboarding_Tour.
3. THE Onboarding_Tour SHALL introduce the core features of PalAI, including how to scan a rice leaf for disease diagnosis.
4. WHEN the user completes or skips the Onboarding_Tour, THE Auth_System SHALL mark the user as onboarded in the Supabase_Database and redirect to the homepage.

### Requirement 5: Returning User Redirect

**User Story:** As a returning farmer, I want to be redirected straight to the homepage after signing in, so that I can start diagnosing rice leaf diseases immediately.

#### Acceptance Criteria for Requirement 5

1. WHEN a Returning_User completes authentication, THE Auth_System SHALL redirect the user directly to the homepage.
2. THE Auth_System SHALL identify a Returning_User by checking the onboarded flag in the Supabase_Database.

### Requirement 6: Session Handling for Authenticated Users

**User Story:** As an authenticated user, I want my session to contain my profile information regardless of sign-in method, so that the app can personalize my experience.

#### Acceptance Criteria for Requirement 6

1. WHEN a user authenticates via the Google_Provider, THE Auth_System SHALL store the user's Google email, display name, and profile image URL in the User_Session.
2. WHEN a user authenticates via the Email_OTP_Provider, THE Auth_System SHALL store the user's email in the User_Session.
3. THE Auth_System SHALL include the user's unique identifier in the User_Session JWT token regardless of authentication method.
4. THE Auth_System SHALL use the email address as the shared identifier for linking accounts across providers.

### Requirement 7: Legacy Auth Page Consolidation

**User Story:** As a developer, I want the old separate sign-in and sign-up pages removed and replaced by the unified Auth_Page, so that users are not confused by multiple entry points.

#### Acceptance Criteria for Requirement 7

1. THE Auth_System SHALL remove the `/auth/signin` page and the `/auth/signup` page.
2. THE Auth_System SHALL serve the Auth_Page at the `/auth` route.
3. WHEN a user navigates to `/auth/signin` or `/auth/signup`, THE Auth_System SHALL redirect to `/auth`.
4. THE Auth_System SHALL configure NextAuth to use `/auth` as the custom sign-in page.

### Requirement 8: Environment Variable Documentation

**User Story:** As a developer setting up PalAI, I want the required environment variables for Google OAuth and email OTP documented in the `.env.example` file, so that I know what credentials to configure.

#### Acceptance Criteria for Requirement 8

1. THE Auth_System SHALL document the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` variables in the `.env.example` file under a Google OAuth section.
2. THE Auth_System SHALL document the email provider configuration variables (SMTP host, port, user, password, from address) in the `.env.example` file under an Email OTP section.
