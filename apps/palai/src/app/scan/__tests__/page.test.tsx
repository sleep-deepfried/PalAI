/// <reference types="vitest/globals" />
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import fc from 'fast-check';

// Feature: remote-camera-hub, Property 10: Source toggle controls component rendering
// Feature: remote-camera-hub, Property 12: Successful capture redirects to result page

// --- Shared mock state ---
const mockPush = vi.fn();
const mockRedirect = vi.fn();

// We must mock all child components and next/navigation BEFORE any dynamic imports
// of the scan page, since vi.mock is hoisted.

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  redirect: (...args: any[]) => mockRedirect(...args),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'authenticated' }),
}));

vi.mock('@/components/scan/CameraCapture', () => ({
  CameraCapture: (props: any) => <div data-testid="camera-capture" />,
}));

vi.mock('@/components/scan/ImagePreview', () => ({
  ImagePreview: (props: any) => <div data-testid="image-preview" />,
}));

vi.mock('@/components/scan/SourceToggle', () => ({
  SourceToggle: (props: any) => (
    <div
      data-testid="source-toggle"
      data-source={props.source}
      onClick={() => props.onSourceChange('hub')}
    />
  ),
}));

vi.mock('@/components/scan/HubStream', () => ({
  HubStream: (props: any) => <div data-testid="hub-stream" />,
}));

vi.mock('@/components/scan/HubCaptureButton', () => ({
  HubCaptureButton: (props: any) => (
    <div
      data-testid="hub-capture-button"
      data-disabled={props.disabled}
      onClick={() => {
        props.onCaptureStart();
        // Simulate async capture — caller can control success/error via tunnelUrl convention
      }}
    />
  ),
}));

vi.mock('@/components/ui/LoadingOverlay', () => ({
  LoadingOverlay: (props: any) => (
    <div data-testid="loading-overlay" data-message={props.message} />
  ),
}));

vi.mock('@/components/ui/MultiStepProgress', () => ({
  MultiStepProgress: (props: any) => <div data-testid="multi-step-progress" />,
}));

vi.mock('../../actions/scan', () => ({
  uploadAndDiagnose: vi.fn(),
}));

// Mock new live diagnosis dependencies
const mockStartSession = vi.fn();
const mockEndSession = vi.fn();

vi.mock('@/hooks/useLiveSession', () => ({
  useLiveSession: () => ({
    status: 'idle' as const,
    timeRemaining: 120,
    isWarning: false,
    transcription: '',
    isSpeaking: false,
    error: null,
    startSession: mockStartSession,
    endSession: mockEndSession,
  }),
}));

vi.mock('@/lib/live-compatibility', () => ({
  checkLiveCompatibility: () => ({ supported: false, missing: ['AudioContext'] }),
}));

vi.mock('@/components/scan/ModeSelector', () => ({
  ModeSelector: (props: any) => (
    <div
      data-testid="mode-selector"
      data-mode={props.mode}
      data-live-supported={props.liveSupported}
      onClick={() => props.onModeChange(props.mode === 'photo' ? 'live' : 'photo')}
    />
  ),
}));

vi.mock('@/components/scan/LiveSessionUI', () => ({
  LiveSessionUI: (props: any) => <div data-testid="live-session-ui" />,
}));

// Mock lucide-react icons used in the page
vi.mock('lucide-react', () => ({
  Maximize2: () => <span data-testid="maximize-icon" />,
  Minimize2: () => <span data-testid="minimize-icon" />,
  Smartphone: () => <span data-testid="smartphone-icon" />,
  Radio: () => <span data-testid="radio-icon" />,
  X: () => <span data-testid="x-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  Camera: () => <span data-testid="camera-icon" />,
  RotateCw: () => <span data-testid="rotate-icon" />,
  Upload: () => <span data-testid="upload-icon" />,
}));

// Store original env
const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  // Mock fullscreen API
  document.documentElement.requestFullscreen = vi
    .fn()
    .mockRejectedValue(new Error('not supported'));
  document.exitFullscreen = vi.fn().mockRejectedValue(new Error('not supported'));
  Object.defineProperty(document, 'fullscreenElement', {
    value: null,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  process.env = { ...originalEnv };
});

/**
 * Helper: dynamically import the scan page with a fresh module evaluation.
 * The page reads process.env.NEXT_PUBLIC_PI_TUNNEL_URL inside a useEffect,
 * so tests must use waitFor to allow the state update to propagate.
 */
async function importScanPage() {
  vi.resetModules();
  // Re-apply mocks after resetModules — vi.mock calls are hoisted so they persist
  const { render, screen, fireEvent, act, waitFor } = await import('@testing-library/react');
  const mod = await import('../page');
  const ScanPage = mod.default;
  return { ScanPage, render, screen, fireEvent, act, waitFor };
}

// =============================================================================
// Task 9.2 — Property 10: Source toggle controls component rendering
// =============================================================================
describe('ScanPage — Property 10: Source toggle controls component rendering', () => {
  /**
   * Property 10: Source toggle controls component rendering
   * For any source state value, when source is "hub" the page shall render
   * HubStream and HubCaptureButton and shall not render CameraCapture;
   * when source is "mobile" the page shall render CameraCapture and shall
   * not render HubStream or HubCaptureButton.
   *
   * Validates: Requirements 5.3, 5.4, 5.6, 7.1
   */
  it('renders correct components based on source state', async () => {
    process.env.NEXT_PUBLIC_PI_TUNNEL_URL = 'https://hub.example.com';
    const { ScanPage, render, screen, fireEvent, act, waitFor } = await importScanPage();

    await fc.assert(
      fc.asyncProperty(fc.constantFrom('mobile' as const, 'hub' as const), async (sourceState) => {
        cleanup();

        let container: ReturnType<typeof render>;
        await act(async () => {
          container = render(<ScanPage />);
        });

        // Wait for useEffect to resolve tunnel URL and show SourceToggle
        await waitFor(() => {
          expect(screen.getByTestId('source-toggle')).toBeInTheDocument();
        });

        // Page defaults to "mobile". If we need "hub", click the toggle.
        if (sourceState === 'hub') {
          const toggle = screen.getByTestId('source-toggle');
          await act(async () => {
            fireEvent.click(toggle);
          });
        }

        if (sourceState === 'hub') {
          // Hub mode: HubStream and HubCaptureButton should be present
          expect(screen.getByTestId('hub-stream')).toBeInTheDocument();
          expect(screen.getByTestId('hub-capture-button')).toBeInTheDocument();
          // CameraCapture should NOT be present
          expect(screen.queryByTestId('camera-capture')).not.toBeInTheDocument();
        } else {
          // Mobile mode: CameraCapture should be present
          expect(screen.getByTestId('camera-capture')).toBeInTheDocument();
          // Hub components should NOT be present
          expect(screen.queryByTestId('hub-stream')).not.toBeInTheDocument();
          expect(screen.queryByTestId('hub-capture-button')).not.toBeInTheDocument();
        }

        container!.unmount();
      }),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Task 9.3 — Property 12: Successful capture redirects to result page
// =============================================================================
describe('ScanPage — Property 12: Successful capture redirects to result page', () => {
  /**
   * Property 12: Successful capture redirects to result page
   * For any scan ID returned by a successful capture response, the page
   * shall navigate to /result/{scanId}.
   *
   * Validates: Requirements 7.4
   */
  it('calls router.push with /result/{scanId} on successful capture', async () => {
    process.env.NEXT_PUBLIC_PI_TUNNEL_URL = 'https://hub.example.com';
    const { ScanPage, render, screen, fireEvent, act } = await importScanPage();

    // We need to re-mock HubCaptureButton to simulate success with a given scanId.
    // Since vi.mock is hoisted, we use a module-level variable approach.
    // Instead, we'll mock the fetch that useHubCapture calls internally.

    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (scanId) => {
        cleanup();
        mockPush.mockClear();

        // Mock fetch to return the generated scanId
        const fetchMock = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ scanId }),
        });
        globalThis.fetch = fetchMock;

        // We need to re-mock HubCaptureButton to call onCaptureSuccess with the scanId
        // Since vi.mock is hoisted, we'll use a different approach:
        // Override the mock implementation for this test
        const hubCaptureButtonModule = await import('@/components/scan/HubCaptureButton');
        const originalImpl = hubCaptureButtonModule.HubCaptureButton;

        // Use vi.spyOn won't work on ESM mocks, so we use a custom approach:
        // We'll render the page and simulate the capture flow by directly
        // triggering the onCaptureSuccess callback through the mock component.

        let capturedProps: any = null;

        // Re-mock HubCaptureButton to capture props and simulate success
        vi.doMock('@/components/scan/HubCaptureButton', () => ({
          HubCaptureButton: (props: any) => {
            capturedProps = props;
            return (
              <div
                data-testid="hub-capture-button"
                data-disabled={props.disabled}
                onClick={() => {
                  props.onCaptureStart();
                  props.onCaptureSuccess(scanId);
                }}
              />
            );
          },
        }));

        // Re-import with fresh modules to pick up doMock
        vi.resetModules();
        const {
          render: freshRender,
          screen: freshScreen,
          fireEvent: freshFireEvent,
          act: freshAct,
          waitFor: freshWaitFor,
        } = await import('@testing-library/react');
        const freshMod = await import('../page');
        const FreshScanPage = freshMod.default;

        let container: ReturnType<typeof freshRender>;
        await freshAct(async () => {
          container = freshRender(<FreshScanPage />);
        });

        // Wait for useEffect to resolve tunnel URL
        await freshWaitFor(() => {
          expect(freshScreen.getByTestId('source-toggle')).toBeInTheDocument();
        });

        // Switch to hub mode
        const toggle = freshScreen.getByTestId('source-toggle');
        await freshAct(async () => {
          freshFireEvent.click(toggle);
        });

        // Click capture button — triggers onCaptureSuccess(scanId)
        const captureBtn = freshScreen.getByTestId('hub-capture-button');
        await freshAct(async () => {
          freshFireEvent.click(captureBtn);
        });

        expect(mockPush).toHaveBeenCalledWith(`/result/${scanId}`);

        container!.unmount();
      }),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Task 9.4 — Unit tests for scan page hub integration
// =============================================================================
describe('ScanPage — Unit tests for hub integration', () => {
  /**
   * Test SourceToggle defaults to "Mobile Camera" on mount.
   * Requirements: 5.2
   */
  it('defaults to mobile camera source on mount', async () => {
    process.env.NEXT_PUBLIC_PI_TUNNEL_URL = 'https://hub.example.com';
    const { ScanPage, render, screen, act, waitFor } = await importScanPage();

    await act(async () => {
      render(<ScanPage />);
    });

    // Wait for useEffect to resolve tunnel URL
    await waitFor(() => {
      expect(screen.getByTestId('source-toggle')).toBeInTheDocument();
    });

    const toggle = screen.getByTestId('source-toggle');
    expect(toggle).toHaveAttribute('data-source', 'mobile');

    // CameraCapture should be shown (mobile is default)
    expect(screen.getByTestId('camera-capture')).toBeInTheDocument();
    // Hub components should NOT be shown
    expect(screen.queryByTestId('hub-stream')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hub-capture-button')).not.toBeInTheDocument();
  });

  /**
   * Test LoadingOverlay shown during hub capture.
   * Requirements: 7.3
   */
  it('shows LoadingOverlay during hub capture', async () => {
    process.env.NEXT_PUBLIC_PI_TUNNEL_URL = 'https://hub.example.com';

    // Mock HubCaptureButton to call onCaptureStart but NOT onCaptureSuccess
    // so the loading state persists
    vi.doMock('@/components/scan/HubCaptureButton', () => ({
      HubCaptureButton: (props: any) => (
        <div
          data-testid="hub-capture-button"
          onClick={() => {
            props.onCaptureStart();
            // Don't call onCaptureSuccess — keep loading state
          }}
        />
      ),
    }));

    vi.resetModules();
    const { render, screen, fireEvent, act } = await import('@testing-library/react');
    const mod = await import('../page');
    const ScanPage = mod.default;

    await act(async () => {
      render(<ScanPage />);
    });

    // Wait for useEffect to resolve tunnel URL and show SourceToggle
    const { waitFor } = await import('@testing-library/react');
    await waitFor(() => {
      expect(screen.getByTestId('source-toggle')).toBeInTheDocument();
    });

    // Switch to hub mode
    const toggle = screen.getByTestId('source-toggle');
    await act(async () => {
      fireEvent.click(toggle);
    });

    // Verify no loading overlay initially
    expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();

    // Click capture — triggers onCaptureStart, sets isHubCapturing = true
    const captureBtn = screen.getByTestId('hub-capture-button');
    await act(async () => {
      fireEvent.click(captureBtn);
    });

    // LoadingOverlay should now be visible
    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
  });

  /**
   * Test capture error shows retry option (hub error message displayed).
   * Requirements: 7.5
   */
  it('shows error message when hub capture fails', async () => {
    process.env.NEXT_PUBLIC_PI_TUNNEL_URL = 'https://hub.example.com';

    const errorMessage = 'Camera module is unavailable.';

    // Mock HubCaptureButton to call onCaptureStart then onCaptureError
    vi.doMock('@/components/scan/HubCaptureButton', () => ({
      HubCaptureButton: (props: any) => (
        <div
          data-testid="hub-capture-button"
          onClick={() => {
            props.onCaptureStart();
            // Simulate error after capture start
            props.onCaptureError(errorMessage);
          }}
        />
      ),
    }));

    vi.resetModules();
    const { render, screen, fireEvent, act, waitFor } = await import('@testing-library/react');
    const mod2 = await import('../page');
    const ScanPage2 = mod2.default;

    await act(async () => {
      render(<ScanPage2 />);
    });

    // Wait for useEffect to resolve tunnel URL
    await waitFor(() => {
      expect(screen.getByTestId('source-toggle')).toBeInTheDocument();
    });

    // Switch to hub mode
    const toggle = screen.getByTestId('source-toggle');
    await act(async () => {
      fireEvent.click(toggle);
    });

    // Click capture — triggers error
    const captureBtn = screen.getByTestId('hub-capture-button');
    await act(async () => {
      fireEvent.click(captureBtn);
    });

    // Error message should be displayed
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  /**
   * Test SourceToggle not rendered when env var is undefined.
   * Requirements: 8.2
   */
  it('does not render SourceToggle when NEXT_PUBLIC_PI_TUNNEL_URL is undefined', async () => {
    delete process.env.NEXT_PUBLIC_PI_TUNNEL_URL;
    const { ScanPage, render, screen, act, waitFor } = await importScanPage();

    await act(async () => {
      render(<ScanPage />);
    });

    // Give useEffect time to run — it should NOT set isHubAvailable
    // We wait a tick then verify SourceToggle is absent
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // SourceToggle should not be in the DOM
    expect(screen.queryByTestId('source-toggle')).not.toBeInTheDocument();

    // CameraCapture should still be rendered (mobile-only mode)
    expect(screen.getByTestId('camera-capture')).toBeInTheDocument();
  });
});
