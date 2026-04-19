# Step 0: Bootstrap Next.js

## Task

Initialize a Next.js 15 + TypeScript (strict) + Tailwind project in the repo root.

If `package.json` already exists from `npx create-next-app`, verify it has the correct setup (app router, src dir, eslint, tailwind) and skip creation. Otherwise, run:

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --eslint --import-alias "@/*" --no-turbopack
```

Install runtime dependencies:

```bash
npm install @supabase/supabase-js spectrum-ts zod @google/genai lucide-react
npm install -D vitest @vitejs/plugin-react tsx @types/node
```

Add the following scripts to `package.json` (merge with existing, don't overwrite dev/build/lint):

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "agent": "tsx src/agent/worker.ts"
  }
}
```

Verify `tsconfig.json` has `"strict": true` and `"noUncheckedIndexedAccess": true`. Add the second one if missing.

Create the directory scaffold (empty directories with a `.gitkeep` in each, or placeholder files where noted):

```
src/
├── app/
│   ├── api/                      # route handlers (created in later steps)
│   ├── cam/                      # webcam pages (created in step 6)
│   ├── dashboard/                # caretaker dashboard (later phase)
│   └── onboarding/               # POA confirmation + config (later phase)
├── components/
│   └── cam/                      # WebcamCapture (step 6)
├── services/
│   ├── gemini/                   # vision wrapper (step 5)
│   ├── knot/                     # Knot API client (later phase)
│   ├── photon/                   # Spectrum app + outbound (step 3)
│   ├── supabase/                 # admin + browser clients (step 2)
│   └── outbox.ts                 # enqueueMessage helper (step 4)
├── agent/
│   ├── worker.ts                 # Spectrum + outbox drainer (step 4)
│   └── commandRouter.ts          # inbound intent matching (step 4)
├── types/
│   ├── db.ts                     # Supabase types (step 2)
│   └── domain.ts                 # placeholder: `export {}`
└── lib/
    ├── env.ts                    # Zod env accessor (step 1)
    └── zod.ts                    # placeholder: `export {}`
```

Create `.env.example` at repo root with these keys (blank values on RHS):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini
GEMINI_API_KEY=

# Knot (development env)
KNOT_CLIENT_ID=
KNOT_SECRET=
KNOT_BASE_URL=https://development.knotapi.com

# Photon Spectrum (Pro plan — cloud mode)
PHOTON_PROJECT_ID=
PHOTON_PROJECT_SECRET=

# Target phone for demo notifications
CARETAKER_PHONE=
```

Make sure `.env.local` is in `.gitignore` (append if missing).

Create a placeholder `src/app/page.tsx` that renders `<main><h1>NannyCam</h1><p>Setup complete.</p></main>` so `npm run dev` doesn't 404.

Configure Vitest minimally — create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

## AC

- `npm run dev` starts on http://localhost:3000 and shows "NannyCam — Setup complete." without errors
- `npm run build` completes successfully
- `npm run typecheck` passes with no errors
- `npm run lint` passes with no errors
- `npm run test` runs (may report "no tests found" — that's OK)
- All directories in the scaffold above exist
- `.env.example` exists at repo root with every key from the list above
- `.env.local` is listed in `.gitignore`
- `tsconfig.json` has `"strict": true` AND `"noUncheckedIndexedAccess": true`

## Out of scope for this step

- Do NOT install or configure Supabase CLI
- Do NOT write any real logic in service files — just create placeholder exports
- Do NOT attempt to run Spectrum, Gemini, or Knot in this step
