
-- Enable RLS on expenses table
alter table public.expenses enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Enable all access for all users" on public.expenses;
drop policy if exists "Enable read access for all users" on public.expenses;
drop policy if exists "Enable insert access for all users" on public.expenses;
drop policy if exists "Enable update access for all users" on public.expenses;
drop policy if exists "Enable delete access for all users" on public.expenses;

-- Create a permissive policy for all operations
create policy "Enable all access for all users"
on public.expenses
for all
using (true)
with check (true);

-- Verify policy creation (optional, just for confirmation if run in editor)
select * from pg_policies where tablename = 'expenses';
