-- Seed: one patient, one prescription, three inventory items, one spending rule

DO $$
DECLARE
  patient_id UUID := gen_random_uuid();
BEGIN

INSERT INTO patients (id, name, timezone, caretaker_phone, poa_confirmed_at)
VALUES (
  patient_id,
  'Margaret Thompson',
  'America/New_York',
  '+15555550100',
  now()
);

INSERT INTO prescriptions (patient_id, name, dose_times, compartments_per_dose, notes)
VALUES (
  patient_id,
  'Lisinopril 10mg',
  ARRAY['08:00', '20:00'],
  1,
  'Take with water. AM and PM doses.'
);

INSERT INTO inventory_items (patient_id, name, reorder_threshold, typical_qty)
VALUES
  (patient_id, 'Whole Milk (gallon)', 1, 2),
  (patient_id, 'Sliced Bread (loaf)',  1, 2),
  (patient_id, 'Orange Juice (64oz)',  1, 2);

INSERT INTO spending_rules (patient_id, max_single_txn, daily_limit, blocked_categories)
VALUES (
  patient_id,
  150.00,
  400.00,
  ARRAY['gambling', 'alcohol', 'tobacco']
);

END $$;
