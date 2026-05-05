-- Hybrid email subscription detection schema
-- Supports provider connections, scan history, and pending detections

create table if not exists public.email_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  provider text not null check (provider in ('gmail', 'outlook', 'manual')),
  email text not null,
  provider_user_id text,
  access_token text,
  refresh_token text,
  scopes text[] default '{}'::text[],
  status text not null default 'connected' check (status in ('connected', 'expired', 'revoked', 'error')),
  last_error text,
  connected_at timestamp with time zone default now(),
  last_scanned_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, provider, email)
);

create table if not exists public.scan_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  connection_id uuid references public.email_connections(id) on delete set null,
  provider text not null check (provider in ('gmail', 'outlook', 'manual')),
  source_email text,
  status text not null default 'started' check (status in ('started', 'completed', 'empty', 'failed')),
  emails_scanned integer default 0,
  subscriptions_found integer default 0,
  error_message text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists public.detected_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  scan_id uuid references public.scan_history(id) on delete set null,
  provider text not null check (provider in ('gmail', 'outlook', 'manual')),
  source_email text,
  external_key text,
  name text not null,
  icon text,
  color text,
  amount decimal(12, 2) not null default 0.00,
  cycle text not null default 'monthly' check (cycle in ('weekly', 'monthly', 'quarterly', 'annual')),
  category text default 'Autre',
  start_date timestamp with time zone default now(),
  confidence decimal(4, 2),
  raw_payload jsonb default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'imported', 'dismissed')),
  imported_subscription_id uuid references public.subscriptions(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.email_connections enable row level security;
alter table public.scan_history enable row level security;
alter table public.detected_subscriptions enable row level security;

create policy "Users can view their own email connections"
  on public.email_connections for select using (auth.uid() = user_id);
create policy "Users can insert their own email connections"
  on public.email_connections for insert with check (auth.uid() = user_id);
create policy "Users can update their own email connections"
  on public.email_connections for update using (auth.uid() = user_id);
create policy "Users can delete their own email connections"
  on public.email_connections for delete using (auth.uid() = user_id);

create policy "Users can view their own scan history"
  on public.scan_history for select using (auth.uid() = user_id);
create policy "Users can insert their own scan history"
  on public.scan_history for insert with check (auth.uid() = user_id);
create policy "Users can update their own scan history"
  on public.scan_history for update using (auth.uid() = user_id);
create policy "Users can delete their own scan history"
  on public.scan_history for delete using (auth.uid() = user_id);

create policy "Users can view their own detected subscriptions"
  on public.detected_subscriptions for select using (auth.uid() = user_id);
create policy "Users can insert their own detected subscriptions"
  on public.detected_subscriptions for insert with check (auth.uid() = user_id);
create policy "Users can update their own detected subscriptions"
  on public.detected_subscriptions for update using (auth.uid() = user_id);
create policy "Users can delete their own detected subscriptions"
  on public.detected_subscriptions for delete using (auth.uid() = user_id);

create index if not exists idx_email_connections_user_id on public.email_connections(user_id);
create index if not exists idx_scan_history_user_id on public.scan_history(user_id);
create index if not exists idx_detected_subscriptions_user_id on public.detected_subscriptions(user_id);
create index if not exists idx_detected_subscriptions_status on public.detected_subscriptions(user_id, status);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_email_connections_updated_at on public.email_connections;
create trigger set_email_connections_updated_at
before update on public.email_connections
for each row execute procedure public.set_updated_at();

drop trigger if exists set_detected_subscriptions_updated_at on public.detected_subscriptions;
create trigger set_detected_subscriptions_updated_at
before update on public.detected_subscriptions
for each row execute procedure public.set_updated_at();

notify pgrst, 'reload schema';
