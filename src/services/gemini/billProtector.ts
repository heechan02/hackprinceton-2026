import { z } from "zod";
import type { Transaction, SpendingRule } from "@/types/domain";

export const BillProtectorResultSchema = z.object({
  flagged: z.boolean(),
  reason: z.string(),
  severity: z.enum(["ok", "attention", "urgent"]),
});

export type BillProtectorResult = z.infer<typeof BillProtectorResultSchema>;

export function classifyTransaction(
  txn: Transaction,
  rules: SpendingRule,
): BillProtectorResult {
  // Check blocked categories (case-insensitive substring match)
  const categoryLower = txn.merchant_category.toLowerCase();
  const blockedMatch = rules.blocked_categories.find((cat) =>
    categoryLower.includes(cat.toLowerCase()),
  );
  if (blockedMatch) {
    return BillProtectorResultSchema.parse({
      flagged: true,
      reason: `Merchant category "${txn.merchant_category}" matches blocked category "${blockedMatch}".`,
      severity: "urgent",
    });
  }

  // Check single transaction limit
  if (txn.amount > rules.max_single_txn) {
    return BillProtectorResultSchema.parse({
      flagged: true,
      reason: `Transaction amount $${txn.amount.toFixed(2)} exceeds single-transaction limit of $${rules.max_single_txn.toFixed(2)}.`,
      severity: "attention",
    });
  }

  // Check daily limit
  if (txn.daily_total > rules.daily_limit) {
    return BillProtectorResultSchema.parse({
      flagged: true,
      reason: `Daily spend $${txn.daily_total.toFixed(2)} exceeds daily limit of $${rules.daily_limit.toFixed(2)}.`,
      severity: "attention",
    });
  }

  return BillProtectorResultSchema.parse({
    flagged: false,
    reason: "Transaction is within all spending rules.",
    severity: "ok",
  });
}
