# PalAI — Project Summary (LLM Context Document)

## What This Project Is

PalAI is an AI-powered rice leaf disease classification web app built for Filipino farmers. A user photographs or uploads a rice leaf image, the app sends it to Google Gemini for diagnosis, and returns a disease label, severity, confidence score, bilingual explanation (English + Tagalog), and on-demand treatment/prevention guidance. All scan results are persisted in Supabase (PostgreSQL + object storage) and surfaced through a history page and a data insights dashboard.

## Monorepo Layout

```
palai-monorepo/                  # pnpm workspaces
├── apps/palai/                  # Next.js 15 application (App Router)
│   ├── src/app/                 # Pages, server actions, API routes
│   ├── src/components/          # React UI components
│   ├── src/lib/                 # Utilities (AI, image processing, Supabase client, constants)
│   ├── src/hooks/               # Custom React hooks
│   ├── src/types/               # TypeScript type definitions
│   ├── supabase/migrations/     # SQL migrations (001_initial, 002_add_treatment_fields)
│   └── e2e/                     # Playwright E2E tests
├── packages/ml/                 # Shared ML package (@palai/ml)
│   └── src/
│       ├── types.ts             # DiagnoseInput, DiagnoseOutput, PalAIProvider interface
│       ├── schema.ts            # Zod validation schemas
│       ├── failover.ts          # Provider failover orchestration
│       └── providers/
│           ├── nextapi.ts       # Calls /api/ai/diagnose (Gemini)
│           └── local.ts         # Deterministic mock provider (hash-based)
└── n8n/                         # (empty, placeholder for n8n workflows)
```

## Tech Stack

- Framework: Next.js 15 (App Router, Server Actions, React 18)
- Language: TypeScript
- Styling: Tailwind CSS, clsx + tailwind-merge utility
- Database & Storage: Supabase (PostgreSQL with RLS, Storage bucket `palai-images`)
- AI: Google Gemini 1.5 Flash/Pro via `@google/generative-ai`
- Image Processing: Sharp (resize 1024×1024, auto-rotate, JPEG 88% quality)
- Charts: Recharts
- Icons: Lucide React
- Auth: NextAuth.js (credentials provider, demo user fallback)
- Validation: Zod
- State: Zustand (dependency present, minimal usage)
- Testing: Vitest (unit), Playwright (E2E)
- Package Manager: pnpm workspaces
- Deployment: Vercel

## Disease Labels (6 classes)

HEALTHY, BACTERIAL_LEAF_BLIGHT, BROWN_SPOT, SHEATH_BLIGHT, TUNGRO, BLAST

## Severity Levels

LOW, MODERATE, HIGH

## Database Schema

### `users` table

| Column     | Type        | Notes               |
| ---------- | ----------- | ------------------- |
| id         | UUID (PK)   | gen_random_uuid()   |
| email      | TEXT UNIQUE |                     |
| name       | TEXT        |                     |
| role       | TEXT        | 'FARMER' or 'ADMIN' |
| created_at | TIMESTAMPTZ | default NOW()       |

### `scans` table

| Column           | Type        | Notes                                  |
| ---------------- | ----------- | -------------------------------------- |
| id               | UUID (PK)   | gen_random_uuid()                      |
| user_id          | UUID (FK)   | references users(id) ON DELETE CASCADE |
| image_url        | TEXT        | public URL from Supabase Storage       |
| label            | TEXT        | one of the 6 disease labels            |
| confidence       | FLOAT8      | 0.0–1.0                                |
| severity         | TEXT        | LOW / MODERATE / HIGH                  |
| explanation_en   | TEXT        | English explanation                    |
| explanation_tl   | TEXT        | Tagalog explanation                    |
| cautions         | TEXT[]      | e.g. ["Blurry image", "Strong glare"]  |
| prevention_steps | JSONB       | array of TreatmentStep objects         |
| treatment_steps  | JSONB       | array of TreatmentStep objects         |
| sources          | JSONB       | array of {title, url}                  |
| created_at       | TIMESTAMPTZ | default NOW()                          |

Row-Level Security is enabled. Users see only their own data; admins see all.

### Storage

Bucket `palai-images` (public read). Files stored as `{userId}/{timestamp}-{random}.jpg`.

## AI / ML Pipeline (Two-Step Architecture)

### Step 1 — Diagnosis (fast, ~3-5s)

1. User uploads/captures image on `/scan` page.
2. Server action `uploadAndDiagnose()` validates file (max 10 MB, JPEG/PNG/WebP), processes with Sharp.
3. `diagnoseWithFailover()` from `@palai/ml` tries providers in order:
   - **NextApiProvider** → POST `/api/ai/diagnose` → Gemini multimodal prompt with system instructions → returns JSON with label, confidence, severity, explanations, cautions.
   - **LocalMockProvider** → deterministic hash-based mock (fallback when Gemini is unavailable).
4. Result is validated with Zod (`DiagnoseOutputSchema`), confidence clamped to [0,1].
5. Image uploaded to Supabase Storage, scan record inserted (without treatment data).
6. Redirect to `/result/{id}`.

### Step 2 — Treatment Guide (on-demand, cached)

1. `/result/[id]` page loads scan from DB.
2. `ResultDetails` component checks if `prevention_steps`/`treatment_steps` are empty.
3. If empty and disease ≠ HEALTHY: POST `/api/ai/treatment` with disease label → Gemini generates bilingual prevention/treatment steps + sources.
4. Response cached to DB via POST `/api/scans/update-treatment` so subsequent views are instant.

### Gemini Prompts

- **Diagnosis prompt**: System prompt instructs strict JSON output with the 6 labels, confidence, severity, bilingual explanations (Taglish C3 style for Tagalog), and cautions.
- **Treatment prompt**: Requests 3-5 prevention steps, 3-5 treatment steps, credible sources (IRRI, PhilRice), bilingual, practical for Filipino farmers.

## Pages & Routes

| Path           | Type          | Description                                                 |
| -------------- | ------------- | ----------------------------------------------------------- |
| `/`            | Page          | Landing page with hero, disease cards, how-it-works         |
| `/scan`        | Page (client) | Full-screen camera capture or image upload, language toggle |
| `/result/[id]` | Page (server) | Diagnosis result with severity badge, treatment guide       |
| `/history`     | Page (server) | Scan history list with summary stats, delete actions        |
| `/stats`       | Page (server) | Data insights dashboard (donut chart, trend chart, stats)   |
| `/auth/signin` | Page          | Sign-in form                                                |
| `/auth/signup` | Page          | Sign-up form                                                |

## API Routes

| Endpoint                      | Method | Purpose                              |
| ----------------------------- | ------ | ------------------------------------ |
| `/api/ai/diagnose`            | POST   | Gemini image diagnosis               |
| `/api/ai/treatment`           | POST   | Gemini treatment guide generation    |
| `/api/scans/update-treatment` | POST   | Cache treatment data in scan record  |
| `/api/auth/[...nextauth]`     | \*     | NextAuth.js authentication endpoints |

## Server Actions

| Action              | File                         | Purpose                                                         |
| ------------------- | ---------------------------- | --------------------------------------------------------------- |
| `uploadAndDiagnose` | `app/actions/scan.ts`        | Full pipeline: validate → process → diagnose → store → redirect |
| `deleteScan`        | `app/actions/delete-scan.ts` | Delete single scan + storage image                              |
| `deleteAllScans`    | `app/actions/delete-scan.ts` | Clear all scans for current user                                |

## Key Components

- **CameraCapture** — live camera with flip, capture, upload fallback
- **ImageUpload** — drag-drop file upload with validation
- **ImagePreview** — preview captured/uploaded image before submission
- **LoadingOverlay** — full-screen 4-step progress indicator during diagnosis
- **ResultDetails** — manages language state, lazy-fetches treatment data
- **TreatmentGuide** — tabbed prevention/treatment steps display
- **SeverityBadge** — color-coded LOW/MODERATE/HIGH badge
- **ConfidenceBar** — visual confidence percentage
- **LanguageSwitcher** — EN/TL toggle
- **ShareLink** — copy result URL
- **StatsContent** — dashboard with stat cards, donut chart, trend chart, insights
- **BottomNav** — fixed bottom navigation (Home, Scan, History, Insights)
- **FullscreenHandler** — manages fullscreen mode for mobile
- **InstallPrompt** — PWA install prompt

## Authentication

NextAuth.js with credentials provider. Currently uses a demo user system: `getDemoUserId()` auto-creates `demo@palai.local` in the users table if it doesn't exist. Auth pages exist at `/auth/signin` and `/auth/signup`.

## Environment Variables

| Variable                        | Required | Purpose                                |
| ------------------------------- | -------- | -------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Supabase project URL                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anonymous key                 |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes      | Supabase admin operations              |
| `GEMINI_API_KEY`                | Yes      | Google Gemini API key                  |
| `GEMINI_MODEL`                  | No       | Model name (default: gemini-1.5-flash) |
| `NEXTAUTH_URL`                  | Yes      | App base URL                           |
| `NEXTAUTH_SECRET`               | Yes      | NextAuth secret                        |

## Build & Run

```bash
pnpm install
pnpm dev          # runs Next.js dev server (apps/palai)
pnpm build        # builds @palai/ml then apps/palai
pnpm test         # vitest unit tests
pnpm test:e2e     # playwright E2E tests
```

Deployed on Vercel. `vercel.json` configures build to compile the ML package first, then the Next.js app.
