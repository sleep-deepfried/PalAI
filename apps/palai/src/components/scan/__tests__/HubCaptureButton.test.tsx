/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import fc from 'fast-check';
import { HubCaptureButton } from '../HubCaptureButton';

// Feature: remote-camera-hub, Property 13: Capture button disabled during capture

const originalFetch = globalThis.fetch;

beforeEach(() => {
  // Mock fetch to prevent real network calls
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ scanId: 'test-id' }),
  });
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('HubCaptureButton', () => {
  /**
   * Property 13: Capture button disabled during capture
   * For any state where disabled prop is true, the "Capture from Hub" button
   * shall have its disabled attribute set to true.
   *
   * Validates: Requirements 7.6
   */
  it('has disabled attribute when disabled prop is true', () => {
    fc.assert(
      fc.property(fc.webUrl({ withFragments: false, withQueryParameters: false }), (tunnelUrl) => {
        const { unmount } = render(
          <HubCaptureButton
            tunnelUrl={tunnelUrl}
            onCaptureStart={vi.fn()}
            onCaptureSuccess={vi.fn()}
            onCaptureError={vi.fn()}
            disabled={true}
          />
        );

        const button = screen.getByRole('button', { name: /capture from hub/i });
        expect(button).toBeDisabled();

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Complementary check: button is enabled when disabled prop is false.
   */
  it('is not disabled when disabled prop is false', () => {
    render(
      <HubCaptureButton
        tunnelUrl="https://hub.test"
        onCaptureStart={vi.fn()}
        onCaptureSuccess={vi.fn()}
        onCaptureError={vi.fn()}
        disabled={false}
      />
    );

    const button = screen.getByRole('button', { name: /capture from hub/i });
    expect(button).not.toBeDisabled();
  });
});
