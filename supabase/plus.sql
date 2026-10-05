-- ============================================================
-- DuoMed Plus (vidas infinitas) e pacotes de 50 vidas, vendidos pela Kiwify.
-- Cole tudo no Supabase em: SQL Editor > New query > Run.
--
-- Quem escreve nestas tabelas é só a função do servidor
-- (supabase/functions/kiwify-webhook), com a chave de serviço.
-- O app só LÊ a própria linha de "assinaturas": não consegue se dar Plus.
-- ============================================================

-- Situação de cada pessoa: até quando é Plus e quantas vidas compradas ainda não chegaram no app
create table if not exists public.assinaturas (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plano text,
  valido_ate timestamptz,
  vidas_compradas integer not null default 0,
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

-- Entrega as vidas compradas: devolve quantas eram e zera o saldo (o app soma nas vidas)
create or replace function public.resgatar_vidas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  quantas integer;
begin
  select vidas_compradas into quantas from assinaturas where user_id = auth.uid() for update;
  if quantas is null or quantas <= 0 then
    return 0;
  end if;
  update assinaturas set vidas_compradas = 0, atualizado_em = now() where user_id = auth.uid();
  return quantas;
end;
$$;

revoke all on function public.resgatar_vidas() from public, anon;
grant execute on function public.resgatar_vidas() to authenticated;

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
