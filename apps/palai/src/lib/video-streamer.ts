/**
 * Video streaming utility for capturing JPEG frames from a video element
 * and sending them to the Gemini Live API at a regular interval.
 *
 * Uses an offscreen canvas to capture frames, encodes as JPEG,
 * and passes base64 data to a callback (decoupled from the session object).
 */

/**
 * Start capturing JPEG frames from a video element at a regular interval.
 *
 * @param videoElement - The HTMLVideoElement showing the camera preview
 * @param sendFrame - Callback invoked with each captured frame's base64 data and MIME type
 * @param intervalMs - Capture interval in milliseconds (default 1000 = 1fps)
 * @returns A cleanup function that stops the capture interval
 */
export function startVideoCapture(
  videoElement: HTMLVideoElement,
  sendFrame: (data: { data: string; mimeType: string }) => void,
  intervalMs: number = 1000
): () => void {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const intervalId = setInterval(() => {
    // Skip if the video element isn't ready yet (no dimensions available)
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      return;
    }

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    ctx.drawImage(videoElement, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg');
    // Strip the "data:image/jpeg;base64," prefix to get raw base64
    const base64 = dataUrl.split(',')[1];

    sendFrame({ data: base64, mimeType: 'image/jpeg' });
  }, intervalMs);

  return () => {
    clearInterval(intervalId);
  };
}
