import { describe, it, expect } from 'vitest';
import { resampleAndEncode, arrayBufferToBase64 } from './audio-utils';

describe('resampleAndEncode', () => {
  it('produces correct output length when downsampling 48kHz to 16kHz', () => {
    const input = new Float32Array(480); // 10ms at 48kHz
    const result = resampleAndEncode(input, 48000, 16000);
    const expectedSamples = Math.round(480 / 3); // ratio = 3
    expect(result.byteLength).toBe(expectedSamples * 2);
  });

  it('produces correct output length when downsampling 44100Hz to 16kHz', () => {
    const input = new Float32Array(441); // 10ms at 44100Hz
    const result = resampleAndEncode(input, 44100, 16000);
    const expectedSamples = Math.round((441 * 16000) / 44100);
    expect(result.byteLength).toBe(expectedSamples * 2);
  });

  it('clamps samples to 16-bit signed range', () => {
    // Values beyond [-1, 1] should be clamped
    const input = new Float32Array([2.0, -2.0, 0.5, -0.5]);
    const result = resampleAndEncode(input, 16000, 16000); // same rate, no resampling
    const view = new DataView(result);

    const expectedSamples = Math.round(4);
    expect(result.byteLength).toBe(expectedSamples * 2);

    // +2.0 clamped to +1.0 → 32767
    expect(view.getInt16(0, true)).toBe(32767);
    // -2.0 clamped to -1.0 → -32767 (Math.round(-1 * 32767))
    expect(view.getInt16(2, true)).toBe(-32767);
  });

  it('encodes silence as zeros', () => {
    const input = new Float32Array(160); // all zeros
    const result = resampleAndEncode(input, 16000, 16000);
    const view = new DataView(result);
    for (let i = 0; i < result.byteLength / 2; i++) {
      expect(view.getInt16(i * 2, true)).toBe(0);
    }
  });

  it('returns empty buffer for empty input', () => {
    const input = new Float32Array(0);
    const result = resampleAndEncode(input, 48000, 16000);
    expect(result.byteLength).toBe(0);
  });
});

describe('arrayBufferToBase64', () => {
  it('encodes an ArrayBuffer to base64', () => {
    const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer; // "Hello"
    const result = arrayBufferToBase64(buffer);
    expect(result).toBe(btoa('Hello'));
  });

  it('returns empty string for empty buffer', () => {
    const buffer = new ArrayBuffer(0);
    const result = arrayBufferToBase64(buffer);
    expect(result).toBe('');
  });

  it('round-trips with atob', () => {
    const original = new Uint8Array([0, 127, 255, 1, 128]);
    const base64 = arrayBufferToBase64(original.buffer);
    const decoded = atob(base64);
    for (let i = 0; i < original.length; i++) {
      expect(decoded.charCodeAt(i)).toBe(original[i]);
    }
  });
});
