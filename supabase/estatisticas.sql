-- ============================================================
-- Estatísticas de uso: quem está online agora e quantos entraram por dia.
-- Cole tudo no Supabase em: SQL Editor > New query > Run.
--
-- O app chama "registrar_acesso()" ao abrir e a cada minuto enquanto
-- está aberto. Os números ficam no esquema "painel", que NÃO aparece
-- para o app (só para você, no painel do Supabase).
-- Para ver: Table Editor > troque o "schema" para "painel",
-- ou rode no SQL Editor:  select * from painel.resumo;
-- ============================================================

-- Último sinal de vida de cada pessoa (para saber quem está online)
create table if not exists public.presenca (
  user_id uuid primary key references auth.users (id) on delete cascade,
  visto_em timestamptz not null default now()
);
alter table public.presenca enable row level security;

-- Um registro por pessoa por dia em que ela abriu o app
create table if not exists public.acessos_diarios (
  user_id uuid not null references auth.users (id) on delete cascade,
  dia date not null,
  primeiro_acesso timestamptz not null default now(),
  primary key (user_id, dia)
);
alter table public.acessos_diarios enable row level security;
-- Sem regras nas duas tabelas: o app só escreve pela função abaixo

create or replace function public.registrar_acesso()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  insert into presenca (user_id, visto_em) values (auth.uid(), now())
    on conflict (user_id) do update set visto_em = excluded.visto_em;
  insert into acessos_diarios (user_id, dia) values (auth.uid(), (now() at time zone 'America/Sao_Paulo')::date)
    on conflict do nothing;
end;
$$;

revoke all on function public.registrar_acesso() from public, anon;
grant execute on function public.registrar_acesso() to authenticated;

-- ---------- Painel (só você vê, pelo Supabase) ----------
create schema if not exists painel;
revoke all on schema painel from public, anon, authenticated;

-- Números de agora
create or replace view painel.resumo as
select
  (select count(*) from public.presenca where visto_em > now() - interval '3 minutes') as online_agora,
  (select count(*) from public.acessos_diarios where dia = (now() at time zone 'America/Sao_Paulo')::date) as entraram_hoje,
  (select count(*) from auth.users
     where (created_at at time zone 'America/Sao_Paulo')::date = (now() at time zone 'America/Sao_Paulo')::date) as contas_novas_hoje,
  (select count(*) from auth.users) as contas_total;

-- Últimos 30 dias: quantos jogaram e quantas contas foram criadas em cada dia
create or replace view painel.por_dia as
with dias as (
  select g::date as dia
  from generate_series(
    ((now() at time zone 'America/Sao_Paulo')::date - 29)::timestamp,
    (now() at time zone 'America/Sao_Paulo')::date::timestamp,
    interval '1 day'
  ) as g
)
select
  d.dia,
  (select count(*) from public.acessos_diarios a where a.dia = d.dia) as jogadores,
  (select count(*) from auth.users u where (u.created_at at time zone 'America/Sao_Paulo')::date = d.dia) as contas_novas
from dias d
order by d.dia desc;

-- Quem está online agora (e-mail, nome no app e há quanto tempo deu sinal)
create or replace view painel.online_agora as
select
  u.email,
  p.dados -> 'usuario' ->> 'nome' as nome,
  pr.visto_em at time zone 'America/Sao_Paulo' as visto_em
from public.presenca pr
join auth.users u on u.id = pr.user_id
left join public.progresso p on p.user_id = pr.user_id
where pr.visto_em > now() - interval '3 minutes'
order by pr.visto_em desc;
