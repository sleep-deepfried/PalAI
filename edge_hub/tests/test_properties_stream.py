"""Property-based tests for the MJPEG stream endpoint.

Tests CameraManager streaming and the GET /stream endpoint using Hypothesis.
Uses a FakeCamera to avoid requiring real picamera2 hardware.

Covers:
- Task 2.4: Property 1 — Stream endpoint content type
- Task 2.5: Property 2 — Stream frame resolution bound
- Task 2.6: Property 3 — CORS headers on stream
- Task 2.7: Property 8 — Stream pause/resume round-trip during capture
"""

import io
import os
import threading
import time

import pytest
from hypothesis import given, settings, HealthCheck
from hypothesis import strategies as st
from PIL import Image

# Ensure PALAI_API_URL is set so config.py doesn't sys.exit()
os.environ.setdefault("PALAI_API_URL", "http://test-backend.example.com")

from edge_hub.app import CameraManager, create_app


# ---------------------------------------------------------------------------
# FakeCamera (same pattern as test_app.py)
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
        arr = np.empty((h, w, 3), dtype=np.uint8)
        arr[:, :] = [0, 128, 0]
        return arr


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_app_and_client(preview_size=(640, 480)):
    """Create a fresh Flask app + test client with a FakeCamera."""
    fake = FakeCamera(preview_size=preview_size)
    mgr = CameraManager(camera=fake, preview_size=preview_size)
    app = create_app(camera_manager=mgr)
    return app, app.test_client(), mgr


def _extract_jpeg_from_frame(frame_bytes: bytes) -> bytes:
    """Extract raw JPEG bytes from an MJPEG boundary-delimited frame."""
    jpeg_start = frame_bytes.find(b"\r\n\r\n") + 4
    jpeg_end = frame_bytes.rfind(b"\r\n")
    return frame_bytes[jpeg_start:jpeg_end]


# ---------------------------------------------------------------------------
# Task 2.4 — Property 1: Stream endpoint content type
# Feature: remote-camera-hub, Property 1: Stream endpoint content type
# **Validates: Requirements 1.1**
# ---------------------------------------------------------------------------

@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(dummy=st.integers(min_value=0, max_value=10000))
def test_stream_content_type_property(dummy):
    """Property 1: For any GET request to /stream, the Content-Type header
    shall be exactly 'multipart/x-mixed-replace; boundary=frame'.

    Feature: remote-camera-hub, Property 1: Stream endpoint content type
    **Validates: Requirements 1.1**
    """
    app, client, _ = _make_app_and_client()
    response = client.get("/stream")
    assert response.content_type == "multipart/x-mixed-replace; boundary=frame", (
        f"Expected multipart/x-mixed-replace; boundary=frame, got {response.content_type}"
    )


# ---------------------------------------------------------------------------
# Task 2.5 — Property 2: Stream frame resolution bound
# Feature: remote-camera-hub, Property 2: Stream frame resolution bound
# **Validates: Requirements 1.2**
# ---------------------------------------------------------------------------

# Strategy: generate preview sizes where width ≤ 640 and height ≤ 480
_preview_size_strategy = st.tuples(
    st.integers(min_value=16, max_value=640),
    st.integers(min_value=16, max_value=480),
)


@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(preview_size=_preview_size_strategy)
def test_stream_frame_resolution_bound_property(preview_size):
    """Property 2: For any frame yielded by the MJPEG stream generator,
    its decoded image dimensions shall be at most 640×480 pixels.

    Feature: remote-camera-hub, Property 2: Stream frame resolution bound
    **Validates: Requirements 1.2**
    """
    fake = FakeCamera(preview_size=preview_size)
    mgr = CameraManager(camera=fake, preview_size=preview_size)

    gen = mgr.generate_frames()
    frame = next(gen)
    gen.close()

    jpeg_bytes = _extract_jpeg_from_frame(frame)
    img = Image.open(io.BytesIO(jpeg_bytes))

    assert img.width <= 640, f"Frame width {img.width} exceeds 640"
    assert img.height <= 480, f"Frame height {img.height} exceeds 480"


# Also test with sizes that exceed the preview bounds to verify thumbnail clamping
_oversized_preview_strategy = st.tuples(
    st.integers(min_value=641, max_value=1280),
    st.integers(min_value=481, max_value=960),
)


@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(preview_size=_oversized_preview_strategy)
def test_stream_frame_resolution_clamped_for_oversized_input(preview_size):
    """Property 2 (supplemental): Even when the camera produces frames larger
    than 640×480, the stream generator clamps them to the preview bounds.

    Feature: remote-camera-hub, Property 2: Stream frame resolution bound
    **Validates: Requirements 1.2**
    """
    fake = FakeCamera(preview_size=preview_size)
    mgr = CameraManager(camera=fake, preview_size=(640, 480))

    gen = mgr.generate_frames()
    frame = next(gen)
    gen.close()

    jpeg_bytes = _extract_jpeg_from_frame(frame)
    img = Image.open(io.BytesIO(jpeg_bytes))

    assert img.width <= 640, f"Frame width {img.width} exceeds 640"
    assert img.height <= 480, f"Frame height {img.height} exceeds 480"


# ---------------------------------------------------------------------------
# Task 2.6 — Property 3: CORS headers on stream
# Feature: remote-camera-hub, Property 3: CORS headers on stream
# **Validates: Requirements 1.4**
# ---------------------------------------------------------------------------

@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(dummy=st.integers(min_value=0, max_value=10000))
def test_stream_cors_header_property(dummy):
    """Property 3: For any GET request to /stream, the response shall include
    an Access-Control-Allow-Origin header.

    Feature: remote-camera-hub, Property 3: CORS headers on stream
    **Validates: Requirements 1.4**
    """
    app, client, _ = _make_app_and_client()
    response = client.get("/stream")
    assert "Access-Control-Allow-Origin" in response.headers, (
        "Response missing Access-Control-Allow-Origin header"
    )


# ---------------------------------------------------------------------------
# Task 2.7 — Property 8: Stream pause/resume round-trip during capture
# Feature: remote-camera-hub, Property 8: Stream pause/resume round-trip during capture
# **Validates: Requirements 3.1, 3.2**
# ---------------------------------------------------------------------------

@settings(
    max_examples=100,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
    deadline=None,
)
@given(dummy=st.integers(min_value=0, max_value=10000))
def test_stream_pause_resume_during_capture_property(dummy):
    """Property 8: For any capture operation, the MJPEG stream shall yield
    no frames while the capture lock is held, and shall resume yielding
    frames after the lock is released.

    Feature: remote-camera-hub, Property 8: Stream pause/resume round-trip during capture
    **Validates: Requirements 3.1, 3.2**
    """
    fake = FakeCamera()
    mgr = CameraManager(camera=fake)

    # Phase 1: Simulate capture lock held — stream should yield no frames
    mgr._is_capturing = True

    paused_frames = []
    stop_event = threading.Event()

    def collect_paused():
        gen = mgr.generate_frames()
        for frame in gen:
            paused_frames.append(frame)
            if stop_event.is_set():
                break

    t = threading.Thread(target=collect_paused, daemon=True)
    t.start()
    time.sleep(0.15)

    assert len(paused_frames) == 0, (
        f"Stream should yield no frames while capturing, got {len(paused_frames)}"
    )

    # Phase 2: Release capture — stream should resume
    mgr._is_capturing = False
    time.sleep(0.15)
    stop_event.set()
    t.join(timeout=2)

    assert len(paused_frames) > 0, (
        "Stream should resume yielding frames after capture ends"
    )
