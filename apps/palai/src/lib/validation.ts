/**
 * Email validation utility for client-side format checking.
 * Uses an RFC 5322 compliant regex pattern.
 */

// RFC 5322 compliant email regex pattern
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validates whether a given string is a valid email format.
 * Returns false for empty strings, whitespace-only strings, and malformed emails.
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.trim().length === 0) {
    return false;
  }

  return EMAIL_REGEX.test(email);
}
