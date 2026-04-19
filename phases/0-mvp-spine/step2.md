# Step 2: Supabase schema + admin client

## Task

Write SQL migration in `supabase/migrations/0001_init.sql` creating:

- `patients` (id, name, timezone, caretaker_phone, poa_confirmed_at)
- `prescriptions` (id, patient_id, name, dose_times[], compartments_per_dose, notes)
- `inventory_items` (id, patient_id, name, reorder_threshold, typical_qty)
- `spending_rules` (id, patient_id, max_single_txn, daily_limit, blocked_categories[])
- `events` (id, patient_id, kind, status, payload jsonb, snapshot_url, created_at, updated_at) — kind enum: 'med_check' | 'pantry_check' | 'reorder' | 'txn_flagged' | 'system'
- `transactions` (id, patient_id, knot_id, total, merchant, skus jsonb, flagged bool, reason, created_at)
- `system_health` (id, cam_kind, last_heartbeat_at)

Add indices on (patient_id, created_at DESC) for events and transactions.

Implement `src/services/supabase/admin.ts` and `src/services/supabase/client.ts`.

## AC

- Migration applies cleanly against a fresh local Supabase (user will run)
- `admin.ts` and `client.ts` both typecheck with generated types
- Seed script `supabase/seed.sql` inserts one patient, one prescription, three inventory items, one spending rule
