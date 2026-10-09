-- ============================================================
-- Rode UMA VEZ, depois de estudo.sql e depois de importar as questões.
-- Cole no Supabase em: SQL Editor > New query > Run.
--
-- Traz para o servidor o que cada pessoa já tinha feito antes desta versão:
--   * as questões que ela já respondeu (para a revisão e o gabarito continuarem);
--   * as vidas que ela tinha (até 100, para não perder pacotes comprados);
--   * o XP desta semana, para o ranking não zerar no meio da semana.
-- ============================================================

-- Questões que estavam na fila de revisão de cada pessoa
insert into public.questoes_vistas (user_id, questao_id)
select p.user_id, k
from public.progresso p
cross join lateral jsonb_object_keys(case when jsonb_typeof(p.dados -> 'filaRevisao') = 'object' then p.dados -> 'filaRevisao' else '{}'::jsonb end) k
where exists (select 1 from public.questoes q where q.id = k)
on conflict do nothing;

-- Questões das lições que cada pessoa já concluiu
insert into public.questoes_vistas (user_id, questao_id)
select p.user_id, q.id
from public.progresso p
cross join lateral jsonb_object_keys(case when jsonb_typeof(p.dados -> 'licoesConcluidas') = 'object' then p.dados -> 'licoesConcluidas' else '{}'::jsonb end) l
join public.questoes q on q.licao_id = l
on conflict do nothing;

-- Vidas que cada pessoa tinha no aparelho (entre 0 e 100)
insert into public.vidas (user_id, vidas, ultima_recarga)
select p.user_id,
       least(100, greatest(0, case when (p.dados ->> 'vidas') ~ '^\d{1,4}$' then (p.dados ->> 'vidas')::integer else 5 end)),
       now()
from public.progresso p
on conflict (user_id) do nothing;

-- XP desta semana para o ranking (no máximo 500 por dia, para não trazer números inventados)
insert into public.xp_dias (user_id, dia, xp)
select user_id, dia, xp from (
  select p.user_id,
         -- o "case" garante que só converte o que tem formato válido
         case when d.key ~ '^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$' then d.key::date end as dia,
         case when d.value ~ '^\d{1,6}(\.\d+)?$' then least(500, floor(d.value::numeric)::integer) else 0 end as xp
  from public.progresso p
  cross join lateral jsonb_each_text(case when jsonb_typeof(p.dados -> 'xpPorDia') = 'object' then p.dados -> 'xpPorDia' else '{}'::jsonb end) d
) t
where dia >= date_trunc('week', now() at time zone 'America/Sao_Paulo')::date and xp > 0
on conflict (user_id, dia) do nothing;
