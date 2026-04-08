-- Profiles table to store user settings and status
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  onboarding_complete boolean default false,
  income decimal(12, 2) default 0.00,
  income_cycle text check (income_cycle in ('weekly', 'biweekly', 'monthly', 'annually')) default 'monthly',
  currency text default '€',
  notif_level integer default 1,
  trial_start_date timestamp with time zone default now(),
  trial_duration_days integer default 14,
  subscription_plan text, -- 'monthly', 'annual', 'lifetime'
  features jsonb default '{"budgeting": true, "incomeTracking": true, "reports": true, "rounding": false, "faceId": false}'::jsonb,
  updated_at timestamp with time zone default now()
);

-- Categories table
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  icon text,
  color text,
  budget decimal(12, 2) default 0.00,
  spent decimal(12, 2) default 0.00,
  cycle text default 'monthly',
  "type" text default 'expense', -- 'expense', 'savings'
  active boolean default true,
  created_at timestamp with time zone default now(),
  unique(user_id, name)
);

-- Subscriptions table
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  icon text,
  color text,
  amount decimal(12, 2) not null,
  cycle text check (cycle in ('weekly', 'monthly', 'quarterly', 'annual')) default 'monthly',
  category text,
  active boolean default true,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Transactions table
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount decimal(12, 2) not null,
  category_id uuid references public.categories(id) on delete set null,
  category_name text,
  icon text,
  color text,
  note text,
  date timestamp with time zone default now(),
  "type" text check ("type" in ('income', 'expense')) not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.subscriptions enable row level security;
alter table public.transactions enable row level security;

-- Policies for Profiles
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

-- Policies for Categories
create policy "Users can view their own categories" on public.categories for select using (auth.uid() = user_id);
create policy "Users can update their own categories" on public.categories for update using (auth.uid() = user_id);
create policy "Users can insert their own categories" on public.categories for insert with check (auth.uid() = user_id);
create policy "Users can delete their own categories" on public.categories for delete using (auth.uid() = user_id);

-- Policies for Subscriptions
create policy "Users can view their own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users can update their own subscriptions" on public.subscriptions for update using (auth.uid() = user_id);
create policy "Users can insert their own subscriptions" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "Users can delete their own subscriptions" on public.subscriptions for delete using (auth.uid() = user_id);

-- Policies for Transactions
create policy "Users can view their own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Users can update their own transactions" on public.transactions for update using (auth.uid() = user_id);
create policy "Users can insert their own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can delete their own transactions" on public.transactions for delete using (auth.uid() = user_id);

-- Trigger to create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end $$;

-- Indexes for performance
create index if not exists idx_categories_user_id on public.categories(user_id);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_category_id on public.transactions(category_id);
create index if not exists idx_transactions_date on public.transactions(date);
