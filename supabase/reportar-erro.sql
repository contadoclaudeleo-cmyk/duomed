-- ============================================================
-- "Reportar erro" nas questões: guarda qual questão foi reportada.
-- Rode DEPOIS de feedback.sql e admin.sql.
-- Cole tudo no Supabase em: SQL Editor > New query > Run.
-- ============================================================

alter table public.feedbacks add column if not exists questao_id text;

-- O painel passa a devolver também o id da questão reportada
drop function if exists public.admin_feedbacks();

create or replace function public.admin_feedbacks()
returns table (
  id bigint,
  criado_em timestamptz,
  email text,
  nome text,
  tipo text,
  nota smallint,
  mensagem text,
  questao_id text
)
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
  select f.id, f.criado_em, u.email::text, (p.dados -> 'usuario' ->> 'nome')::text, f.tipo, f.nota, f.mensagem, f.questao_id
  from feedbacks f
  join auth.users u on u.id = f.user_id
  left join progresso p on p.user_id = f.user_id
  order by f.criado_em desc
  limit 200;
end;
$$;

revoke all on function public.admin_feedbacks() from public, anon;
grant execute on function public.admin_feedbacks() to authenticated;
