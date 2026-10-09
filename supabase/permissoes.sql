-- ============================================================
-- Tira permissões que o app nunca usa (apagar tabela inteira, gatilhos e referências)
-- de quem visita o site, com ou sem login. Encontrado na auditoria de 09/10/2026.
-- Cole no Supabase em: SQL Editor > New query > Run. Pode rodar de novo sem problema.
-- ============================================================

revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- Tabelas criadas no futuro também nascem sem essas permissões
alter default privileges in schema public revoke truncate, references, trigger on tables from anon, authenticated;

-- Conferência: deve dar 0
select count(*) as permissoes_que_sobraram
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER');
