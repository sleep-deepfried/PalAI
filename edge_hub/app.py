"""Edge Hub Flask application.

Manages the Raspberry Pi camera module, serves an MJPEG live preview stream,
and provides a health check endpoint. The /capture endpoint is added separately.
"""

import io
import threading
import time
from typing import Generator

import requests as http_requests
from flask import Flask, Response, jsonify, request
from flask_cors import CORS


class CaptureInProgressError(Exception):
    """Raised when a capture is attempted while another is already in progress."""
    pass


class CameraManager:
    """Manages picamera2 lifecycle and coordinates stream/capture.

    Accepts an optional ``camera`` argument for dependency injection (testing).
    When *camera* is ``None`` the real ``Picamera2`` driver is used.
    """

    def __init__(self, camera=None, preview_size=(640, 480), capture_size=(1920, 1080)):
        if camera is None:
            from picamera2 import Picamera2
            camera = Picamera2()

        self.camera = camera
        self.preview_size = preview_size
        self.capture_size = capture_size

        self.preview_config = self.camera.create_preview_configuration(
            main={"size": preview_size, "format": "RGB888"}
        )
        self.capture_config = self.camera.create_still_configuration(
            main={"size": capture_size, "format": "RGB888"}
        )

        self._capture_lock = threading.Lock()
        self._is_capturing = False

        # Start the camera in preview mode
        self.camera.configure(self.preview_config)
        self.camera.start()

    def generate_frames(self) -> Generator[bytes, None, None]:
        """Yield MJPEG frames for streaming. Pauses while a capture is in progress."""
        try:
            while True:
                if self._is_capturing:
                    time.sleep(0.05)
                    continue

                frame = self.camera.capture_array()

                # Encode the raw RGB frame as JPEG
                from PIL import Image
                img = Image.fromarray(frame)

                # Ensure the frame does not exceed preview_size
                max_w, max_h = self.preview_size
                if img.width > max_w or img.height > max_h:
                    img.thumbnail((max_w, max_h))

                buf = io.BytesIO()
                img.save(buf, format="JPEG")
                jpeg_bytes = buf.getvalue()

                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + jpeg_bytes + b"\r\n"
                )
        except GeneratorExit:
            # Client disconnected — stop sending frames gracefully
            pass

    def capture_image(self) -> bytes:
        """Capture a high-resolution JPEG image.

        Acquires the capture lock (non-blocking), switches to still
        configuration, captures the image, switches back to preview
        configuration, and releases the lock.

        Returns:
            JPEG image bytes.

        Raises:
            CaptureInProgressError: If another capture is already in progress.
        """
        acquired = self._capture_lock.acquire(blocking=False)
        if not acquired:
            raise CaptureInProgressError("Capture already in progress. Please wait.")

        try:
            self._is_capturing = True

            # Switch to high-res still configuration
            self.camera.stop()
            self.camera.configure(self.capture_config)
            self.camera.start()

            frame = self.camera.capture_array()

            from PIL import Image
            img = Image.fromarray(frame)
            buf = io.BytesIO()
            img.save(buf, format="JPEG")

            return buf.getvalue()
        finally:
            # Always switch back to preview mode and release the lock
            self.camera.stop()
            self.camera.configure(self.preview_config)
            self.camera.start()
            self._is_capturing = False
            self._capture_lock.release()


def create_app(camera_manager: CameraManager | None = None) -> Flask:
    """Application factory.

    Parameters:
        camera_manager: Optional pre-configured ``CameraManager`` instance.
            When ``None``, a real camera manager is created (requires picamera2).
    """
    app = Flask(__name__)

    # Lazy-import config to avoid the sys.exit() side-effect during testing
    # when PALAI_API_URL is intentionally unset.
    from edge_hub import config

    CORS(app, origins=config.CORS_ORIGINS)

    if camera_manager is None:
        camera_manager = CameraManager()

    # Store on app for access in route handlers and tests
    app.camera_manager = camera_manager  # type: ignore[attr-defined]

    @app.route("/stream")
    def stream():
        """MJPEG live preview stream."""
        return Response(
            camera_manager.generate_frames(),
            mimetype="multipart/x-mixed-replace; boundary=frame",
        )

    @app.route("/health")
    def health():
        """Health check endpoint."""
        return jsonify({"status": "ok", "camera": "ready"}), 200

    @app.route("/capture", methods=["POST"])
    def capture():
        """Trigger high-res capture and forward to backend for diagnosis."""
        # 1. Capture image from camera
        try:
            jpeg_bytes = camera_manager.capture_image()
        except CaptureInProgressError:
            return jsonify({"error": "Capture already in progress. Please wait."}), 429
        except Exception:
            return jsonify({"error": "Camera module is unavailable."}), 503

        # 2. Forward image to backend as multipart/form-data
        try:
            backend_response = http_requests.post(
                config.PALAI_API_URL,
                files={"image": ("capture.jpg", jpeg_bytes, "image/jpeg")},
                allow_redirects=False,
            )
        except http_requests.ConnectionError:
            return jsonify({"error": "Could not reach diagnosis service."}), 502

        # 3. Handle backend response
        if backend_response.status_code == 302:
            # Redirect to /result/{id} — extract scan ID from Location header
            location = backend_response.headers.get("Location", "")
            scan_id = location.rstrip("/").split("/")[-1]
            return jsonify({"scanId": scan_id}), 200

        if 200 <= backend_response.status_code < 300:
            # JSON response with scanId
            try:
                data = backend_response.json()
                scan_id = data.get("scanId") or data.get("id", "")
                return jsonify({"scanId": scan_id}), 200
            except Exception:
                return jsonify({
                    "error": "Diagnosis service returned an error.",
                    "details": "Invalid JSON in backend response.",
                }), 502

        # Non-2xx response from backend
        try:
            details = backend_response.text
        except Exception:
            details = "Unknown error"
        return jsonify({
            "error": "Diagnosis service returned an error.",
            "details": details,
        }), 502

    return app
