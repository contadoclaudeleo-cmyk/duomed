-- ============================================================
-- Painel do administrador (tela "Painel" dentro do app).
-- Rode DEPOIS de estatisticas.sql e feedback.sql.
-- Cole tudo no Supabase em: SQL Editor > New query > Run.
--
-- Só quem está na tabela "admins" consegue usar as funções abaixo.
-- Cada função confere isso no servidor; para os outros, devolve erro.
-- ============================================================

-- Quem é administrador (pelo e-mail da conta no DuoMed)
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;
-- Sem regras: ninguém lê nem altera pelo app

-- >>> TROQUE pelo e-mail que você usa para entrar no DuoMed <<<
insert into public.admins (email) values ('SEU_EMAIL_AQUI') on conflict do nothing;

create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;
revoke all on function public.eh_admin() from public, anon;
grant execute on function public.eh_admin() to authenticated;

-- Histórico por hora: em quais horas cada pessoa estava com o app aberto
create table if not exists public.presenca_horas (
  user_id uuid not null references auth.users (id) on delete cascade,
  hora timestamptz not null,
  primary key (user_id, hora)
);
alter table public.presenca_horas enable row level security;

-- registrar_acesso agora também marca a hora (substitui a versão de estatisticas.sql)
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
  insert into presenca_horas (user_id, hora) values (auth.uid(), date_trunc('hour', now()))
    on conflict do nothing;
end;
$$;

-- ---------- Funções do painel (só admin) ----------

create or replace function public.admin_resumo()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if not eh_admin() then
    raise exception 'acesso negado';
  end if;
  return json_build_object(
    'online_agora', (select count(*) from presenca where visto_em > now() - interval '3 minutes'),
    'entraram_hoje', (select count(*) from acessos_diarios where dia = hoje),
    'contas_novas_hoje', (select count(*) from auth.users where (created_at at time zone 'America/Sao_Paulo')::date = hoje),
    'contas_total', (select count(*) from auth.users),
    'plus_ativos', (select count(*) from assinaturas where valido_ate > now()),
    'feedbacks_total', (select count(*) from feedbacks)
  );
end;
$$;

create or replace function public.admin_por_dia()
returns table (dia date, jogadores bigint, contas_novas bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not eh_admin() then
    raise exception 'acesso negado';
  end if;
  return query
  with dias as (
    select g::date as d
    from generate_series(
      ((now() at time zone 'America/Sao_Paulo')::date - 29)::timestamp,
      (now() at time zone 'America/Sao_Paulo')::date::timestamp,
      interval '1 day'
    ) as g
  )
  select
    dias.d,
    (select count(*) from acessos_diarios a where a.dia = dias.d),
    (select count(*) from auth.users u where (u.created_at at time zone 'America/Sao_Paulo')::date = dias.d)
  from dias
  order by dias.d;
end;
$$;

-- Média de pessoas online por dia da semana (0 = domingo) e hora, nas últimas 4 semanas
create or replace function public.admin_horarios()
returns table (dia_semana int, hora int, media numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not eh_admin() then
    raise exception 'acesso negado';
  end if;
  return query
  select
    extract(dow from h.hora at time zone 'America/Sao_Paulo')::int,
    extract(hour from h.hora at time zone 'America/Sao_Paulo')::int,
    round(count(*)::numeric / 4, 1)
  from presenca_horas h
  where h.hora > now() - interval '28 days'
  group by 1, 2;
end;
$$;

create or replace function public.admin_feedbacks()
returns table (id bigint, criado_em timestamptz, email text, nome text, tipo text, nota smallint, mensagem text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not eh_admin() then
    raise exception 'acesso negado';
  end if;
  return query
  select f.id, f.criado_em, u.email::text, (p.dados -> 'usuario' ->> 'nome')::text, f.tipo, f.nota, f.mensagem
  from feedbacks f
  join auth.users u on u.id = f.user_id
  left join progresso p on p.user_id = f.user_id
  order by f.criado_em desc
  limit 200;
end;
$$;

create or replace function public.admin_online()
returns table (email text, nome text, visto_em timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not eh_admin() then
    raise exception 'acesso negado';
  end if;
  return query
  select u.email::text, (p.dados -> 'usuario' ->> 'nome')::text, pr.visto_em
  from presenca pr
  join auth.users u on u.id = pr.user_id
  left join progresso p on p.user_id = pr.user_id
  where pr.visto_em > now() - interval '3 minutes'
  order by pr.visto_em desc;
end;
$$;

revoke all on function public.admin_resumo() from public, anon;
revoke all on function public.admin_por_dia() from public, anon;
revoke all on function public.admin_horarios() from public, anon;
revoke all on function public.admin_feedbacks() from public, anon;
revoke all on function public.admin_online() from public, anon;
grant execute on function public.admin_resumo() to authenticated;
grant execute on function public.admin_por_dia() to authenticated;
grant execute on function public.admin_horarios() to authenticated;
grant execute on function public.admin_feedbacks() to authenticated;
grant execute on function public.admin_online() to authenticated;
