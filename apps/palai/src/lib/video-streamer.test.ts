import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startVideoCapture } from './video-streamer';

describe('startVideoCapture', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createMockVideoElement(videoWidth = 640, videoHeight = 480): HTMLVideoElement {
    return { videoWidth, videoHeight } as unknown as HTMLVideoElement;
  }

  function createMockCanvas() {
    const drawImage = vi.fn();
    const toDataURL = vi.fn().mockReturnValue('data:image/jpeg;base64,AAAA');
    const getContext = vi.fn().mockReturnValue({ drawImage });

    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext,
      toDataURL,
      width: 0,
      height: 0,
    } as unknown as HTMLCanvasElement);

    return { drawImage, toDataURL, getContext };
  }

  it('captures a frame at the default 1s interval', () => {
    const { drawImage, toDataURL } = createMockCanvas();
    const video = createMockVideoElement();
    const sendFrame = vi.fn();

    const cleanup = startVideoCapture(video, sendFrame);

    // No frame captured yet at t=0
    expect(sendFrame).not.toHaveBeenCalled();

    // Advance 1 second
    vi.advanceTimersByTime(1000);

    expect(drawImage).toHaveBeenCalledWith(video, 0, 0);
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg');
    expect(sendFrame).toHaveBeenCalledWith({
      data: 'AAAA',
      mimeType: 'image/jpeg',
    });

    cleanup();
  });

  it('captures frames at a custom interval', () => {
    createMockCanvas();
    const video = createMockVideoElement();
    const sendFrame = vi.fn();

    const cleanup = startVideoCapture(video, sendFrame, 500);

    vi.advanceTimersByTime(500);
    expect(sendFrame).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);
    expect(sendFrame).toHaveBeenCalledTimes(2);

    cleanup();
  });

  it('skips capture when video element is not ready (videoWidth === 0)', () => {
    createMockCanvas();
    const video = createMockVideoElement(0, 0);
    const sendFrame = vi.fn();

    const cleanup = startVideoCapture(video, sendFrame);

    vi.advanceTimersByTime(1000);
    expect(sendFrame).not.toHaveBeenCalled();

    cleanup();
  });

  it('skips capture when videoHeight is 0', () => {
    createMockCanvas();
    const video = createMockVideoElement(640, 0);
    const sendFrame = vi.fn();

    const cleanup = startVideoCapture(video, sendFrame);

    vi.advanceTimersByTime(1000);
    expect(sendFrame).not.toHaveBeenCalled();

    cleanup();
  });

  it('strips the data URL prefix from the base64 output', () => {
    const mockCanvas = createMockCanvas();
    mockCanvas.toDataURL.mockReturnValue('data:image/jpeg;base64,SGVsbG9Xb3JsZA==');
    const video = createMockVideoElement();
    const sendFrame = vi.fn();

    const cleanup = startVideoCapture(video, sendFrame);
    vi.advanceTimersByTime(1000);

    expect(sendFrame).toHaveBeenCalledWith({
      data: 'SGVsbG9Xb3JsZA==',
      mimeType: 'image/jpeg',
    });

    cleanup();
  });

  it('stops capturing when cleanup function is called', () => {
    createMockCanvas();
    const video = createMockVideoElement();
    const sendFrame = vi.fn();

    const cleanup = startVideoCapture(video, sendFrame);

    vi.advanceTimersByTime(1000);
    expect(sendFrame).toHaveBeenCalledTimes(1);

    cleanup();

    vi.advanceTimersByTime(3000);
    expect(sendFrame).toHaveBeenCalledTimes(1);
  });

  it('captures multiple frames over time', () => {
    createMockCanvas();
    const video = createMockVideoElement();
    const sendFrame = vi.fn();

    const cleanup = startVideoCapture(video, sendFrame);

    vi.advanceTimersByTime(3000);
    expect(sendFrame).toHaveBeenCalledTimes(3);

    cleanup();
  });
});
