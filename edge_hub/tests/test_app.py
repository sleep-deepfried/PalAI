"""Unit tests for edge_hub.app module.

Tests CameraManager (Task 2.1), GET /stream (Task 2.2), and GET /health (Task 2.3).
Uses a FakeCamera to avoid requiring real picamera2 hardware.
"""

import io
import os
import sys
import threading
import time

import pytest
from PIL import Image

# Ensure PALAI_API_URL is set so config.py doesn't sys.exit()
os.environ.setdefault("PALAI_API_URL", "http://test-backend.example.com")

from edge_hub.app import CameraManager, CaptureInProgressError, create_app


# ---------------------------------------------------------------------------
# Fake camera for testing (no real picamera2 needed)
# ---------------------------------------------------------------------------

class FakeCamera:
    """Mimics the subset of the Picamera2 API used by CameraManager."""

    def __init__(self, preview_size=(640, 480), capture_size=(1920, 1080)):
        self._preview_size = preview_size
        self._capture_size = capture_size
        self._current_size = preview_size
        self._started = False

    def create_preview_configuration(self, main=None):
        size = main["size"] if main else self._preview_size
        return {"type": "preview", "size": size}

    def create_still_configuration(self, main=None):
        size = main["size"] if main else self._capture_size
        return {"type": "still", "size": size}

    def configure(self, config):
        self._current_size = config["size"]

    def start(self):
        self._started = True

    def stop(self):
        self._started = False

    def capture_array(self):
        """Return a solid-green numpy array at the current configured size."""
        import numpy as np
        w, h = self._current_size
        # RGB888 frame: shape (height, width, 3)
        arr = np.empty((h, w, 3), dtype=np.uint8)
        arr[:, :] = [0, 128, 0]
        return arr


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def fake_camera():
    return FakeCamera()


@pytest.fixture()
def camera_manager(fake_camera):
    return CameraManager(camera=fake_camera)


@pytest.fixture()
def app(camera_manager):
    return create_app(camera_manager=camera_manager)


@pytest.fixture()
def client(app):
    return app.test_client()


# ---------------------------------------------------------------------------
# Task 2.1 — CameraManager tests
# ---------------------------------------------------------------------------

class TestCameraManager:
    """Tests for CameraManager.__init__, generate_frames(), capture_image()."""

    def test_init_starts_camera_in_preview_mode(self, fake_camera):
        """CameraManager starts the camera in preview configuration."""
        mgr = CameraManager(camera=fake_camera)
        assert fake_camera._started is True
        assert fake_camera._current_size == (640, 480)

    def test_generate_frames_yields_jpeg_bytes(self, camera_manager):
        """generate_frames() yields valid MJPEG boundary-delimited JPEG data."""
        gen = camera_manager.generate_frames()
        frame = next(gen)
        assert frame.startswith(b"--frame\r\n")
        assert b"Content-Type: image/jpeg" in frame

    def test_generate_frames_resolution_within_bounds(self, camera_manager):
        """Each frame decoded from the stream is at most 640x480."""
        gen = camera_manager.generate_frames()
        frame = next(gen)

        # Extract JPEG bytes after the header
        jpeg_start = frame.find(b"\r\n\r\n") + 4
        jpeg_end = frame.rfind(b"\r\n")
        jpeg_bytes = frame[jpeg_start:jpeg_end]

        img = Image.open(io.BytesIO(jpeg_bytes))
        assert img.width <= 640
        assert img.height <= 480

    def test_generate_frames_pauses_during_capture(self, camera_manager):
        """generate_frames() yields nothing while _is_capturing is True."""
        camera_manager._is_capturing = True

        frames_received = []
        stop_event = threading.Event()

        def collect_frames():
            gen = camera_manager.generate_frames()
            for frame in gen:
                frames_received.append(frame)
                if stop_event.is_set():
                    break

        t = threading.Thread(target=collect_frames, daemon=True)
        t.start()

        # Give the generator time to spin — it should yield nothing
        time.sleep(0.2)
        assert len(frames_received) == 0, "Should not yield frames while capturing"

        # Resume and verify frames start flowing
        camera_manager._is_capturing = False
        time.sleep(0.2)
        stop_event.set()
        t.join(timeout=2)
        assert len(frames_received) > 0, "Should yield frames after capture ends"

    def test_capture_image_returns_jpeg(self, camera_manager):
        """capture_image() returns valid JPEG bytes."""
        jpeg_bytes = camera_manager.capture_image()
        img = Image.open(io.BytesIO(jpeg_bytes))
        assert img.format == "JPEG"

    def test_capture_image_high_resolution(self, camera_manager):
        """capture_image() produces an image at the configured capture size."""
        jpeg_bytes = camera_manager.capture_image()
        img = Image.open(io.BytesIO(jpeg_bytes))
        assert img.width >= 1920
        assert img.height >= 1080

    def test_capture_image_restores_preview_mode(self, camera_manager, fake_camera):
        """After capture, camera is back in preview configuration."""
        camera_manager.capture_image()
        assert fake_camera._current_size == (640, 480)
        assert fake_camera._started is True

    def test_capture_image_raises_when_lock_held(self, camera_manager):
        """capture_image() raises CaptureInProgressError if lock is already held."""
        camera_manager._capture_lock.acquire()
        try:
            with pytest.raises(CaptureInProgressError):
                camera_manager.capture_image()
        finally:
            camera_manager._capture_lock.release()

    def test_capture_image_non_blocking_lock(self, camera_manager):
        """Concurrent capture attempts are rejected, not blocked."""
        barrier = threading.Barrier(2, timeout=5)
        results = {"first": None, "second": None}

        def slow_capture():
            """Simulate a slow capture by holding the lock."""
            camera_manager._capture_lock.acquire()
            try:
                camera_manager._is_capturing = True
                barrier.wait()  # Signal that lock is held
                import time
                time.sleep(0.3)
            finally:
                camera_manager._is_capturing = False
                camera_manager._capture_lock.release()

        t = threading.Thread(target=slow_capture)
        t.start()
        barrier.wait()  # Wait until lock is held

        with pytest.raises(CaptureInProgressError):
            camera_manager.capture_image()

        t.join()


# ---------------------------------------------------------------------------
# Task 2.2 — GET /stream endpoint tests
# ---------------------------------------------------------------------------

class TestStreamEndpoint:
    """Tests for the GET /stream endpoint."""

    def test_stream_content_type(self, client):
        """GET /stream returns multipart/x-mixed-replace content type."""
        response = client.get("/stream")
        assert response.content_type == "multipart/x-mixed-replace; boundary=frame"

    def test_stream_returns_200(self, client):
        """GET /stream returns HTTP 200."""
        response = client.get("/stream")
        assert response.status_code == 200

    def test_stream_cors_header_present(self, client):
        """GET /stream includes Access-Control-Allow-Origin header."""
        response = client.get("/stream")
        assert "Access-Control-Allow-Origin" in response.headers

    def test_stream_data_contains_jpeg(self, client):
        """GET /stream response data contains JPEG frame boundaries."""
        response = client.get("/stream")
        # Read a chunk of the streaming response
        data = b""
        for chunk in response.response:
            data += chunk
            if len(data) > 100:
                break
        assert b"--frame" in data
        assert b"Content-Type: image/jpeg" in data


# ---------------------------------------------------------------------------
# Task 2.3 — GET /health endpoint tests
# ---------------------------------------------------------------------------

class TestHealthEndpoint:
    """Tests for the GET /health endpoint."""

    def test_health_returns_200(self, client):
        """GET /health returns HTTP 200."""
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_returns_expected_json(self, client):
        """GET /health returns { status: ok, camera: ready }."""
        response = client.get("/health")
        data = response.get_json()
        assert data == {"status": "ok", "camera": "ready"}

    def test_health_content_type_is_json(self, client):
        """GET /health returns application/json content type."""
        response = client.get("/health")
        assert "application/json" in response.content_type


# ---------------------------------------------------------------------------
# Task 3.7 — Capture edge case unit tests
# ---------------------------------------------------------------------------

class TestCaptureEdgeCases:
    """Unit tests for capture edge cases.

    - Camera unavailable returns 503 with descriptive message (Req 2.5)
    - Client disconnect stops frame generation (Req 1.3)
    """

    def test_camera_unavailable_returns_503(self, client, camera_manager):
        """POST /capture returns 503 with descriptive message when camera fails.

        Requirements: 2.5
        """
        # Make capture_image raise a generic exception to simulate camera failure
        def broken_capture():
            raise RuntimeError("Camera hardware not detected")

        camera_manager.capture_image = broken_capture

        response = client.post("/capture")
        assert response.status_code == 503
        data = response.get_json()
        assert data is not None
        assert "error" in data
        assert "unavailable" in data["error"].lower() or "camera" in data["error"].lower(), (
            f"Error message should mention camera unavailability, got: {data['error']}"
        )

    def test_client_disconnect_stops_frame_generation(self, camera_manager):
        """Closing the generator (client disconnect) stops frame generation gracefully.

        Requirements: 1.3
        """
        gen = camera_manager.generate_frames()

        # Get one frame to confirm the generator is working
        frame = next(gen)
        assert frame is not None
        assert b"--frame" in frame

        # Simulate client disconnect by closing the generator
        gen.close()

        # The generator should be exhausted — calling next raises StopIteration
        with pytest.raises(StopIteration):
            next(gen)
