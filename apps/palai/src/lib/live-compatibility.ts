/**
 * Live diagnosis compatibility and bandwidth checking utilities.
 */

export interface CompatibilityResult {
  supported: boolean;
  missing: string[];
}

export interface BandwidthResult {
  sufficient: boolean;
  estimatedKbps: number;
}

const BANDWIDTH_THRESHOLD_KBPS = 20;

/**
 * Checks whether the current browser supports the APIs required for
 * a live diagnosis session: getUserMedia, AudioContext, and WebSocket.
 *
 * Returns which APIs (if any) are missing.
 */
export function checkLiveCompatibility(): CompatibilityResult {
  const missing: string[] = [];

  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== 'function'
  ) {
    missing.push('getUserMedia');
  }

  const hasAudioContext =
    typeof AudioContext !== 'undefined' ||
    typeof (globalThis as Record<string, unknown>).webkitAudioContext !== 'undefined';
  if (!hasAudioContext) {
    missing.push('AudioContext');
  }

  if (typeof WebSocket === 'undefined') {
    missing.push('WebSocket');
  }

  return {
    supported: missing.length === 0,
    missing,
  };
}

/**
 * Performs a lightweight bandwidth probe by fetching a small static asset
 * from the app's own origin and measuring the round-trip time.
 *
 * Returns whether the estimated throughput meets the ~20 kbps threshold
 * needed for a live session. The threshold is intentionally low because
 * the probe payload (manifest.json) is small and latency-dominated,
 * making it a connectivity sanity check rather than a true bandwidth test.
 */
export async function checkBandwidth(): Promise<BandwidthResult> {
  const probeUrl = '/manifest.json';

  try {
    const start = performance.now();
    const response = await fetch(probeUrl, { cache: 'no-store' });
    const data = await response.arrayBuffer();
    const elapsed = performance.now() - start;

    const sizeKb = (data.byteLength * 8) / 1000;
    const seconds = elapsed / 1000;
    const estimatedKbps = seconds > 0 ? Math.round(sizeKb / seconds) : 0;

    return {
      sufficient: estimatedKbps >= BANDWIDTH_THRESHOLD_KBPS,
      estimatedKbps,
    };
  } catch {
    return {
      sufficient: false,
      estimatedKbps: 0,
    };
  }
}
