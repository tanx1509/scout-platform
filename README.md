# Nachiketa: Candidate Intelligence Platform

🚀 **Live Demo:** [https://scout-platform-six.vercel.app](https://scout-platform-six.vercel.app)

An enterprise-grade, agent-based candidate screening and intelligence platform built to eliminate recruitment blind spots and accelerate technical hiring.

![Nachiketa Dashboard Demo Placeholder](docs/dashboard.gif)

## Architecture

Nachiketa utilizes a robust, modern stack focused on velocity and production readiness.

- **Framework**: Next.js 16.2.9 (App Router / Turbopack)
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS + shadcn/ui
- **Caching & Rate Limiting**: Upstash Redis (with graceful in-memory fallbacks)
- **AI/Agents**: Google Gemini API via structured output loops

### The Multi-Agent System

Nachiketa coordinates a swarm of autonomous subagents to build a 360-degree candidate profile:

1. **Coordinator Agent**: The brain. Ingests raw data and routes tasks to specialized sub-agents.
2. **Extraction Agent**: Deterministically parses resumes using regex & deterministic structured output.
3. **Assessment Agent**: Evaluates coding tests and scores candidates against the Job Description.
4. **GitHub Analysis Agent**: Traces deep GitHub commits, PRs, and repository metrics to gauge actual engineering impact.
5. **Matching Engine**: Calculates a composite semantic and heuristic score, and suggests human review if anomalies (like gap years) are detected.

## Key Features

- 🏎 **Zero-Latency Feel**: Optimistic UI updates and aggressive Redis caching.
- 🛡 **Fail-Safe AI**: 100% Zod validation for all LLM outputs. No `JSON.parse` crashes.
- 🔍 **Deep Observability**: LangSmith-style activity traces for AI decision-making (cache hits, execution time, tools used).
- 🎨 **Enterprise UI**: Framer-motion driven staggered lists, micro-interactions, and skeleton loading states.
- 🚦 **Resilient Infra**: Circuit breakers for Upstash, environment variable validation on boot.

## Setup Instructions

```bash
# 1. Install Dependencies
npm install

# 2. Configure Environment
cp .env.example .env
# Required for full functionality (though demo mode fallbacks exist):
# DATABASE_URL="..."
# GOOGLE_GENERATIVE_AI_API_KEY="..."
# RESEND_API_KEY="..."
# GOOGLE_CLIENT_ID="..."
# GOOGLE_CLIENT_SECRET="..."

# 3. Apply Migrations
npx prisma generate
npx prisma db push

# 4. Start Development Server
npm run dev
```

## Demo Workflow

To test the complete platform end-to-end, follow this sequence:

1. **Job Setup**: Go to `/dashboard`, click "Job Setup", and create a new Job Description (e.g., AI Engineer).
2. **Candidate Upload**: Click "Upload Candidates" and drop the provided `candidate_dataset.xlsx`.
3. **Link to Job**: Select the created Job from the dropdown in the upload modal and confirm the import.
4. **Run Intelligence**: The batch orchestrator will automatically pick up the pending applied candidates, run the GitHub and Resume evaluation agents, and generate a scored profile.
5. **Evaluate Candidates**: Go to `/candidates` or use the dashboard to view the ranked candidates. Expand a candidate's row to see the evaluator's risk analysis and evidence.
6. **Outreach actions**: Open a candidate's profile and click "Send Assessment" (uses Resend) or "Schedule Interview" (uses Google Calendar API). 
   *Note: If no API keys are provided, the system transparently falls back to Demo Mode and logs the activities to the timeline.*
