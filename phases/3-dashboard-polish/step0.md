# Step 0: Caretaker dashboard page

## Task

Implement `src/app/dashboard/page.tsx` — the main caretaker dashboard.

Layout (single-column, max-w-3xl, per UI_GUIDE.md):
1. **Patient header** — name, timezone, last-seen timestamp
2. **Today's events feed** — list of events rows (kind, status, timestamp, summary from payload). Use semantic status pills (green/amber/red).
3. **Quick stats** — counts of med_checks, pantry_checks, txn_flagged for today
4. **Active rules summary** — max_single_txn, daily_limit, blocked_categories

Use `services/supabase/admin.ts` to fetch data server-side (Server Component). Follow UI_GUIDE.md strictly — stone palette, no gradients, no blur, lucide-react icons at size 20 strokeWidth 1.75.

## AC

- Dashboard renders without errors at `/dashboard`
- All 4 sections present
- Follows UI_GUIDE.md (no prohibited patterns)
- Typecheck passes
