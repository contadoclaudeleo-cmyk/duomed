-- ============================================================
-- DuoMed Plus (vidas infinitas) e recargas de vidas, pagos pelo Asaas.
-- Cole tudo no Supabase em: SQL Editor > New query > Run.
--
-- Quem escreve nestas tabelas são só as funções do servidor
-- (supabase/functions), que usam a chave de serviço. O app só LÊ
-- a própria linha de "assinaturas"; não consegue se dar Plus sozinho.
-- ============================================================

-- Situação de cada pessoa: até quando é Plus e quantas recargas tem guardadas
create table if not exists public.assinaturas (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plano text,
  valido_ate timestamptz,
  recargas integer not null default 0,
  ja_usou_promo boolean not null default false,
  asaas_cliente text,
  atualizado_em timestamptz not null default now()
);

alter table public.assinaturas enable row level security;

drop policy if exists "ler a propria assinatura" on public.assinaturas;
create policy "ler a propria assinatura" on public.assinaturas
  for select to authenticated using (auth.uid() = user_id);

-- Cada cobrança criada no Asaas (pagamento avulso ou assinatura) e de quem ela é
create table if not exists public.cobrancas (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('anual', 'mensal', 'promo', 'recarga')),
  criado_em timestamptz not null default now()
);

alter table public.cobrancas enable row level security;
-- Sem regras: o app não lê nem escreve aqui, só o servidor

-- Pagamentos já processados, para o mesmo aviso do Asaas não contar duas vezes
create table if not exists public.pagamentos_processados (
  id text primary key,
  processado_em timestamptz not null default now()
);

alter table public.pagamentos_processados enable row level security;

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
