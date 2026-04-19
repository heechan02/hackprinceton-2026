import { describe, it, expect } from "vitest";
import { classifyTransaction, BillProtectorResultSchema } from "../billProtector";
import type { Transaction, SpendingRule } from "@/types/domain";

const baseRules: SpendingRule = {
  max_single_txn: 100,
  daily_limit: 300,
  blocked_categories: ["gambling", "alcohol"],
};

function makeTxn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-1",
    amount: 20,
    merchant_name: "Walmart",
    merchant_category: "Grocery",
    daily_total: 50,
    ...overrides,
  };
}

describe("classifyTransaction", () => {
  it("returns ok for a normal transaction within all limits", () => {
    const result = classifyTransaction(makeTxn(), baseRules);
    expect(result.flagged).toBe(false);
    expect(result.severity).toBe("ok");
    expect(BillProtectorResultSchema.safeParse(result).success).toBe(true);
  });

  it("flags and marks urgent when merchant category is blocked", () => {
    const result = classifyTransaction(
      makeTxn({ merchant_category: "Alcohol & Spirits", daily_total: 20 }),
      baseRules,
    );
    expect(result.flagged).toBe(true);
    expect(result.severity).toBe("urgent");
    expect(result.reason).toMatch(/alcohol/i);
  });

  it("flags when amount exceeds max_single_txn", () => {
    const result = classifyTransaction(
      makeTxn({ amount: 150, daily_total: 150 }),
      baseRules,
    );
    expect(result.flagged).toBe(true);
    expect(result.severity).toBe("attention");
    expect(result.reason).toMatch(/single-transaction limit/i);
  });

  it("flags when daily_total exceeds daily_limit", () => {
    const result = classifyTransaction(
      makeTxn({ amount: 50, daily_total: 350 }),
      baseRules,
    );
    expect(result.flagged).toBe(true);
    expect(result.severity).toBe("attention");
    expect(result.reason).toMatch(/daily limit/i);
  });

  it("blocked category takes priority over amount check", () => {
    const result = classifyTransaction(
      makeTxn({ merchant_category: "gambling", amount: 5 }),
      baseRules,
    );
    expect(result.flagged).toBe(true);
    expect(result.severity).toBe("urgent");
  });

  it("output always passes Zod schema validation", () => {
    const cases = [
      makeTxn(),
      makeTxn({ amount: 999 }),
      makeTxn({ merchant_category: "gambling" }),
      makeTxn({ daily_total: 9999 }),
    ];
    for (const txn of cases) {
      const result = classifyTransaction(txn, baseRules);
      expect(BillProtectorResultSchema.safeParse(result).success).toBe(true);
    }
  });
});
