# NannyCam

An AI-powered eldercare monitoring dashboard built at HackPrinceton 2026. NannyCam helps adult children remotely monitor and assist elderly parents through vision analysis, automated medication tracking, smart spending rules, and iMessage notifications.

## Tech Stack

- **Next.js 15** (App Router, Server Components)
- **TypeScript** + **Tailwind CSS**
- **Supabase** (Postgres + Realtime)
- **Gemini API** (vision analysis + text)
- **Knot API** (transaction monitoring + agentic shopping)
- **Spectrum / Photon** (iMessage agent)

## Prerequisites

- Node.js 18+
- A Supabase project
- API keys for Gemini, Knot, and Photon (see `.env.example`)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your keys in `.env.local`.

3. **Run Supabase migrations**

   Apply the storage migration in the Supabase dashboard SQL editor:

   ```sql
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('snapshots', 'snapshots', true)
   ON CONFLICT (id) DO NOTHING;
   ```

## Running

You need two terminals:

```bash
# Terminal 1 — Next.js dev server
npm run dev

# Terminal 2 — iMessage agent worker
npm run agent
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on :3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run agent` | Start iMessage agent worker |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run tests (Vitest) |

## Team

Built at HackPrinceton 2026.
