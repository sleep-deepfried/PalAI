/**
 * Audio resampling and PCM encoding utilities for the Gemini Live API.
 *
 * The Live API expects 16kHz mono 16-bit little-endian PCM input.
 * Browser microphones typically capture at 44100 or 48000 Hz,
 * so we resample down before sending.
 */

/**
 * Resample a Float32Array audio chunk from `sourceSampleRate` to `targetSampleRate`
 * and encode as 16-bit little-endian PCM.
 *
 * Uses linear interpolation for resampling.
 */
export function resampleAndEncode(
  input: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number
): ArrayBuffer {
  const ratio = sourceSampleRate / targetSampleRate;
  const outputLength = Math.round(input.length / ratio);
  const buffer = new ArrayBuffer(outputLength * 2); // 2 bytes per 16-bit sample
  const view = new DataView(buffer);

  for (let i = 0; i < outputLength; i++) {
    // Linear interpolation between source samples
    const srcIndex = i * ratio;
    const lower = Math.floor(srcIndex);
    const upper = Math.min(lower + 1, input.length - 1);
    const frac = srcIndex - lower;
    const sample = input[lower] + frac * (input[upper] - input[lower]);

    // Clamp to [-1, 1] then scale to 16-bit signed integer range
    const clamped = Math.max(-1, Math.min(1, sample));
    const int16 = Math.round(clamped * 32767);
    view.setInt16(i * 2, int16, true); // little-endian
  }

  return buffer;
}

/**
 * Convert an ArrayBuffer to a base64-encoded string.
 * Used to encode PCM data before sending over the WebSocket.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
