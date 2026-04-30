-- Tabla para Usuarios de Staff (Personal)
create table if not exists public.staff_users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  password text not null,
  created_at timestamp with time zone default now()
);

-- Habilitar RLS
alter table public.staff_users enable row level security;

-- Política de acceso abierto (igual que las de helados para facilidad de uso)
create policy "Acceso total staff" on public.staff_users for all using (true) with check (true);
