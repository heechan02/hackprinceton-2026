This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Running the smoke test (Phase 0)

You need three things running simultaneously:

1. `npm run dev` — Next.js dev server (terminal 1)
2. `npm run agent` — Spectrum worker (terminal 2, must stay running)
3. Browser tab open at http://localhost:3000/cam/pill

Point your laptop webcam at anything (for demo purposes, any object works — the full vision pipeline runs end-to-end). Click "Capture & analyze". Within ~15 seconds you should see:

- A new row in the `events` table in Supabase
- An iMessage on your registered caretaker phone with a snapshot attached

If the iMessage doesn't arrive:

- Check the `outbox` table: is the row status `sent`, `pending`, or `failed`?
- If `failed`, the `error` column tells you what went wrong
- If `pending` forever, the agent worker isn't running — start `npm run agent`

### Prerequisites

Before running, apply the storage migration in the Supabase dashboard SQL editor:

```sql
insert into storage.buckets (id, name, public)
values ('snapshots', 'snapshots', true)
on conflict (id) do nothing;
```

(This is `supabase/migrations/0003_storage.sql` — it must be run manually because Supabase Storage is not accessible via standard SQL migration runners.)
