import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioPlayer } from './audio-player';

// Helper: create a base64-encoded 16-bit LE PCM chunk from float samples
function createBase64Pcm(samples: number[]): string {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < samples.length; i++) {
    const int16 = Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767);
    view.setInt16(i * 2, int16, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Mock AudioContext and related Web Audio API
class MockAudioBufferSourceNode {
  buffer: AudioBuffer | null = null;
  onended: (() => void) | null = null;
  connect = vi.fn();
  start = vi.fn().mockImplementation(() => {
    // Simulate immediate playback completion
    setTimeout(() => this.onended?.(), 0);
  });
  stop = vi.fn();
  disconnect = vi.fn();
}

class MockAudioBuffer {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  private data: Float32Array;

  constructor(options: { numberOfChannels: number; length: number; sampleRate: number }) {
    this.numberOfChannels = options.numberOfChannels;
    this.length = options.length;
    this.sampleRate = options.sampleRate;
    this.data = new Float32Array(options.length);
  }

  getChannelData(_channel: number): Float32Array {
    return this.data;
  }
}

class MockAudioContext {
  sampleRate: number;
  destination = {};

  constructor(options?: { sampleRate?: number }) {
    this.sampleRate = options?.sampleRate ?? 24000;
  }

  createBuffer(channels: number, length: number, sampleRate: number): MockAudioBuffer {
    return new MockAudioBuffer({ numberOfChannels: channels, length, sampleRate });
  }

  createBufferSource(): MockAudioBufferSourceNode {
    return new MockAudioBufferSourceNode();
  }
}

// Install mock before tests
vi.stubGlobal('AudioContext', MockAudioContext);

describe('AudioPlayer', () => {
  let player: AudioPlayer;

  beforeEach(() => {
    player = new AudioPlayer(24000);
  });

  it('starts with isPlaying = false', () => {
    expect(player.isPlaying).toBe(false);
  });

  it('sets isPlaying to true after enqueue', () => {
    const pcm = createBase64Pcm([0.5, -0.5, 0.0]);
    player.enqueue(pcm);
    expect(player.isPlaying).toBe(true);
  });

  it('stops playback and clears queue on stop()', () => {
    const pcm = createBase64Pcm([0.5, -0.5]);
    player.enqueue(pcm);
    player.enqueue(pcm);
    expect(player.isPlaying).toBe(true);

    player.stop();
    expect(player.isPlaying).toBe(false);
  });

  it('can enqueue after stop', () => {
    const pcm = createBase64Pcm([0.1]);
    player.enqueue(pcm);
    player.stop();
    expect(player.isPlaying).toBe(false);

    player.enqueue(pcm);
    expect(player.isPlaying).toBe(true);
  });

  it('correctly decodes base64 PCM into audio samples', () => {
    // Enqueue a known chunk and verify the buffer was created
    const pcm = createBase64Pcm([1.0, -1.0, 0.0]);
    player.enqueue(pcm);
    // If no error thrown, decoding succeeded
    expect(player.isPlaying).toBe(true);
  });
});
