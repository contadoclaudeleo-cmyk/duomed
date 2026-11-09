-- Aparelhos que aceitaram receber lembretes (notificações push). Cole no SQL Editor e rode uma vez.
create table if not exists public.push_assinaturas (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);
create index if not exists push_assinaturas_user on public.push_assinaturas (user_id);

alter table public.push_assinaturas enable row level security;
-- O Supabase não dá permissão automática em tabelas novas
grant select, insert, update, delete on public.push_assinaturas to authenticated;
grant select on public.push_assinaturas to service_role;
revoke all on public.push_assinaturas from anon;

drop policy if exists "cuidar dos proprios aparelhos" on public.push_assinaturas;
create policy "cuidar dos proprios aparelhos" on public.push_assinaturas
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
