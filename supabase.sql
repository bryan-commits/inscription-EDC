create table members(*
  id uuid primary key default gen_random_uuid(),
  name text not null, tel text, st int not null, fee int not null,
  created_at timestamptz default now());
create table payments(
  id uuid primary key default gen_random_uuid(),
  n bigint generated always as identity,
  member_id uuid references members(id) on delete cascade,
  amount int not null check (amount > 0),
  created_at timestamptz default now());
alter table members enable row level security;
alter table payments enable row level security;
