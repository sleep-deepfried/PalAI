# Implementation Plan: Remote Camera Hub

## Overview

Implement the PalAI Hub feature in two tracks: (1) a Python Flask edge server on the Raspberry Pi that manages the camera, serves an MJPEG stream, and forwards high-res captures to the backend, and (2) new Next.js frontend components that let users toggle between mobile camera and the remote Hub, view the live stream, and trigger remote captures. Tasks are ordered so the edge server is built first (it's the dependency), then frontend components, then integration and wiring into the scan page.

## Tasks

- [x] 1. Create edge server project structure and configuration
  - [x] 1.1 Create `edge_hub/` directory with `config.py` module
    - Create `edge_hub/config.py` that reads `PALAI_API_URL` (required), `EDGE_HOST` (default `0.0.0.0`), `EDGE_PORT` (default `5000`), and `CORS_ORIGINS` (default `*`) from environment variables
    - Exit with descriptive stderr message if `PALAI_API_URL` is not set
    - _Requirements: 4.1, 4.3, 4.4_
  - [x] 1.2 Create `edge_hub/requirements.txt`
    - List all Python dependencies: `flask`, `flask-cors`, `picamera2`, `requests`
    - _Requirements: 4.2_
  - [x] 1.3 Write unit tests for config module
    - Test startup fails with descriptive error when `PALAI_API_URL` is missing
    - Test default host/port values are `0.0.0.0` and `5000`
    - _Requirements: 4.1, 4.3, 4.4_

- [x] 2. Implement CameraManager class and MJPEG stream endpoint
  - [x] 2.1 Implement `CameraManager` class in `edge_hub/app.py`
    - Create `CameraManager` with `__init__`, `generate_frames()`, and `capture_image()` methods
    - Use `threading.Lock` for capture coordination; `generate_frames()` pauses when `_is_capturing` is True
    - `capture_image()` uses non-blocking lock acquire; raises `CaptureInProgressError` if lock is held
    - _Requirements: 1.2, 2.1, 3.1, 3.2, 3.3_
  - [x] 2.2 Implement `GET /stream` endpoint
    - Return `multipart/x-mixed-replace; boundary=frame` content type
    - Stream frames from `CameraManager.generate_frames()` at ≤640×480 resolution
    - Configure CORS via `flask-cors`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 2.3 Implement `GET /health` endpoint
    - Return JSON `{ "status": "ok", "camera": "ready" }` with 200 status
    - _Requirements: 4.4_
  - [x] 2.4 Write property tests for stream endpoint (Python / Hypothesis)
    - **Property 1: Stream endpoint content type** — Assert `Content-Type` is `multipart/x-mixed-replace; boundary=frame`
    - **Validates: Requirements 1.1**
  - [x] 2.5 Write property tests for stream frame resolution (Python / Hypothesis)
    - **Property 2: Stream frame resolution bound** — Decode frames, assert width ≤ 640 and height ≤ 480
    - **Validates: Requirements 1.2**
  - [x] 2.6 Write property test for CORS headers on stream (Python / Hypothesis)
    - **Property 3: CORS headers on stream** — Assert `Access-Control-Allow-Origin` header present on `/stream` response
    - **Validates: Requirements 1.4**
  - [x] 2.7 Write property test for stream pause/resume during capture (Python / Hypothesis)
    - **Property 8: Stream pause/resume round-trip during capture** — Assert stream yields no frames while capture lock is held, resumes after release
    - **Validates: Requirements 3.1, 3.2**

- [x] 3. Implement high-resolution capture endpoint
  - [x] 3.1 Implement `POST /capture` endpoint in `edge_hub/app.py`
    - Call `CameraManager.capture_image()` to get high-res JPEG (≥1920×1080)
    - Forward image as `multipart/form-data` (field `image`) to `PALAI_API_URL` via `requests`
    - Return `{ "scanId": "..." }` with 200 on success
    - Return 429 with error JSON if capture already in progress
    - Return 503 with error JSON if camera unavailable
    - Return 502 with error JSON if backend returns error
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.3_
  - [x] 3.2 Write property test for capture resolution (Python / Hypothesis)
    - **Property 4: Capture produces high-resolution image** — Mock camera, decode JPEG, assert width ≥ 1920 and height ≥ 1080
    - **Validates: Requirements 2.1**
  - [x] 3.3 Write property test for capture forwarding (Python / Hypothesis)
    - **Property 5: Capture forwards image as multipart/form-data** — Intercept outbound POST, assert `multipart/form-data` with `image` field
    - **Validates: Requirements 2.2**
  - [x] 3.4 Write property test for capture success response (Python / Hypothesis)
    - **Property 6: Capture success response contains scan ID** — Generate random scan IDs, mock backend success, assert 200 with matching `scanId`
    - **Validates: Requirements 2.3**
  - [x] 3.5 Write property test for backend error propagation (Python / Hypothesis)
    - **Property 7: Backend error propagation** — Generate random error codes, assert non-2xx with `error` field
    - **Validates: Requirements 2.4**
  - [x] 3.6 Write property test for concurrent capture rejection (Python / Hypothesis)
    - **Property 9: Concurrent capture rejection** — Hold capture lock, send second `/capture`, assert 429 with `error` field
    - **Validates: Requirements 3.3**
  - [x] 3.7 Write unit tests for capture edge cases
    - Test camera unavailable returns 503 with descriptive message
    - Test client disconnect stops frame generation
    - _Requirements: 2.5, 1.3_

- [x] 4. Checkpoint — Edge server complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement SourceToggle component
  - [x] 5.1 Create `apps/palai/src/components/scan/SourceToggle.tsx`
    - Implement segmented control with "Mobile Camera" and "PalAI Hub" options
    - Use `Smartphone` and `Radio` icons from Lucide React
    - Style with Tailwind CSS pill-style toggle consistent with existing design system
    - Accept `source` and `onSourceChange` props
    - Only render when `NEXT_PUBLIC_PI_TUNNEL_URL` is set and non-empty
    - _Requirements: 5.1, 5.2, 5.5, 8.2, 8.3_
  - [x] 5.2 Write property test for toggle visibility (TypeScript / fast-check)
    - **Property 14: Toggle visibility depends on environment variable** — Generate random env var values, assert toggle rendered iff non-empty string
    - **Validates: Requirements 8.2, 8.3**

- [x] 6. Implement HubStream component
  - [x] 6.1 Create `apps/palai/src/components/scan/HubStream.tsx`
    - Render `<img src="{tunnelUrl}/stream">` element
    - Fill camera viewfinder area with `object-cover`, maintain aspect ratio
    - Handle `onerror` on `<img>` to detect connection loss, call `onError` prop
    - Show reconnection message with retry button on error
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 6.2 Write unit tests for HubStream
    - Test img renders with correct src attribute
    - Test error message shown on img load failure
    - _Requirements: 6.1, 6.3_

- [x] 7. Implement useHubCapture hook and HubCaptureButton component
  - [x] 7.1 Create `apps/palai/src/hooks/useHubCapture.ts`
    - Manage `isCapturing` state, `error` state, and `AbortController` for cleanup
    - Implement `triggerCapture()` that sends POST to `{tunnelUrl}/capture` with 30s timeout
    - Return `scanId` on success, set error on failure
    - Implement `clearError()` to reset error state
    - _Requirements: 7.2, 7.5, 7.6_
  - [x] 7.2 Create `apps/palai/src/components/scan/HubCaptureButton.tsx`
    - Render "Capture from Hub" button
    - Call `onCaptureStart` immediately on click to trigger loading overlay
    - Handle 200 success → call `onCaptureSuccess(scanId)`
    - Handle 429 → show "Capture already in progress" message
    - Handle other errors/timeout → call `onCaptureError`
    - Disable button when `disabled` prop is true
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6_
  - [x] 7.3 Write property test for capture URL (TypeScript / fast-check)
    - **Property 11: Hub capture sends POST to correct URL** — Generate random tunnel URLs, assert fetch called with POST to `{url}/capture`
    - **Validates: Requirements 7.2**
  - [x] 7.4 Write property test for capture button disabled state (TypeScript / fast-check)
    - **Property 13: Capture button disabled during capture** — Set `isCapturing` true, assert button `disabled` attribute is true
    - **Validates: Requirements 7.6**

- [x] 8. Checkpoint — Frontend components complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Integrate components into scan page
  - [x] 9.1 Update `apps/palai/src/app/scan/page.tsx` to add source toggle and hub mode
    - Add `source` state (`"mobile" | "hub"`) defaulting to `"mobile"`
    - Render `SourceToggle` only when `NEXT_PUBLIC_PI_TUNNEL_URL` is truthy
    - When `source === "hub"`: render `HubStream` + `HubCaptureButton`, hide `CameraCapture` and `ImageUpload`
    - When `source === "mobile"`: render existing `CameraCapture` and `ImageUpload`
    - Wire `useHubCapture` hook for capture state management
    - Show `LoadingOverlay` with appropriate step labels during hub capture
    - On successful capture, call `router.push(\`/result/${scanId}\`)`
    - _Requirements: 5.2, 5.3, 5.4, 5.6, 7.1, 7.3, 7.4, 8.1_
  - [x] 9.2 Write property test for source toggle component rendering (TypeScript / fast-check)
    - **Property 10: Source toggle controls component rendering** — Generate random source states, assert correct component presence/absence
    - **Validates: Requirements 5.3, 5.4, 5.6, 7.1**
  - [x] 9.3 Write property test for capture redirect (TypeScript / fast-check)
    - **Property 12: Successful capture redirects to result page** — Generate random scan IDs, mock success, assert `router.push` called with `/result/{scanId}`
    - **Validates: Requirements 7.4**
  - [x] 9.4 Write unit tests for scan page hub integration
    - Test SourceToggle defaults to "Mobile Camera" on mount
    - Test LoadingOverlay shown during capture
    - Test capture error shows retry option
    - Test SourceToggle not rendered when env var is undefined
    - _Requirements: 5.2, 7.3, 7.5, 8.2_

- [x] 10. Add environment variable configuration
  - [x] 10.1 Update `.env.example` or `.env.local.example` with `NEXT_PUBLIC_PI_TUNNEL_URL`
    - Add commented entry documenting the variable's purpose
    - _Requirements: 8.1_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Edge server tests mock `picamera2` with a fake camera class generating solid-color JPEG frames — no real Pi required
- Frontend tests use `vitest` + `@testing-library/react` + `fast-check`; mock `fetch` and `next/navigation` router
- Each task references specific requirements for traceability
- Property tests reference their design property number for cross-referencing with the design document
