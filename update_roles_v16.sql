-- 1. Asegurar columnas en Historial de Helados (para guardar el nombre de quién repuso)
alter table public.ice_cream_logs add column if not exists user_role text default 'admin';
alter table public.ice_cream_logs add column if not exists user_name text default 'Admin';

-- 2. Tabla para Usuarios de Staff (Personal individual)
create table if not exists public.staff_users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  password text not null,
  created_at timestamp with time zone default now()
);

-- Habilitar RLS
alter table public.staff_users enable row level security;

-- Política de acceso abierto (igual que las de helados)
create policy "Acceso total staff" on public.staff_users for all using (true) with check (true);
