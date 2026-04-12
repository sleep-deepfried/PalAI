/**
 * AudioWorklet processor that captures raw PCM audio from the microphone
 * and posts Float32Array chunks to the main thread for resampling to 16kHz PCM.
 */
class PcmProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input[0] && input[0].length > 0) {
      // Copy first channel data so the buffer isn't recycled
      const channelData = new Float32Array(input[0]);
      this.port.postMessage(channelData);
    }
    return true;
  }
}

registerProcessor('pcm-processor', PcmProcessor);
