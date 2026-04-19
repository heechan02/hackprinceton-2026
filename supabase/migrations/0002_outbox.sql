create table outbox (
  id uuid primary key default gen_random_uuid(),
  recipient_phone text not null,
  body text not null,
  attachment_path text,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index outbox_pending on outbox(created_at) where status = 'pending';
