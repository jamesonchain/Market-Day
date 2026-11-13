create table if not exists public.marketday_state (
  id text primary key,
  snapshot jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.marketday_state enable row level security;

revoke all on public.marketday_state from anon, authenticated;
grant all on public.marketday_state to service_role;

create table if not exists public.marketday_villagers (
  role text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.marketday_events (
  id text primary key,
  tick bigint not null,
  event jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.marketday_trades (
  id text primary key,
  trade jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.marketday_policies (
  role text primary key,
  policy jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.marketday_tick_runs (
  id text primary key,
  status text not null,
  result jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.marketday_tick_lock (
  id text primary key,
  locked_at timestamptz not null default now()
);
alter table public.marketday_villagers enable row level security;
alter table public.marketday_events enable row level security;
alter table public.marketday_trades enable row level security;
alter table public.marketday_policies enable row level security;
alter table public.marketday_tick_runs enable row level security;
alter table public.marketday_tick_lock enable row level security;
revoke all on public.marketday_villagers, public.marketday_events, public.marketday_trades, public.marketday_policies, public.marketday_tick_runs, public.marketday_tick_lock from anon, authenticated;
grant select on public.marketday_villagers, public.marketday_events, public.marketday_trades, public.marketday_policies to anon, authenticated;
grant all on public.marketday_villagers, public.marketday_events, public.marketday_trades, public.marketday_policies, public.marketday_tick_runs, public.marketday_tick_lock to service_role;
create policy "public villagers read" on public.marketday_villagers for select to anon, authenticated using (true);
create policy "public events read" on public.marketday_events for select to anon, authenticated using (true);
create policy "public trades read" on public.marketday_trades for select to anon, authenticated using (true);
create policy "public policies read" on public.marketday_policies for select to anon, authenticated using (true);
