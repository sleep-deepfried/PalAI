/**
 * AudioPlayer decodes base64-encoded PCM audio chunks from Gemini (24kHz, 16-bit mono)
 * and plays them seamlessly using scheduled AudioContext timing to avoid gaps.
 */
export class AudioPlayer {
  private context: AudioContext;
  private sampleRate: number;
  private nextStartTime = 0;
  private sources: AudioBufferSourceNode[] = [];
  private _isPlaying = false;

  constructor(sampleRate = 24000) {
    this.sampleRate = sampleRate;
    this.context = new AudioContext({ sampleRate });
  }

  /**
   * Decode a base64-encoded 16-bit little-endian PCM chunk and schedule it for
   * gapless playback immediately after the previously scheduled chunk.
   */
  enqueue(base64Pcm: string): void {
    const binary = atob(base64Pcm);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const view = new DataView(bytes.buffer);
    const numSamples = Math.floor(bytes.length / 2);
    if (numSamples === 0) return;

    const audioBuffer = this.context.createBuffer(1, numSamples, this.sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const int16 = view.getInt16(i * 2, true); // little-endian
      channelData[i] = int16 / 32768;
    }

    // Resume context if suspended (e.g. autoplay policy)
    if (this.context.state === 'suspended') {
      this.context.resume().catch(() => {});
    }

    const source = this.context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.context.destination);

    // Schedule gaplessly: if nextStartTime is in the past, start now
    const now = this.context.currentTime;
    const startAt = this.nextStartTime > now ? this.nextStartTime : now;
    this.nextStartTime = startAt + audioBuffer.duration;

    source.onended = () => {
      const idx = this.sources.indexOf(source);
      if (idx !== -1) this.sources.splice(idx, 1);
      if (this.sources.length === 0) {
        this._isPlaying = false;
      }
    };

    this.sources.push(source);
    this._isPlaying = true;
    source.start(startAt);
  }

  /**
   * Stop current playback and clear all scheduled chunks.
   */
  stop(): void {
    for (const source of this.sources) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // may already have stopped
      }
      source.disconnect();
    }
    this.sources = [];
    this.nextStartTime = 0;
    this._isPlaying = false;
  }

  /**
   * Whether audio is currently being played.
   */
  get isPlaying(): boolean {
    return this._isPlaying;
  }
}
