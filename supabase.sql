insert into storage.buckets (id, name, public) values ('pdfs', 'pdfs', false)
on conflict (id) do nothing;

create table if not exists print_jobs (
  id uuid primary key default gen_random_uuid(),
  file_path text,
  original_name text,
  pages int,
  copies int default 1,
  color boolean default false,
  amount int,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table print_jobs enable row level security;
