import { describe, it, expect } from 'vitest';
import { isValidEmail } from './validation';

describe('isValidEmail', () => {
  it('should accept a standard email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('should accept emails with subdomains', () => {
    expect(isValidEmail('user@mail.example.com')).toBe(true);
  });

  it('should accept emails with plus addressing', () => {
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  it('should accept emails with dots in local part', () => {
    expect(isValidEmail('first.last@example.com')).toBe(true);
  });

  it('should reject empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('should reject whitespace-only string', () => {
    expect(isValidEmail('   ')).toBe(false);
  });

  it('should reject string without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('should reject string without domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('should reject string without local part', () => {
    expect(isValidEmail('@example.com')).toBe(false);
  });

  it('should reject string with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });

  it('should reject double @', () => {
    expect(isValidEmail('user@@example.com')).toBe(false);
  });
});
