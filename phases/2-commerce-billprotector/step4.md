# Step 4: Command router — commerce intents

## Task

Extend `src/agent/commandRouter.ts` to handle commerce-related inbound iMessage commands:

- `"approve <id>"` — set `events.status = 'approved'` for the given event id, reply "✓ Approved."
- `"block <id>"` — set `events.status = 'blocked'`, reply "✗ Blocked."
- `"reorder"` — trigger a pantry reorder by calling `inventoryAssessment` on the last pantry snapshot URL from events, reply with what was ordered
- `"rules"` — reply with current spending rules formatted as plain text

Extend `src/agent/__tests__/commandRouter.test.ts` with tests for the new intents.

## AC

- All 4 intents matched correctly in tests
- Approve/block update the correct events row
- Typecheck passes
