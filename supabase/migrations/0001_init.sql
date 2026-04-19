-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
CREATE TYPE event_kind AS ENUM ('med_check', 'pantry_check', 'reorder', 'txn_flagged', 'system');
CREATE TYPE event_status AS ENUM ('pending', 'in_progress', 'completed', 'approved', 'blocked', 'failed');

-- patients
CREATE TABLE patients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  timezone        TEXT NOT NULL DEFAULT 'America/New_York',
  caretaker_phone TEXT NOT NULL,
  poa_confirmed_at TIMESTAMPTZ
);

-- prescriptions
CREATE TABLE prescriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id            UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  dose_times            TEXT[] NOT NULL DEFAULT '{}',
  compartments_per_dose INT NOT NULL DEFAULT 1,
  notes                 TEXT
);

-- inventory_items
CREATE TABLE inventory_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  reorder_threshold INT NOT NULL DEFAULT 2,
  typical_qty       INT NOT NULL DEFAULT 10
);

-- spending_rules
CREATE TABLE spending_rules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  max_single_txn      NUMERIC(10,2) NOT NULL DEFAULT 100.00,
  daily_limit         NUMERIC(10,2) NOT NULL DEFAULT 300.00,
  blocked_categories  TEXT[] NOT NULL DEFAULT '{}'
);

-- events
CREATE TABLE events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  kind         event_kind NOT NULL,
  status       event_status NOT NULL DEFAULT 'pending',
  payload      JSONB NOT NULL DEFAULT '{}',
  snapshot_url TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_patient_created ON events(patient_id, created_at DESC);

-- transactions
CREATE TABLE transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  knot_id     TEXT NOT NULL UNIQUE,
  total       NUMERIC(10,2) NOT NULL,
  merchant    TEXT NOT NULL,
  skus        JSONB NOT NULL DEFAULT '[]',
  flagged     BOOLEAN NOT NULL DEFAULT false,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_patient_created ON transactions(patient_id, created_at DESC);

-- system_health
CREATE TABLE system_health (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cam_kind          TEXT NOT NULL UNIQUE,
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
