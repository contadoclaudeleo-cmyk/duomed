-- ============================================================
-- Estudo protegido pelo servidor: questões, respostas, vidas e Plus.
-- Cole tudo no Supabase em: SQL Editor > New query > Run.
-- Pode rodar de novo sem problema (por exemplo, depois de uma atualização).
--
-- Como funciona:
--   * As questões ficam na tabela "questoes", que ninguém lê direto.
--   * Para estudar, o app pede uma lição (iniciar_licao). O servidor confere
--     se a pessoa tem vidas ou é Plus e devolve as questões SEM a resposta.
--   * A cada resposta, o app manda o que a pessoa marcou (responder). Quem
--     corrige é o servidor, que também tira a vida quando a pessoa erra.
--   * As vidas e o Plus moram no servidor. Mexer no celular não muda nada.
-- ============================================================

-- ---------- Tabelas ----------

-- Questões completas (com resposta e explicação). Entram pelos arquivos
-- supabase/importar/questoes-N.sql (ver supabase/LEIA-ME-ESTUDO.md).
create table if not exists public.questoes (
  id text primary key,
  materia_id text not null,
  licao_id text not null,
  nivel text not null default 'facil',
  ordem integer not null default 0,
  dados jsonb not null
);
create index if not exists questoes_licao on public.questoes (licao_id, ordem);
create index if not exists questoes_nivel on public.questoes (nivel, materia_id);

-- Vidas de cada pessoa
create table if not exists public.vidas (
  user_id uuid primary key references auth.users (id) on delete cascade,
  vidas integer not null,
  ultima_recarga timestamptz not null default now()
);

-- Cada lição, revisão ou teste aberto, com as questões que fazem parte dele
create table if not exists public.sessoes_estudo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('licao', 'revisao', 'nivelamento')),
  licao_id text,
  questoes text[] not null,
  respondidas text[] not null default '{}',
  criada_em timestamptz not null default now()
);
create index if not exists sessoes_estudo_usuario on public.sessoes_estudo (user_id, criada_em);

-- Questões que a pessoa já respondeu (só essas podem voltar na revisão e no gabarito)
create table if not exists public.questoes_vistas (
  user_id uuid not null references auth.users (id) on delete cascade,
  questao_id text not null,
  vista_em timestamptz not null default now(),
  primary key (user_id, questao_id)
);

-- Ninguém lê nem escreve nessas tabelas direto: só pelas funções abaixo
alter table public.questoes enable row level security;
alter table public.vidas enable row level security;
alter table public.sessoes_estudo enable row level security;
alter table public.questoes_vistas enable row level security;
revoke all on public.questoes, public.vidas, public.sessoes_estudo, public.questoes_vistas from anon, authenticated;

-- ---------- Funções internas (o app não chama estas) ----------

-- Regras das vidas (as mesmas de src/lib/vidas.ts):
-- máximo 5, 1 vida a cada 15 minutos, 10 vidas para quem começa,
-- vidas compradas somam e podem passar de 5.
create or replace function public._vidas_atualizar(p_user uuid, out o_vidas integer, out o_ultima timestamptz, out o_recebidas integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agora timestamptz := now();
  v_recargas integer;
begin
  insert into vidas (user_id, vidas, ultima_recarga) values (p_user, 10, v_agora) on conflict (user_id) do nothing;
  select vidas, ultima_recarga into o_vidas, o_ultima from vidas where user_id = p_user for update;

  if o_vidas >= 5 then
    o_ultima := v_agora;
  else
    v_recargas := floor(extract(epoch from (v_agora - o_ultima)) / 900);
    if v_recargas > 0 then
      o_vidas := least(5, o_vidas + v_recargas);
      o_ultima := case when o_vidas >= 5 then v_agora else o_ultima + make_interval(secs => v_recargas * 900) end;
    end if;
  end if;

  -- Vidas compradas na Kiwify (o aviso de pagamento soma em assinaturas.vidas_compradas)
  select coalesce(vidas_compradas, 0) into o_recebidas from assinaturas where user_id = p_user for update;
  o_recebidas := coalesce(o_recebidas, 0);
  if o_recebidas > 0 then
    o_vidas := o_vidas + o_recebidas;
    update assinaturas set vidas_compradas = 0, atualizado_em = v_agora where user_id = p_user;
  end if;

  update vidas set vidas = o_vidas, ultima_recarga = o_ultima where user_id = p_user;
end;
$$;

create or replace function public._eh_plus(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from assinaturas where user_id = p_user and valido_ate > now());
$$;

-- Situação das vidas e do Plus, no formato que o app usa (datas em milissegundos)
create or replace function public._situacao(p_user uuid, p_recebidas integer default 0)
returns jsonb
language sql
volatile
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'vidas', v.vidas,
    'ultimaRecarga', floor(extract(epoch from v.ultima_recarga) * 1000),
    'plusAte', (select floor(extract(epoch from a.valido_ate) * 1000) from assinaturas a where a.user_id = p_user and a.valido_ate > now()),
    'recebidas', p_recebidas
  )
  from vidas v where v.user_id = p_user;
$$;

-- Questão sem a resposta e sem a explicação (é o que vai para o app antes de responder).
-- Em "associar pares", a coluna da direita vai embaralhada, para não entregar os pares.
create or replace function public._questao_publica(p_dados jsonb)
returns jsonb
language sql
volatile
security definer
set search_path = public
as $$
  select case
    when p_dados ->> 'tipo' = 'associar_pares' then
      (p_dados - 'resposta' - 'explicacao' - 'pares') || jsonb_build_object('pares', (
        select coalesce(jsonb_agg(jsonb_build_object('esquerda', e.esq, 'direita', d.dir) order by e.n), '[]'::jsonb)
        from (select p ->> 'esquerda' as esq, row_number() over () as n from jsonb_array_elements(p_dados -> 'pares') p) e
        join (select p ->> 'direita' as dir, row_number() over (order by random()) as n from jsonb_array_elements(p_dados -> 'pares') p) d
          using (n)
      ))
    else p_dados - 'resposta' - 'explicacao'
  end;
$$;

-- Corrige a resposta (as mesmas regras de src/lib/correcao.ts)
create or replace function public._corrigir(p_dados jsonb, p_resposta jsonb)
returns boolean
language plpgsql
immutable
security definer
set search_path = public
as $$
begin
  if p_resposta is null or jsonb_typeof(p_resposta) = 'null' then
    return false;
  end if;
  if p_dados ->> 'tipo' = 'verdadeiro_falso' then
    return jsonb_typeof(p_resposta) = 'boolean' and p_resposta = p_dados -> 'resposta';
  end if;
  if p_dados ->> 'tipo' = 'associar_pares' then
    if jsonb_typeof(p_resposta) <> 'object' then
      return false;
    end if;
    return not exists (
      select 1 from jsonb_array_elements(p_dados -> 'pares') p
      where (p_resposta ->> (p ->> 'esquerda')) is distinct from (p ->> 'direita')
    );
  end if;
  return jsonb_typeof(p_resposta) = 'string' and (p_resposta #>> '{}') = (p_dados ->> 'resposta');
end;
$$;

-- Cria a sessão e devolve as questões sem resposta
create or replace function public._abrir_sessao(p_user uuid, p_tipo text, p_licao text, p_ids text[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sessao uuid;
begin
  insert into sessoes_estudo (user_id, tipo, licao_id, questoes)
  values (p_user, p_tipo, p_licao, p_ids)
  returning id into v_sessao;

  return jsonb_build_object(
    'sessao', v_sessao,
    'questoes', (
      select coalesce(jsonb_agg(jsonb_build_object('questao', _questao_publica(q.dados), 'materiaId', q.materia_id) order by i.pos), '[]'::jsonb)
      from unnest(p_ids) with ordinality as i (id, pos)
      join questoes q on q.id = i.id
    )
  );
end;
$$;

-- ---------- Funções que o app chama ----------

-- Vidas e Plus de agora (também entrega as vidas compradas)
create or replace function public.estado_vidas()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v record;
begin
  if v_user is null then
    raise exception 'sem_login';
  end if;
  select * into v from _vidas_atualizar(v_user);
  return _situacao(v_user, v.o_recebidas);
end;
$$;

-- Abre uma lição da trilha. Sem vidas (e sem Plus), o servidor recusa.
create or replace function public.iniciar_licao(p_licao text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ids text[];
  v record;
  v_resultado jsonb;
begin
  if v_user is null then
    raise exception 'sem_login';
  end if;
  select array_agg(id order by ordem) into v_ids from questoes where licao_id = p_licao;
  if v_ids is null then
    raise exception 'licao_inexistente';
  end if;

  select * into v from _vidas_atualizar(v_user);
  if v.o_vidas <= 0 and not _eh_plus(v_user) then
    raise exception 'sem_vidas';
  end if;

  v_resultado := _abrir_sessao(v_user, 'licao', p_licao, v_ids);
  return v_resultado || jsonb_build_object('situacao', _situacao(v_user, v.o_recebidas));
end;
$$;

-- Abre a revisão. Só entram questões que a pessoa já respondeu antes.
create or replace function public.iniciar_revisao(p_ids text[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ids text[];
begin
  if v_user is null then
    raise exception 'sem_login';
  end if;
  select array_agg(i.id order by i.pos) into v_ids
  from (select * from unnest(p_ids[1:30]) with ordinality as u (id, pos)) i
  where exists (select 1 from questoes_vistas qv where qv.user_id = v_user and qv.questao_id = i.id)
    and exists (select 1 from questoes q where q.id = i.id);
  if v_ids is null then
    raise exception 'nada_para_revisar';
  end if;
  return _abrir_sessao(v_user, 'revisao', null, v_ids);
end;
$$;

-- Teste de nível: 8 questões sorteadas da trilha difícil, de matérias variadas.
-- No máximo 3 testes por dia (o teste não gasta vida).
create or replace function public.iniciar_nivelamento()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ids text[];
begin
  if v_user is null then
    raise exception 'sem_login';
  end if;
  if (select count(*) from sessoes_estudo where user_id = v_user and tipo = 'nivelamento' and criada_em > now() - interval '1 day') >= 3 then
    raise exception 'limite_teste';
  end if;
  select array_agg(id) into v_ids from (
    select id from (
      select id, row_number() over (partition by materia_id order by random()) as rodada
      from questoes where nivel = 'dificil'
    ) s
    order by rodada, random()
    limit 8
  ) t;
  if v_ids is null then
    raise exception 'sem_questoes';
  end if;
  return _abrir_sessao(v_user, 'nivelamento', null, v_ids);
end;
$$;

-- Responde uma questão. O servidor corrige, tira a vida se errou numa lição
-- e devolve a questão completa (com resposta e explicação) para o feedback.
create or replace function public.responder(p_sessao uuid, p_questao text, p_resposta jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  s sessoes_estudo;
  v_dados jsonb;
  v_certo boolean;
  v_plus boolean;
  v record;
begin
  if v_user is null then
    raise exception 'sem_login';
  end if;
  select * into s from sessoes_estudo where id = p_sessao and user_id = v_user for update;
  if not found then
    raise exception 'sessao_invalida';
  end if;
  if s.criada_em < now() - interval '12 hours' then
    raise exception 'sessao_expirada';
  end if;
  if not (p_questao = any (s.questoes)) then
    raise exception 'questao_fora_da_sessao';
  end if;
  if p_questao = any (s.respondidas) then
    raise exception 'ja_respondida';
  end if;

  select dados into v_dados from questoes where id = p_questao;
  v_plus := _eh_plus(v_user);
  select * into v from _vidas_atualizar(v_user);

  -- Lição sem vidas não continua
  if s.tipo = 'licao' and not v_plus and v.o_vidas <= 0 then
    raise exception 'sem_vidas';
  end if;

  v_certo := _corrigir(v_dados, p_resposta);

  update sessoes_estudo set respondidas = respondidas || p_questao where id = p_sessao;
  insert into questoes_vistas (user_id, questao_id) values (v_user, p_questao) on conflict do nothing;

  -- Errou numa lição e não é Plus: perde 1 vida (se estava cheio, o relógio da recarga começa agora)
  if s.tipo = 'licao' and not v_plus and not v_certo then
    update vidas
    set vidas = greatest(0, v.o_vidas - 1),
        ultima_recarga = case when v.o_vidas >= 5 then now() else v.o_ultima end
    where user_id = v_user;
  end if;

  return jsonb_build_object('acertou', v_certo, 'questao', v_dados, 'situacao', _situacao(v_user, v.o_recebidas));
end;
$$;

-- Gabarito comentado de uma lição: só as questões que a pessoa já respondeu
create or replace function public.gabarito_licao(p_licao text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'sem_login';
  end if;
  return (
    select coalesce(jsonb_agg(q.dados order by q.ordem), '[]'::jsonb)
    from questoes q
    join questoes_vistas qv on qv.questao_id = q.id and qv.user_id = v_user
    where q.licao_id = p_licao
  );
end;
$$;

-- Painel do admin: ver a questão completa de um "Reportar erro"
create or replace function public.admin_questao(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not eh_admin() then
    raise exception 'sem_permissao';
  end if;
  return (select dados from questoes where id = p_id);
end;
$$;

-- As vidas compradas agora entram direto no servidor (estado_vidas).
-- Esta função antiga continua existindo só para versões antigas do app, sem entregar nada.
create or replace function public.resgatar_vidas()
returns integer
language sql
security definer
set search_path = public
as $$
  select 0;
$$;

-- ---------- Quem pode chamar o quê ----------

revoke all on function public._vidas_atualizar(uuid) from public, anon, authenticated;
revoke all on function public._eh_plus(uuid) from public, anon, authenticated;
revoke all on function public._situacao(uuid, integer) from public, anon, authenticated;
revoke all on function public._questao_publica(jsonb) from public, anon, authenticated;
revoke all on function public._corrigir(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public._abrir_sessao(uuid, text, text, text[]) from public, anon, authenticated;

revoke all on function public.estado_vidas() from public, anon;
revoke all on function public.iniciar_licao(text) from public, anon;
revoke all on function public.iniciar_revisao(text[]) from public, anon;
revoke all on function public.iniciar_nivelamento() from public, anon;
revoke all on function public.responder(uuid, text, jsonb) from public, anon;
revoke all on function public.gabarito_licao(text) from public, anon;
revoke all on function public.admin_questao(text) from public, anon;
revoke all on function public.resgatar_vidas() from public, anon;

grant execute on function public.estado_vidas() to authenticated;
grant execute on function public.iniciar_licao(text) to authenticated;
grant execute on function public.iniciar_revisao(text[]) to authenticated;
grant execute on function public.iniciar_nivelamento() to authenticated;
grant execute on function public.responder(uuid, text, jsonb) to authenticated;
grant execute on function public.gabarito_licao(text) to authenticated;
grant execute on function public.admin_questao(text) to authenticated;
grant execute on function public.resgatar_vidas() to authenticated;

-- Limpeza: sessões com mais de 7 dias não servem mais
delete from public.sessoes_estudo where criada_em < now() - interval '7 days';
