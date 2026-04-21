-- Add missing event_kind enum values used by the application
ALTER TYPE event_kind ADD VALUE IF NOT EXISTS 'txn_ok';
ALTER TYPE event_kind ADD VALUE IF NOT EXISTS 'reorder_placed';
ALTER TYPE event_kind ADD VALUE IF NOT EXISTS 'reorder_pending_approval';
