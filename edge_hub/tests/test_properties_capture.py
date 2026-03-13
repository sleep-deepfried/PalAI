"""Property-based tests for the /capture endpoint.

Tests high-resolution capture, backend forwarding, success responses,
error propagation, and concurrent capture rejection using Hypothesis.
Uses a FakeCamera to avoid requiring real picamera2 hardware.

Covers:
- Task 3.2: Property 4 — Capture produces high-resolution image
- Task 3.3: Property 5 — Capture forwards image as multipart/form-data
- Task 3.4: Property 6 — Capture success response contains scan ID
- Task 3.5: Property 7 — Backend error propagation
- Task 3.6: Property 9 — Concurrent capture rejection
"""

import io
import os
import uuid
from unittest.mock import patch, MagicMock

import pytest
from hypothesis import given, settings, HealthCheck
from hypothesis import strategies as st
from PIL import Image

# Ensure PALAI_API_URL is set so config.py doesn't sys.exit()
os.environ.setdefault("PALAI_API_URL", "http://test-backend.example.com")

from edge_hub.app import CameraManager, CaptureInProgressError, create_app


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

def _make_app_and_client(capture_size=(1920, 1080)):
    """Create a fresh Flask app + test client with a FakeCamera."""
    fake = FakeCamera(capture_size=capture_size)
    mgr = CameraManager(camera=fake, capture_size=capture_size)
    app = create_app(camera_manager=mgr)
    return app, app.test_client(), mgr


def _make_mock_backend_response(status_code=200, json_data=None, headers=None, text=""):
    """Create a mock response object mimicking requests.Response."""
    mock_resp = MagicMock()
    mock_resp.status_code = status_code
    mock_resp.headers = headers or {}
    mock_resp.text = text
    if json_data is not None:
        mock_resp.json.return_value = json_data
    else:
        mock_resp.json.side_effect = ValueError("No JSON")
    return mock_resp


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

# Capture sizes at or above the minimum high-res threshold
_capture_size_strategy = st.tuples(
    st.integers(min_value=1920, max_value=3840),
    st.integers(min_value=1080, max_value=2160),
)

# Random scan IDs as UUID strings
_scan_id_strategy = st.uuids().map(str)

# HTTP error status codes from the backend (400-599)
_error_status_strategy = st.integers(min_value=400, max_value=599)


# ---------------------------------------------------------------------------
# Task 3.2 — Property 4: Capture produces high-resolution image
# Feature: remote-camera-hub, Property 4: Capture produces high-resolution image
# **Validates: Requirements 2.1**
# ---------------------------------------------------------------------------

@settings(
    max_examples=100,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
    deadline=None,
)
@given(capture_size=_capture_size_strategy)
def test_capture_produces_high_resolution_image(capture_size):
    """Property 4: For any successful POST to /capture, the image captured
    from the camera shall have dimensions of at least 1920x1080 pixels.

    Feature: remote-camera-hub, Property 4: Capture produces high-resolution image
    **Validates: Requirements 2.1**
    """
    fake = FakeCamera(capture_size=capture_size)
    mgr = CameraManager(camera=fake, capture_size=capture_size)

    jpeg_bytes = mgr.capture_image()
    img = Image.open(io.BytesIO(jpeg_bytes))

    assert img.width >= 1920, f"Capture width {img.width} is below 1920"
    assert img.height >= 1080, f"Capture height {img.height} is below 1080"


# ---------------------------------------------------------------------------
# Task 3.3 — Property 5: Capture forwards image as multipart/form-data
# Feature: remote-camera-hub, Property 5: Capture forwards image as multipart/form-data
# **Validates: Requirements 2.2**
# ---------------------------------------------------------------------------

@settings(
    max_examples=100,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
    deadline=None,
)
@given(scan_id=_scan_id_strategy)
def test_capture_forwards_image_as_multipart(scan_id):
    """Property 5: For any successful capture, the edge server shall send a
    POST request to PALAI_API_URL with a multipart/form-data body containing
    a field named 'image' with JPEG content.

    Feature: remote-camera-hub, Property 5: Capture forwards image as multipart/form-data
    **Validates: Requirements 2.2**
    """
    app, client, mgr = _make_app_and_client()

    mock_resp = _make_mock_backend_response(
        status_code=200,
        json_data={"scanId": scan_id},
    )

    with patch("edge_hub.app.http_requests.post", return_value=mock_resp) as mock_post:
        response = client.post("/capture")

        # Verify the outbound POST was called
        assert mock_post.called, "requests.post should have been called"

        call_kwargs = mock_post.call_args
        # The 'files' kwarg should contain an 'image' field
        files_arg = call_kwargs.kwargs.get("files") or call_kwargs[1].get("files")
        assert files_arg is not None, "POST should include 'files' parameter"
        assert "image" in files_arg, "files should contain an 'image' field"

        # Verify the image field contains JPEG data
        image_tuple = files_arg["image"]
        # image_tuple is (filename, bytes, content_type)
        assert image_tuple[0] == "capture.jpg", f"Filename should be capture.jpg, got {image_tuple[0]}"
        assert image_tuple[2] == "image/jpeg", f"Content type should be image/jpeg, got {image_tuple[2]}"

        # Verify the bytes are valid JPEG
        img = Image.open(io.BytesIO(image_tuple[1]))
        assert img.format == "JPEG"


# ---------------------------------------------------------------------------
# Task 3.4 — Property 6: Capture success response contains scan ID
# Feature: remote-camera-hub, Property 6: Capture success response contains scan ID
# **Validates: Requirements 2.3**
# ---------------------------------------------------------------------------

@settings(
    max_examples=100,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
    deadline=None,
)
@given(scan_id=_scan_id_strategy)
def test_capture_success_response_contains_scan_id(scan_id):
    """Property 6: For any capture where the backend returns a successful
    response with a scan ID, the /capture endpoint shall respond with
    HTTP 200 and a JSON body containing that same scanId value.

    Feature: remote-camera-hub, Property 6: Capture success response contains scan ID
    **Validates: Requirements 2.3**
    """
    app, client, mgr = _make_app_and_client()

    mock_resp = _make_mock_backend_response(
        status_code=200,
        json_data={"scanId": scan_id},
    )

    with patch("edge_hub.app.http_requests.post", return_value=mock_resp):
        response = client.post("/capture")

        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.get_json()
        assert data is not None, "Response should be JSON"
        assert data.get("scanId") == scan_id, (
            f"Expected scanId '{scan_id}', got '{data.get('scanId')}'"
        )


# Also test the 302 redirect path with scan ID in Location header
@settings(
    max_examples=100,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
    deadline=None,
)
@given(scan_id=_scan_id_strategy)
def test_capture_success_via_redirect_contains_scan_id(scan_id):
    """Property 6 (redirect path): When backend returns 302 with Location
    header containing the scan ID, /capture returns 200 with matching scanId.

    Feature: remote-camera-hub, Property 6: Capture success response contains scan ID
    **Validates: Requirements 2.3**
    """
    app, client, mgr = _make_app_and_client()

    mock_resp = _make_mock_backend_response(
        status_code=302,
        headers={"Location": f"/result/{scan_id}"},
    )

    with patch("edge_hub.app.http_requests.post", return_value=mock_resp):
        response = client.post("/capture")

        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.get_json()
        assert data is not None, "Response should be JSON"
        assert data.get("scanId") == scan_id, (
            f"Expected scanId '{scan_id}', got '{data.get('scanId')}'"
        )


# ---------------------------------------------------------------------------
# Task 3.5 — Property 7: Backend error propagation
# Feature: remote-camera-hub, Property 7: Backend error propagation
# **Validates: Requirements 2.4**
# ---------------------------------------------------------------------------

@settings(
    max_examples=100,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
    deadline=None,
)
@given(error_code=_error_status_strategy)
def test_backend_error_propagation(error_code):
    """Property 7: For any capture where the backend returns an error status
    code, the /capture endpoint shall respond with a non-2xx HTTP status
    and a JSON body containing an 'error' field.

    Feature: remote-camera-hub, Property 7: Backend error propagation
    **Validates: Requirements 2.4**
    """
    app, client, mgr = _make_app_and_client()

    mock_resp = _make_mock_backend_response(
        status_code=error_code,
        text=f"Backend error {error_code}",
    )

    with patch("edge_hub.app.http_requests.post", return_value=mock_resp):
        response = client.post("/capture")

        assert not (200 <= response.status_code < 300), (
            f"Expected non-2xx status, got {response.status_code} for backend error {error_code}"
        )
        data = response.get_json()
        assert data is not None, "Response should be JSON"
        assert "error" in data, (
            f"Response JSON should contain 'error' field, got {data}"
        )


# ---------------------------------------------------------------------------
# Task 3.6 — Property 9: Concurrent capture rejection
# Feature: remote-camera-hub, Property 9: Concurrent capture rejection
# **Validates: Requirements 3.3**
# ---------------------------------------------------------------------------

@settings(
    max_examples=100,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
    deadline=None,
)
@given(dummy=st.integers(min_value=0, max_value=10000))
def test_concurrent_capture_rejection(dummy):
    """Property 9: For any state where a capture is already in progress,
    a subsequent POST to /capture shall return HTTP 429 with a JSON body
    containing an 'error' field.

    Feature: remote-camera-hub, Property 9: Concurrent capture rejection
    **Validates: Requirements 3.3**
    """
    app, client, mgr = _make_app_and_client()

    # Acquire the capture lock to simulate an in-progress capture
    mgr._capture_lock.acquire()
    try:
        response = client.post("/capture")

        assert response.status_code == 429, (
            f"Expected 429, got {response.status_code}"
        )
        data = response.get_json()
        assert data is not None, "Response should be JSON"
        assert "error" in data, (
            f"Response JSON should contain 'error' field, got {data}"
        )
    finally:
        mgr._capture_lock.release()
