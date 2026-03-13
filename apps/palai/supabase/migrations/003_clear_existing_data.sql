-- One-time destructive migration: clear all existing data before applying new auth schema.
-- Old data was created without proper auth (credentials-based) and is incompatible
-- with the new Google OAuth + email OTP authentication system.

-- TRUNCATE CASCADE handles foreign key dependencies (scans.user_id -> users.id)
TRUNCATE TABLE scans, users CASCADE;
