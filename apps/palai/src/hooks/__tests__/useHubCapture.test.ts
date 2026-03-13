/// <reference types="vitest/globals" />
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import fc from 'fast-check';
import { useHubCapture } from '../useHubCapture';

// Feature: remote-camera-hub, Property 11: Hub capture sends POST to correct URL

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('useHubCapture', () => {
  /**
   * Property 11: Hub capture sends POST to correct URL
   * For any tunnel URL value and capture trigger, the fetch call shall be
   * a POST request to {tunnelUrl}/capture.
   *
   * Validates: Requirements 7.2
   */
  it('sends POST to {tunnelUrl}/capture for any tunnel URL', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl({ withFragments: false, withQueryParameters: false }),
        async (tunnelUrl) => {
          // Remove trailing slash for consistent URL construction
          const normalizedUrl = tunnelUrl.replace(/\/+$/, '');

          const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ scanId: 'test-scan-id' }),
          });
          globalThis.fetch = fetchMock;

          const { result } = renderHook(() => useHubCapture(normalizedUrl));

          await act(async () => {
            await result.current.triggerCapture();
          });

          expect(fetchMock).toHaveBeenCalledTimes(1);
          const [calledUrl, calledOptions] = fetchMock.mock.calls[0];
          expect(calledUrl).toBe(`${normalizedUrl}/capture`);
          expect(calledOptions.method).toBe('POST');
        }
      ),
      { numRuns: 100 }
    );
  });
});
