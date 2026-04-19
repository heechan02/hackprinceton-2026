# Step 3: Autonomous pantry reorder

## Task

Add pantry reorder logic to `POST /api/vision/capture?kind=pantry`.

After the Gemini inventory assessment:
1. For each item with `stockLevel === "empty" | "low"`, check if a reorder is needed
2. Look up the item's `reorder_threshold` and `typical_qty` from `inventory_items`
3. Compute reorder quantity = `typical_qty - current_estimated_qty` (use 0 for empty, 1 for low)
4. Call `syncCart` + `checkout` from `services/knot/shopping.ts`
5. If total order value > 2× the patient's `spending_rules.max_single_txn`, skip auto-checkout and instead enqueue an approval request iMessage
6. Insert an `events` row with `kind=reorder_placed` or `kind=reorder_pending_approval`

## AC

- Low/empty items trigger a Knot cart + checkout (or approval request if above threshold)
- Events row inserted for each reorder attempt
- Typecheck passes
