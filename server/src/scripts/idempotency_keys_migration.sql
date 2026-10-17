-- Idempotency keys for safe retries of order creation (prevents duplicate orders
-- on double-click / network retry). Run in Supabase SQL editor.
create table if not exists public.idempotency_keys (
    key text primary key,
    status text not null default 'processing' check (status in ('processing', 'completed')),
    response_status int,
    response_body jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idempotency_keys_created_at_idx
    on public.idempotency_keys (created_at);

-- Only the backend (service role) touches this table.
alter table public.idempotency_keys enable row level security;

-- Optional cleanup (run periodically, e.g. via pg_cron):
-- delete from public.idempotency_keys where created_at < now() - interval '24 hours';
