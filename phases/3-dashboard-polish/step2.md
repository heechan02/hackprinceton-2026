# Step 2: Realtime events feed

## Task

Make the dashboard events feed update in real time using Supabase Realtime.

Extract the events feed from `dashboard/page.tsx` into a client component `src/components/dashboard/EventsFeed.tsx`. It should:
1. Receive initial events as a prop (from the Server Component)
2. Subscribe to `supabase.channel('events').on('postgres_changes', ...)` for INSERT/UPDATE on the `events` table
3. Prepend new events to the list without a full page reload

Use `services/supabase/client.ts` (anon client) for the realtime subscription.

## AC

- New events appear in the feed within 2 seconds of being inserted
- Initial server-rendered events are shown immediately (no loading flash)
- Typecheck passes
