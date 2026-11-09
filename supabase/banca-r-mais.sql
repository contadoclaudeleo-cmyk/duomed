-- Separa as provas de R+ (pré-requisito) das de acesso direto no treino por prova.
-- A coluna "banca" passa a valer "ENARE R+" para as questões de R+ e continua "ENARE" para as de acesso direto.
-- Rode UMA vez no SQL Editor do Supabase. As porcentagens de acerto antigas continuam valendo (são calculadas na hora).
alter table public.questoes drop column if exists banca;
alter table public.questoes add column banca text
  generated always as (
    nullif(regexp_replace(coalesce(dados ->> 'fonte', ''), '\s+(19|20)[0-9]{2}.*$', ''), '')
    || case when nullif(regexp_replace(coalesce(dados ->> 'fonte', ''), '\s+(19|20)[0-9]{2}.*$', ''), '') is not null
              and coalesce(dados ->> 'fonte', '') ~ '\sR\+\s*$' then ' R+' else '' end
  ) stored;
create index if not exists questoes_materia_banca on public.questoes (materia_id, banca);
