/// <reference types="vitest/globals" />
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the hook
// ---------------------------------------------------------------------------

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'test-user' } } }),
}));

// Mock @google/genai
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(),
}));

// Mock live-compatibility
vi.mock('@/lib/live-compatibility', () => ({
  checkLiveCompatibility: vi.fn(() => ({ supported: true, missing: [] })),
}));

// Mock audio-utils
vi.mock('@/lib/audio-utils', () => ({
  resampleAndEncode: vi.fn(() => new ArrayBuffer(0)),
  arrayBufferToBase64: vi.fn(() => ''),
}));

// Mock audio-player
vi.mock('@/lib/audio-player', () => ({
  AudioPlayer: vi.fn(() => ({
    enqueue: vi.fn(),
    stop: vi.fn(),
    isPlaying: false,
  })),
}));

// Mock video-streamer
vi.mock('@/lib/video-streamer', () => ({
  startVideoCapture: vi.fn(() => vi.fn()),
}));

// Mock diagnosis-extractor
vi.mock('@/lib/diagnosis-extractor', () => ({
  extractDiagnosis: vi.fn(),
}));

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'scan-1' }, error: null })),
        })),
      })),
    })),
  },
}));

import { useLiveSession } from '../useLiveSession';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createVideoRef() {
  return { current: document.createElement('video') } as React.RefObject<HTMLVideoElement>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useLiveSession — session timer (Task 9.2)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes timeRemaining to sessionDuration', () => {
    const { result } = renderHook(() =>
      useLiveSession({
        videoRef: createVideoRef(),
        onDiagnosisComplete: vi.fn(),
        onFallback: vi.fn(),
        sessionDuration: 90,
      })
    );

    expect(result.current.timeRemaining).toBe(90);
  });

  it('defaults timeRemaining to 120 when sessionDuration is not provided', () => {
    const { result } = renderHook(() =>
      useLiveSession({
        videoRef: createVideoRef(),
        onDiagnosisComplete: vi.fn(),
        onFallback: vi.fn(),
      })
    );

    expect(result.current.timeRemaining).toBe(120);
  });

  it('isWarning is false initially', () => {
    const { result } = renderHook(() =>
      useLiveSession({
        videoRef: createVideoRef(),
        onDiagnosisComplete: vi.fn(),
        onFallback: vi.fn(),
      })
    );

    expect(result.current.isWarning).toBe(false);
  });
});
