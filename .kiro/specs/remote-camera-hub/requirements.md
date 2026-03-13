# Requirements Document

## Introduction

This feature extends PalAI from a purely cloud-based rice leaf disease classification app to a hardware-in-the-loop agritech system. A Raspberry Pi 4 edge device equipped with a camera module serves as a "PalAI Hub" that streams live video and captures high-resolution photos on demand. The Next.js web app gains a new input mode on the `/scan` page, allowing users to toggle between the existing mobile camera and the remote PalAI Hub. When the Hub is active, users view a live MJPEG preview and trigger remote captures that flow through the existing `uploadAndDiagnose` server action pipeline. This covers Story 1 (Remote Camera Selection) and Story 2 (Remote AI Trigger) of the hardware integration sprint.

## Glossary

- **Edge_Server**: A Python (Flask/FastAPI) HTTP server running on the Raspberry Pi 4 that manages the camera module, serves the MJPEG stream, and handles capture requests.
- **MJPEG_Stream**: A Motion JPEG continuous video stream served over HTTP as `multipart/x-mixed-replace` content, consumed by the browser via a standard `<img>` tag.
- **PalAI_Hub**: The user-facing name for the Raspberry Pi edge device mode within the scan page UI.
- **Scan_Page**: The `/scan` client page in the Next.js app where users capture or upload rice leaf images for diagnosis.
- **Source_Toggle**: A UI component on the Scan_Page that lets the user switch between "Mobile Camera" and "PalAI Hub" input modes.
- **Capture_Request**: An HTTP POST request sent from the Next.js frontend to the Edge_Server `/capture` endpoint to trigger a high-resolution photo capture.
- **Diagnose_Endpoint**: The existing Next.js server action `uploadAndDiagnose` that validates, processes, diagnoses, stores, and redirects scan results.
- **Tunnel_URL**: The publicly accessible URL (provided via Cloudflare Tunnel) through which the Edge_Server is reachable from the internet, configured as `NEXT_PUBLIC_PI_TUNNEL_URL`.
- **PALAI_API_URL**: An environment variable on the Raspberry Pi that points to the Next.js backend URL where captured images are posted for diagnosis.

## Requirements

### Requirement 1: MJPEG Stream Endpoint

**User Story:** As a farmer using the PalAI web app, I want to see a live video feed from the Raspberry Pi camera, so that I can position the rice leaf correctly before capturing.

#### Acceptance Criteria

1. THE Edge_Server SHALL serve a continuous MJPEG_Stream on the `GET /stream` endpoint with content type `multipart/x-mixed-replace; boundary=frame`.
2. THE Edge_Server SHALL stream frames from the Raspberry Pi camera module at a resolution suitable for preview (no greater than 640x480 pixels).
3. WHEN a client disconnects from the MJPEG_Stream, THE Edge_Server SHALL stop sending frames for that client and release the connection resources.
4. THE Edge_Server SHALL include CORS headers on the `/stream` endpoint to allow cross-origin requests from the Next.js frontend domain.

### Requirement 2: High-Resolution Capture Endpoint

**User Story:** As a farmer, I want to trigger a high-resolution photo capture from the Raspberry Pi remotely, so that the AI can diagnose the rice leaf disease accurately.

#### Acceptance Criteria

1. WHEN a POST request is received on the `/capture` endpoint, THE Edge_Server SHALL capture a high-resolution JPEG image from the camera module (minimum 1920x1080 pixels).
2. WHEN a capture is completed, THE Edge_Server SHALL send the captured image as `multipart/form-data` with field name `image` to the URL specified by the PALAI_API_URL environment variable.
3. WHEN the Diagnose_Endpoint returns a successful response, THE Edge_Server SHALL respond to the original `/capture` request with a JSON body containing the scan result ID and a 200 status code.
4. IF the Diagnose_Endpoint returns an error, THEN THE Edge_Server SHALL respond to the `/capture` request with a JSON error message and an appropriate HTTP error status code.
5. IF the camera module is unavailable or the capture fails, THEN THE Edge_Server SHALL respond with a 503 status code and a descriptive JSON error message.

### Requirement 3: Stream and Capture Coordination

**User Story:** As a farmer, I want the system to handle the transition between streaming and capturing seamlessly, so that I get a sharp, unblurred high-resolution image.

#### Acceptance Criteria

1. WHEN a capture is triggered, THE Edge_Server SHALL temporarily pause the MJPEG_Stream to allow the camera to switch to high-resolution capture mode.
2. WHEN the high-resolution capture is complete, THE Edge_Server SHALL resume the MJPEG_Stream automatically.
3. WHILE a capture is in progress, THE Edge_Server SHALL reject additional `/capture` requests with a 429 status code and a descriptive JSON message.

### Requirement 4: Edge Server Configuration and Dependencies

**User Story:** As a developer, I want the Edge_Server to be configurable via environment variables and have documented dependencies, so that I can deploy it on the Raspberry Pi reproducibly.

#### Acceptance Criteria

1. THE Edge_Server SHALL read the target backend URL from the PALAI_API_URL environment variable.
2. THE Edge_Server SHALL provide a `requirements.txt` file listing all Python dependencies needed to run on the Raspberry Pi.
3. IF the PALAI_API_URL environment variable is not set, THEN THE Edge_Server SHALL exit with a descriptive error message on startup.
4. THE Edge_Server SHALL bind to a configurable host and port (defaulting to `0.0.0.0:5000`).

### Requirement 5: Camera Source Toggle UI

**User Story:** As a farmer, I want to switch between my phone camera and the PalAI Hub on the scan page, so that I can choose the input method that suits my situation.

#### Acceptance Criteria

1. THE Scan_Page SHALL display a Source_Toggle component with two options: "Mobile Camera" and "PalAI Hub".
2. THE Scan_Page SHALL default to the "Mobile Camera" option on initial load.
3. WHEN the user selects "PalAI Hub", THE Scan_Page SHALL replace the mobile camera viewfinder with the MJPEG_Stream preview from the Tunnel_URL.
4. WHEN the user selects "Mobile Camera", THE Scan_Page SHALL restore the existing CameraCapture component and hide the MJPEG_Stream preview.
5. THE Source_Toggle SHALL use Tailwind CSS styling and Lucide React icons consistent with the existing PalAI design system.
6. WHILE the Scan_Page is in "PalAI Hub" mode, THE Scan_Page SHALL hide the image upload (drag-and-drop) option.

### Requirement 6: MJPEG Stream Display

**User Story:** As a farmer, I want to see the live camera feed from the PalAI Hub in the web app, so that I can verify the rice leaf is properly framed.

#### Acceptance Criteria

1. WHILE the Source_Toggle is set to "PalAI Hub", THE Scan_Page SHALL render an `<img>` element with its `src` attribute set to `{NEXT_PUBLIC_PI_TUNNEL_URL}/stream`.
2. THE Scan_Page SHALL read the Tunnel_URL from the `NEXT_PUBLIC_PI_TUNNEL_URL` environment variable.
3. IF the MJPEG_Stream fails to load or the connection is lost, THEN THE Scan_Page SHALL display a user-friendly error message indicating the Hub is unreachable.
4. THE MJPEG_Stream preview SHALL fill the camera viewfinder area and maintain the aspect ratio of the incoming frames.

### Requirement 7: Remote Capture Trigger and Result Flow

**User Story:** As a farmer, I want to press a button to capture a photo from the PalAI Hub and automatically get the AI diagnosis, so that I have a seamless scan experience without manual file transfers.

#### Acceptance Criteria

1. WHILE the Source_Toggle is set to "PalAI Hub", THE Scan_Page SHALL display a "Capture from Hub" button in place of the standard capture button.
2. WHEN the user presses the "Capture from Hub" button, THE Scan_Page SHALL send a POST request to `{NEXT_PUBLIC_PI_TUNNEL_URL}/capture`.
3. WHILE the capture and diagnosis are in progress, THE Scan_Page SHALL display a loading state using the existing LoadingOverlay component with appropriate step labels.
4. WHEN the Edge_Server responds with a successful result containing the scan ID, THE Scan_Page SHALL redirect the user to `/result/{id}`.
5. IF the capture request fails or times out, THEN THE Scan_Page SHALL display an error message and allow the user to retry.
6. WHILE a capture is in progress, THE Scan_Page SHALL disable the "Capture from Hub" button to prevent duplicate requests.

### Requirement 8: Environment Variable Configuration for Frontend

**User Story:** As a developer, I want the PalAI Hub URL to be configurable via environment variables, so that the frontend can connect to different Hub instances without code changes.

#### Acceptance Criteria

1. THE Scan_Page SHALL read the Hub stream and capture URLs from the `NEXT_PUBLIC_PI_TUNNEL_URL` environment variable.
2. IF the `NEXT_PUBLIC_PI_TUNNEL_URL` environment variable is not set, THEN THE Source_Toggle SHALL hide the "PalAI Hub" option and default to "Mobile Camera" only.
3. THE Source_Toggle SHALL only be visible WHEN the `NEXT_PUBLIC_PI_TUNNEL_URL` environment variable is configured with a non-empty value.
