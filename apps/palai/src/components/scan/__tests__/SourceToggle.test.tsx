/// <reference types="vitest/globals" />
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import fc from 'fast-check';
import { SourceToggle } from '../SourceToggle';

// Feature: remote-camera-hub, Property 14: Toggle visibility depends on environment variable

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
  cleanup();
});

describe('SourceToggle', () => {
  /**
   * Property 14: Toggle visibility depends on environment variable
   * For any value of NEXT_PUBLIC_PI_TUNNEL_URL, the SourceToggle component
   * shall be rendered if and only if the value is a non-empty string.
   *
   * Validates: Requirements 8.2, 8.3
   */
  it('renders toggle iff NEXT_PUBLIC_PI_TUNNEL_URL is a non-empty string', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Non-empty strings that have non-whitespace content (should render)
          fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          // Empty string (should not render)
          fc.constant(''),
          // Whitespace-only strings (should not render)
          fc.nat({ max: 10 }).map((n) => ' '.repeat(n + 1)),
          // Undefined (should not render)
          fc.constant(undefined as unknown as string)
        ),
        (envValue) => {
          cleanup();

          if (envValue === undefined) {
            delete process.env.NEXT_PUBLIC_PI_TUNNEL_URL;
          } else {
            process.env.NEXT_PUBLIC_PI_TUNNEL_URL = envValue;
          }

          const { container } = render(<SourceToggle source="mobile" onSourceChange={() => {}} />);

          const shouldRender =
            envValue !== undefined && typeof envValue === 'string' && envValue.trim().length > 0;

          if (shouldRender) {
            // Toggle should be visible with both options
            expect(container.firstChild).not.toBeNull();
            expect(container.textContent).toContain('Mobile Camera');
            expect(container.textContent).toContain('PalAI Hub');
          } else {
            // Toggle should not render anything
            expect(container.firstChild).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
