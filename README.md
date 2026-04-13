# PalAI - Rice Leaf Disease Classification

> AI-powered web application for classifying rice leaf diseases, built for Filipino farmers with Next.js 15, TypeScript, Supabase, and Google Gemini AI.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Mobile-First Design](#mobile-first-design)
- [AI Architecture](#ai-architecture)
  - [Two-Step AI Approach](#two-step-ai-approach)
  - [Treatment API](#treatment-api)
- [Data Storytelling Dashboard](#data-storytelling-dashboard)
- [Loading UX](#loading-ux)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## ✨ Features

### Core Functionality

- **📸 Image Upload & Camera Capture**: Upload images or capture directly from device camera
- **🤖 AI-Powered Diagnosis**: Multi-provider failover system (Next API → Local Mock)
- **💊 Treatment Guide**: Step-by-step prevention and treatment recommendations
- **🌍 Bilingual Support**: Results in English and Tagalog (Taglish C3 style)
- **📚 Scan History**: View past diagnoses with thumbnails and metadata
- **📊 Data Insights**: Visual storytelling dashboard with charts and trends
- **♿ Accessible UI**: WCAG AA compliant with Tailwind CSS and shadcn/ui

### Mobile-First Features

- **📱 Bottom Navigation**: Fixed tab bar for easy thumb access
- **📸 Full-Screen Camera**: Immersive camera experience with live preview
- **👆 Touch-Optimized**: Minimum 44x44px touch targets
- **🎯 Safe Area Support**: Works perfectly with notched devices
- **⚡ Progressive Enhancement**: Mobile-first, scales up to desktop

### Disease Classifications

- `HEALTHY` - No disease detected
- `SHEATH_BLIGHT` - Sheath blight disease
- `TUNGRO` - Tungro virus
- `RICE_BLAST` - Rice blast disease

---

## 🛠 Tech Stack

| Category             | Technologies                            |
| -------------------- | --------------------------------------- |
| **Framework**        | Next.js 15 (App Router, Server Actions) |
| **Language**         | TypeScript                              |
| **UI**               | Tailwind CSS + shadcn/ui                |
| **Authentication**   | NextAuth.js                             |
| **Database**         | Supabase (PostgreSQL + Storage)         |
| **Image Processing** | Sharp                                   |
| **AI**               | Google Gemini 1.5 Flash/Pro             |
| **Charts**           | Recharts                                |
| **Icons**            | Lucide React                            |
| **Testing**          | Vitest (unit) + Playwright (E2E)        |
| **Monorepo**         | pnpm workspaces                         |

---

## 📁 Project Structure

```
PalAI/
├── apps/
│   └── palai/                    # Next.js application
│       ├── src/
│       │   ├── app/              # App Router pages
│       │   │   ├── scan/         # Image upload & camera
│       │   │   ├── result/[id]/  # Diagnosis results
│       │   │   ├── history/      # Scan history
│       │   │   ├── stats/        # Data insights
│       │   │   ├── actions/      # Server actions
│       │   │   └── api/          # API routes
│       │   │       ├── ai/       # AI endpoints
│       │   │       └── scans/    # Scan management
│       │   ├── components/       # React components
│       │   │   ├── scan/         # Scan UI
│       │   │   ├── result/       # Result display
│       │   │   ├── history/      # History list
│       │   │   ├── stats/        # Charts & insights
│       │   │   ├── layout/       # Navigation
│       │   │   └── ui/           # Reusable UI
│       │   ├── lib/              # Utilities & helpers
│       │   ├── hooks/            # Custom React hooks
│       │   └── types/            # TypeScript types
│       ├── e2e/                  # Playwright tests
│       ├── public/               # Static assets
│       └── supabase/             # Database migrations
│           └── migrations/
│               ├── 001_initial.sql
│               └── 002_add_treatment_fields.sql
├── packages/
│   └── ml/                       # ML provider package
│       └── src/
│           ├── providers/        # AI providers
│           │   ├── nextapi.ts   # Gemini fallback
│           │   └── local.ts     # Mock provider
│           ├── schema.ts        # Zod validation
│           ├── failover.ts      # Failover logic
│           └── types.ts         # TypeScript interfaces
├── .gitignore                    # Git ignore rules
├── .eslintrc.json               # ESLint config
├── .prettierrc                  # Prettier config
├── .lintstagedrc.json           # Lint-staged config
├── .husky/                      # Git hooks
├── package.json                 # Root package config
├── pnpm-workspace.yaml          # pnpm workspace config
├── tsconfig.json                # Root TypeScript config
└── README.md                    # Main documentation
```

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ and pnpm 8+
- Supabase account and project
- Google Gemini API key

### 1. Clone and Install

```bash
# Install dependencies
pnpm install
```

### 2. Environment Variables

Copy `.env.example` to `apps/palai/.env.local`:

```bash
cp .env.example apps/palai/.env.local
```

**Required variables:**

```env
# NextAuth
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
```

**Where to get these:**

- **Supabase**: Dashboard → Settings → API
  - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `anon` `public` key
  - `SUPABASE_SERVICE_ROLE_KEY`: `service_role` `secret` key
- **Gemini API**: [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Supabase Setup

#### Option A: Via Supabase Dashboard

1. Go to **SQL Editor** in Supabase dashboard
2. Copy contents of `apps/palai/supabase/migrations/001_initial.sql`
3. Paste and execute
4. Copy contents of `apps/palai/supabase/migrations/002_add_treatment_fields.sql`
5. Paste and execute

#### Option B: Via Supabase CLI

```bash
cd apps/palai
supabase db push
```

**This creates:**

- `users` table with RLS policies
- `scans` table with RLS policies
- `palai-images` storage bucket (public read)
- Treatment fields (prevention_steps, treatment_steps, sources)

### 4. Build ML Package

```bash
cd packages/ml
pnpm build
cd ../..
```

### 5. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` 🎉

---

## 📱 Mobile-First Design

### Key Mobile Features

#### Bottom Navigation

- **Fixed bottom tab bar** for easy thumb access
- 4 main sections: Home, Scan, History, Insights
- Always visible for quick navigation
- Safe-area support for notched devices

#### Full-Screen Camera

- **Immersive camera interface** with live preview
- Large circular capture button (80x80px)
- Camera flip button for front/back cameras
- Visual guide overlay for leaf positioning

#### Touch Optimizations

- **Minimum 44x44px touch targets** (Apple HIG standard)
- Active press animations (`active:scale-95`)
- No accidental zoom on input focus (16px font minimum)
- Tap highlight color removed
- Smooth touch scrolling

#### CSS Enhancements

```css
/* Safe Area Support */
.safe-area-top {
  padding-top: calc(env(safe-area-inset-top) + 0.5rem);
}

.safe-area-bottom {
  padding-bottom: calc(env(safe-area-inset-bottom) + 0.5rem);
}

/* Touch Optimizations */
button,
a {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  user-select: none;
}

* {
  -webkit-overflow-scrolling: touch;
}

/* Disable zoom on input focus (mobile) */
@media screen and (max-width: 768px) {
  input,
  textarea,
  select {
    font-size: 16px !important;
  }
}
```

### Design System

**Color Palette:**

- Primary: Green 600/700 (agriculture theme)
- Severity Colors: Green (Low), Yellow (Moderate), Red (High)

**Spacing:**

- Touch targets: Minimum 44x44px
- Padding: 16px (mobile), 24px (tablet+)
- Border radius: 16px for cards

**Typography:**

- Headings: Bold, 20-32px
- Body: Regular, 14-16px
- System font stack (San Francisco on iOS, Roboto on Android)

---

## 🤖 AI Architecture

### Two-Step AI Approach

PalAI uses a **two-step AI architecture** for optimal performance:

#### Step 1: Image Diagnosis (Fast)

```
User uploads image
     ↓
POST /api/ai/diagnose
     ↓
Returns: { label, confidence, severity, explanationEn, explanationTl, cautions }
     ↓
Save to database (without treatment data)
     ↓
Redirect to /result/[id]
```

**Duration:** ~3-5 seconds

#### Step 2: Treatment Guide (On-Demand)

```
Load scan from database
     ↓
Check if treatment data exists in DB
     ↓
If NO treatment data:
     ↓
  POST /api/ai/treatment { disease, language }
     ↓
  Returns: { preventionSteps[], treatmentSteps[], sources[] }
     ↓
  Display treatment guide
     ↓
  POST /api/scans/update-treatment (cache in DB)
```

**First view:** ~5-8 seconds  
**Cached view:** <100ms

### Benefits

- ⚡ **Faster initial diagnosis** - Users get disease results immediately
- 💰 **Cost-effective** - Treatment guide only generated when viewing results
- 📦 **Caching** - Treatment data stored in DB for instant subsequent views
- 🎯 **Focused prompts** - Each AI call optimized for its specific task

### Failover System

```typescript
// Primary → Fallback
Next API (Gemini) → Local Mock
```

1. **Next API Provider**: Primary AI using Google Gemini
2. **Local Mock Provider**: Deterministic mock for development

---

## 💊 Treatment API

### API Endpoints

#### 1. POST `/api/ai/treatment`

**Request:**

```json
{
  "disease": "RICE_BLAST",
  "language": "en"
}
```

**Response:**

```json
{
  "preventionSteps": [
    {
      "step": 1,
      "titleEn": "Use Resistant Varieties",
      "titleTl": "Gumamit ng Resistant Varieties",
      "descriptionEn": "Plant blast-resistant rice varieties...",
      "descriptionTl": "Magtanim ng blast-resistant varieties..."
    }
  ],
  "treatmentSteps": [...],
  "sources": [
    {
      "title": "IRRI - Blast Disease Management",
      "url": "http://www.knowledgebank.irri.org/..."
    }
  ]
}
```

#### 2. POST `/api/scans/update-treatment`

Caches treatment data in the database.

### Components

**TreatmentGuide** (`components/result/TreatmentGuide.tsx`):

- Prevention and Treatment tabs
- Numbered step-by-step instructions
- Bilingual content (syncs with language selector)
- Source links with external icons
- Mobile-optimized layout

**ResultDetails** (`components/result/ResultDetails.tsx`):

- Manages language state
- Fetches treatment data if not cached
- Shows loading/error states
- Updates database with fetched data

### Database Schema

```sql
ALTER TABLE scans
ADD COLUMN prevention_steps JSONB DEFAULT '[]',
ADD COLUMN treatment_steps JSONB DEFAULT '[]',
ADD COLUMN sources JSONB DEFAULT '[]';
```

---

## � Data Storytelling Dashboard

### Stats Page Features

The **Insights page** (`/stats`) transforms raw scan data into engaging visual stories:

#### 1. Hero Statistics Cards

Four animated metrics:

- **Total Scans**: Count of analyzed leaves
- **Average Confidence**: AI confidence score (0-100%)
- **Health Score**: Percentage of healthy leaves
- **Top Disease**: Most detected disease

Features:

- Animated number counting on load
- Color-coded by metric type
- Icon representations

#### 2. AI Confidence Story

**"How Accurate Are the Diagnoses?"**

- **Confidence Gauge**: Circular gauge (Red → Yellow → Green)
- **Distribution Chart**: Bar chart showing 4 confidence ranges
- **High Confidence Callout**: Percentage above 75%

#### 3. Disease Detection Patterns

**"What We're Detecting"**

- **Disease Donut Chart**: Visual distribution with colors
- **Key Insights**: Auto-generated insights:
  - "85% of diagnoses have high confidence (>75%)"
  - "Bacterial Leaf Blight is the most detected disease"
  - "Crop health is improving over time 📈"

#### 4. Trends Over Time

**"Scan Trends Over Time"**

- **Line Chart**: 7-day scan activity
- Three lines: Total, Healthy, Diseased
- Color-coded and responsive

#### 5. Personal vs Community View

- Toggle between "My Scans" and "Community"
- Icon-based switch (User/Users)
- Smooth transitions

### Components Created

- `StatCard.tsx` - Animated metric cards
- `ViewToggle.tsx` - Personal/Community switcher
- `ConfidenceGauge.tsx` - Circular SVG gauge
- `DiseaseDonut.tsx` - Recharts donut chart
- `ConfidenceDistribution.tsx` - Bar chart
- `TrendChart.tsx` - Line chart
- `StatsContent.tsx` - Main client component

---

## ⚡ Loading UX

### Multi-Step Progress

**Scan Page** features a 4-step progress indicator:

1. **Upload** (0-25%): Preparing image
2. **Process** (25-50%): Optimizing quality
3. **AI Analysis** (50-95%): Diagnosing disease
4. **Complete** (95-100%): Saving results

### Components

#### MultiStepProgress (`components/ui/MultiStepProgress.tsx`)

- Visual progress bar (0-100%)
- Step status indicators (pending/active/complete)
- Check marks for completed steps
- Animated bouncing dots for active step
- Color-coded states

#### LoadingOverlay (`components/ui/LoadingOverlay.tsx`)

- Full-screen overlay with backdrop blur
- Progress component integration
- Dynamic status messages
- Estimated time remaining
- Large, accessible cancel button
- Mobile safe-area support

#### SkeletonLoader (`components/ui/SkeletonLoader.tsx`)

Variants:

- `card`: Scan history cards
- `image`: Result page image
- `chart`: Dashboard charts
- `text`: Text content

#### useAbortController (`hooks/useAbortController.ts`)

- Manages AbortController lifecycle
- Cancels async operations
- Automatic cleanup

### Implementation

```typescript
// Scan page with progress
const [progress, setProgress] = useState(0);
const [currentStep, setCurrentStep] = useState(0);
const [statusMessage, setStatusMessage] = useState('');

const steps = [
  { label: 'Upload', status: currentStep > 0 ? 'complete' : 'active' },
  { label: 'Process', status: currentStep > 1 ? 'complete' : 'pending' },
  { label: 'AI Analysis', status: currentStep > 2 ? 'complete' : 'pending' },
  { label: 'Complete', status: currentStep === 3 ? 'complete' : 'pending' },
];

// History/Result pages with Suspense
<Suspense fallback={<SkeletonLoader variant="card" count={4} />}>
  <ScansList />
</Suspense>
```

---

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

**Test files:**

- `apps/palai/src/lib/image.test.ts` - Image validation
- `apps/palai/src/lib/ml.test.ts` - ML provider
- `apps/palai/src/lib/schema.test.ts` - Zod validation

### E2E Tests

```bash
# Run Playwright tests
pnpm test:e2e

# Interactive mode
pnpm test:e2e:ui
```

**Test files:**

- `apps/palai/e2e/scan.spec.ts` - Scan flow

### Manual Testing

#### Scan Flow

1. Upload/capture image
2. View loading progress
3. Check diagnosis result
4. Verify treatment guide loads
5. Test language switcher

#### History Page

1. View scan list
2. Click scan card
3. Delete individual scan
4. Clear all scans

#### Stats Page

1. Toggle Personal/Community views
2. Verify charts render
3. Check insights generation
4. Test on mobile

---

## 🚀 Deployment

### Build

```bash
pnpm build
```

### Deployment Platforms

#### Vercel (Recommended)

1. Connect GitHub repository
2. Set environment variables
3. Deploy

```bash
vercel --prod
```

#### Other Platforms

- Railway
- Render
- Netlify
- AWS Amplify

### Environment Variables

Set all environment variables from `.env.local` in your hosting platform:

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

### Database

- Ensure RLS policies are enabled in Supabase
- Verify storage bucket is configured as public
- Run both migrations (001 and 002)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`pnpm test && pnpm lint`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write unit tests for utilities
- Add E2E tests for user flows
- Maintain mobile-first design
- Ensure accessibility (WCAG AA)
- Document complex logic
- Keep components small and focused

---

## 📄 License

MIT

---

## 🙏 Acknowledgments

- **IRRI (International Rice Research Institute)** - Rice disease research
- **PhilRice** - Philippine rice disease management resources
- **Filipino Farmers** - Inspiration and primary users
- **Next.js Team** - Excellent framework
- **Vercel** - Hosting platform
- **Supabase** - Database and storage

---

## 📞 Support

For issues, questions, or feature requests:

- Open an issue on GitHub
- Contact: [Your Contact Info]

---

**Built with ❤️ for Filipino farmers**

_Last Updated: November 2025_
