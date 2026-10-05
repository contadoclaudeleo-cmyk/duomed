-- ============================================================
-- DuoMed Plus (vidas infinitas) e recargas de vidas, vendidos pela Kiwify.
-- Cole tudo no Supabase em: SQL Editor > New query > Run.
--
-- Quem escreve nestas tabelas é só a função do servidor
-- (supabase/functions/kiwify-webhook), com a chave de serviço.
-- O app só LÊ a própria linha de "assinaturas": não consegue se dar Plus.
-- ============================================================

-- Situação de cada pessoa: até quando é Plus e quantas recargas tem guardadas
create table if not exists public.assinaturas (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plano text,
  valido_ate timestamptz,
  recargas integer not null default 0,
  assinatura_kiwify text,
  atualizado_em timestamptz not null default now()
);

alter table public.assinaturas enable row level security;

drop policy if exists "ler a propria assinatura" on public.assinaturas;
create policy "ler a propria assinatura" on public.assinaturas
  for select to authenticated using (auth.uid() = user_id);

-- Avisos da Kiwify já processados, para o mesmo aviso não contar duas vezes
create table if not exists public.pagamentos_processados (
  id text primary key,
  processado_em timestamptz not null default now()
);

alter table public.pagamentos_processados enable row level security;
-- Sem regras: o app não lê nem escreve aqui, só o servidor

-- Gasta uma recarga guardada. Devolve true se tinha recarga para usar.
create or replace function public.usar_recarga()
returns boolean
language sql
security definer
set search_path = public
as $$
  with usada as (
    update assinaturas
    set recargas = recargas - 1, atualizado_em = now()
    where user_id = auth.uid() and recargas > 0
    returning 1
  )
  select exists (select 1 from usada);
$$;

revoke all on function public.usar_recarga() from public, anon;
grant execute on function public.usar_recarga() to authenticated;

-- Acha a conta pelo e-mail usado na compra (só o servidor pode chamar)
create or replace function public.usuario_por_email(email_compra text)
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(trim(email_compra)) limit 1;
$$;

revoke all on function public.usuario_por_email(text) from public, anon, authenticated;
grant execute on function public.usuario_por_email(text) to service_role;
