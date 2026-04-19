-- Create public snapshots bucket for webcam captures
-- NOTE: Apply this migration manually in the Supabase dashboard SQL editor
-- (Storage API is not accessible via standard SQL migration runners)

insert into storage.buckets (id, name, public)
values ('snapshots', 'snapshots', true)
on conflict (id) do nothing;
