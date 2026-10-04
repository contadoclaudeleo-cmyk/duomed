-- ============================================================
-- Ranking semanal com os jogadores que têm conta no DuoMed.
-- Cole tudo no Supabase em: SQL Editor > New query > Run.
--
-- Por que uma função: a tabela "progresso" tem RLS e cada pessoa só
-- lê a própria linha. Esta função roda com permissão do dono do banco
-- e devolve SÓ o necessário para o ranking: primeiro nome + inicial do
-- sobrenome e o XP da semana. Nenhum outro dado sai da tabela.
-- ============================================================

create or replace function public.ranking_semanal()
returns table (posicao bigint, nome text, xp integer, eh_voce boolean, participantes bigint)
language sql
stable
security definer
set search_path = public
as $$
  with semana as (
    -- Segunda-feira da semana atual, no horário de Brasília
    select date_trunc('week', now() at time zone 'America/Sao_Paulo')::date as inicio
  ),
  pontos as (
    select
      p.user_id,
      coalesce(nullif(regexp_replace(trim(p.dados -> 'usuario' ->> 'nome'), '\s+', ' ', 'g'), ''), 'Estudante') as nome_completo,
      coalesce((
        -- O "case" garante que só converte o que tem formato válido
        select sum(case when d.value ~ '^\d+(\.\d+)?$' then d.value::numeric else 0 end)::integer
        from jsonb_each_text(coalesce(p.dados -> 'xpPorDia', '{}'::jsonb)) d, semana s
        where (case when d.key ~ '^\d{4}-\d{2}-\d{2}$' then d.key::date end) between s.inicio and s.inicio + 6
      ), 0) as xp
    from progresso p
    where jsonb_typeof(p.dados -> 'usuario') = 'object'
  ),
  ordenado as (
    select
      user_id,
      nome_completo,
      xp,
      rank() over (order by xp desc) as posicao,
      count(*) filter (where xp > 0) over () as participantes
    from pontos
  )
  select
    o.posicao,
    -- "Maria Clara Souza" vira "Maria S."
    split_part(o.nome_completo, ' ', 1)
      || case
           when position(' ' in o.nome_completo) > 0
           then ' ' || left(split_part(o.nome_completo, ' ', array_length(string_to_array(o.nome_completo, ' '), 1)), 1) || '.'
           else ''
         end as nome,
    o.xp,
    o.user_id = auth.uid() as eh_voce,
    o.participantes
  from ordenado o
  where (o.posicao <= 50 and o.xp > 0) or o.user_id = auth.uid()
  order by o.posicao, o.nome_completo;
$$;

-- Só quem está logado pode ver o ranking
revoke all on function public.ranking_semanal() from public, anon;
grant execute on function public.ranking_semanal() to authenticated;
