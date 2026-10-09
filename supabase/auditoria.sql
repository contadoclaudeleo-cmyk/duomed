-- ============================================================
-- Auditoria de segurança (SÓ LEITURA: não muda nada).
-- Cole no Supabase em: SQL Editor > New query > Run.
-- Depois copie o resultado e mande para o Claude conferir.
-- ============================================================

-- 1) Tabelas do app: a proteção por linha (RLS) precisa estar "true" em todas
select 'tabela' as tipo, c.relname as nome, c.relrowsecurity::text as rls_ligado, '' as detalhe
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'

union all

-- 2) Regras de cada tabela (quem pode ler/escrever o quê)
select 'regra', tablename || ' / ' || policyname, cmd, coalesce(qual, '') || ' | ' || coalesce(with_check, '')
from pg_policies where schemaname = 'public'

union all

-- 3) Tabelas que o visitante sem login (anon) consegue acessar: o ideal é não aparecer nenhuma
select 'anon pode', table_name, privilege_type, ''
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'anon'

union all

-- 4) Funções que o visitante sem login consegue chamar: o ideal é não aparecer nenhuma
select 'funcao anon', p.proname, 'execute', ''
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')

order by 1, 2;
