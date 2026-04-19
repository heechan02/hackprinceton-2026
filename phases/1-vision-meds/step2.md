# Step 2: Bill Protector — Gemini classifier

## Task

Implement `src/services/gemini/billProtector.ts` that classifies a transaction against caretaker-set spending rules.

The function signature:
```ts
classifyTransaction(txn: Transaction, rules: SpendingRule): Promise<BillProtectorResult>
```

Where `BillProtectorResult` is a Zod-validated object:
```ts
{
  flagged: boolean,
  reason: string,        // human-readable explanation
  severity: "ok" | "attention" | "urgent"
}
```

Flag if: amount > rules.max_single_txn, daily spend would exceed rules.daily_limit, or merchant category matches rules.blocked_categories.

Use `src/types/domain.ts` for Transaction and SpendingRule types (add them if missing).

## AC

- `classifyTransaction` returns correct flags for over-limit, blocked-category, and ok transactions
- Zod schema validates all outputs
- At least 3 unit tests in `src/services/gemini/__tests__/billProtector.test.ts` covering each flag case
- Typecheck passes
