import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should handle tailwind merge conflicts', () => {
    // tailwind-merge should keep the last conflicting class
    const result = cn('p-4', 'p-8');
    expect(result).toBe('p-8');
  });
});

