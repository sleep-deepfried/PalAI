import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkLiveCompatibility, checkBandwidth } from './live-compatibility';

describe('checkLiveCompatibility', () => {
  const originalNavigator = globalThis.navigator;
  const originalAudioContext = globalThis.AudioContext;
  const originalWebSocket = globalThis.WebSocket;

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'AudioContext', {
      value: originalAudioContext,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'WebSocket', {
      value: originalWebSocket,
      writable: true,
      configurable: true,
    });
    delete (globalThis as Record<string, unknown>).webkitAudioContext;
  });

  it('returns supported:true when all APIs are present', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { mediaDevices: { getUserMedia: vi.fn() } },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'AudioContext', {
      value: class {},
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'WebSocket', {
      value: class {},
      writable: true,
      configurable: true,
    });

    const result = checkLiveCompatibility();
    expect(result.supported).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('reports getUserMedia missing when navigator.mediaDevices is absent', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'AudioContext', {
      value: class {},
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'WebSocket', {
      value: class {},
      writable: true,
      configurable: true,
    });

    const result = checkLiveCompatibility();
    expect(result.supported).toBe(false);
    expect(result.missing).toContain('getUserMedia');
  });

  it('reports AudioContext missing when neither AudioContext nor webkitAudioContext exist', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { mediaDevices: { getUserMedia: vi.fn() } },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'AudioContext', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'WebSocket', {
      value: class {},
      writable: true,
      configurable: true,
    });

    const result = checkLiveCompatibility();
    expect(result.supported).toBe(false);
    expect(result.missing).toContain('AudioContext');
  });

  it('accepts webkitAudioContext as a valid AudioContext', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { mediaDevices: { getUserMedia: vi.fn() } },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'AudioContext', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    (globalThis as Record<string, unknown>).webkitAudioContext = class {};
    Object.defineProperty(globalThis, 'WebSocket', {
      value: class {},
      writable: true,
      configurable: true,
    });

    const result = checkLiveCompatibility();
    expect(result.supported).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('reports WebSocket missing', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { mediaDevices: { getUserMedia: vi.fn() } },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'AudioContext', {
      value: class {},
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'WebSocket', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const result = checkLiveCompatibility();
    expect(result.supported).toBe(false);
    expect(result.missing).toContain('WebSocket');
  });

  it('reports all APIs missing when none are present', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'AudioContext', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'WebSocket', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const result = checkLiveCompatibility();
    expect(result.supported).toBe(false);
    expect(result.missing).toEqual(['getUserMedia', 'AudioContext', 'WebSocket']);
  });
});

describe('checkBandwidth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns sufficient:true for fast responses', async () => {
    // Simulate a 500-byte response in 1ms → very high kbps
    const mockArrayBuffer = new ArrayBuffer(500);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      arrayBuffer: () => Promise.resolve(mockArrayBuffer),
    } as Response);

    // Mock performance.now to simulate 1ms elapsed
    let callCount = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 0 : 1;
    });

    const result = await checkBandwidth();
    expect(result.sufficient).toBe(true);
    expect(result.estimatedKbps).toBeGreaterThan(50);
  });

  it('returns sufficient:false for slow responses', async () => {
    // Simulate a 100-byte response in 5000ms → ~0.16 kbps
    const mockArrayBuffer = new ArrayBuffer(100);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      arrayBuffer: () => Promise.resolve(mockArrayBuffer),
    } as Response);

    let callCount = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 0 : 5000;
    });

    const result = await checkBandwidth();
    expect(result.sufficient).toBe(false);
    expect(result.estimatedKbps).toBeLessThan(50);
  });

  it('returns sufficient:false and estimatedKbps:0 on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const result = await checkBandwidth();
    expect(result.sufficient).toBe(false);
    expect(result.estimatedKbps).toBe(0);
  });
});
