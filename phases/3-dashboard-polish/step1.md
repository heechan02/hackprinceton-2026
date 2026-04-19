# Step 1: Onboarding page

## Task

Implement `src/app/onboarding/page.tsx` — POA confirmation + initial config.

Steps (rendered as a simple multi-step form, no library needed):
1. POA confirmation splash — checkbox "I confirm I hold Power of Attorney for this patient"
2. Patient info — name, timezone (select), caretaker phone (pre-filled from env if available)
3. Medication schedule — add prescription name + dose times
4. Spending rules — set max_single_txn and daily_limit

On submit, POST to a new `POST /api/onboarding/route.ts` that upserts patient + prescription + spending_rules in Supabase.

Follow UI_GUIDE.md for all styling.

## AC

- All 4 steps render without errors
- `/api/onboarding` upserts correctly
- Typecheck passes
