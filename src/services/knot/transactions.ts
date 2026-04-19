import { knotFetch } from "./client";
import type { Transaction } from "@/types/domain";

export async function getTransaction(id: string): Promise<Transaction> {
  return knotFetch(`/transactions/${id}`) as Promise<Transaction>;
}

export async function syncTransactions(): Promise<Transaction[]> {
  return knotFetch("/transactions/sync") as Promise<Transaction[]>;
}
