-- ============================================================
-- Proteções extras no banco (contra trapaça e abuso).
-- Cole tudo no Supabase em: SQL Editor > New query > Run.
-- Pode rodar mais de uma vez sem problema.
-- ============================================================


-- 1) Tamanho máximo do progresso salvo (1 MB por pessoa).
--    Impede alguém de encher o banco mandando um arquivo gigante.
--    "not valid" = vale para tudo que for salvo daqui pra frente.
alter table public.progresso drop constraint if exists progresso_tamanho_maximo;
alter table public.progresso add constraint progresso_tamanho_maximo
  check (octet_length(dados::text) <= 1000000) not valid;


-- 2) No máximo 10 feedbacks por hora por pessoa (contra spam).
create or replace function public.limitar_feedbacks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from feedbacks
    where user_id = new.user_id and criado_em > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'limite de feedbacks por hora' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists limitar_feedbacks on public.feedbacks;
create trigger limitar_feedbacks
  before insert on public.feedbacks
  for each row execute function public.limitar_feedbacks();


-- 3) Ranking à prova de trapaça.
--    O XP fica salvo no aparelho, então alguém esperto poderia inventar um número.
--    Aqui o ranking conta no máximo 1500 XP por dia (≈ 60 lições, mais do que
--    qualquer pessoa faz de verdade) e corta nomes em 30 letras.
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
      left(coalesce(nullif(regexp_replace(trim(p.dados -> 'usuario' ->> 'nome'), '\s+', ' ', 'g'), ''), 'Estudante'), 30) as nome_completo,
      coalesce((
        -- O "case" garante que só converte o que tem formato válido; "least" aplica o teto diário
        select sum(least(case when d.value ~ '^\d{1,7}(\.\d+)?$' then d.value::numeric else 0 end, 1500))::integer
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

revoke all on function public.ranking_semanal() from public, anon;
grant execute on function public.ranking_semanal() to authenticated;


-- 4) Ninguém de fora (sem login) executa as funções internas.
revoke all on function public.limitar_feedbacks() from public, anon, authenticated;
