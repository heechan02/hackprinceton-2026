export interface Transaction {
  id: string;
  amount: number; // in dollars
  merchant_name: string;
  merchant_category: string;
  daily_total: number; // running daily spend including this transaction
  description?: string;
}

export interface SpendingRule {
  max_single_txn: number; // max allowed for a single transaction
  daily_limit: number; // max allowed daily spend
  blocked_categories: string[]; // merchant categories that are always flagged
}
