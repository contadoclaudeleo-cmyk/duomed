-- ============================================================
-- Consentimentos (LGPD): registro do aceite dos termos, da escolha
-- de cookies e do consentimento de marketing.
-- Cada mudança vira uma linha nova (histórico), com data e versão.
-- Não guardamos IP nem dados do aparelho: só o necessário.
-- Rodar uma vez no SQL Editor do Supabase.
-- ============================================================

create table if not exists public.consentimentos (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('termos', 'marketing', 'cookies')),
  aceito boolean not null,
  versao text not null,
  criado_em timestamptz not null default now()
);

create index if not exists consentimentos_user_idx on public.consentimentos (user_id, criado_em desc);

alter table public.consentimentos enable row level security;

-- Cada pessoa só registra e só lê os próprios consentimentos. Ninguém altera nem apaga
-- um registro antigo (a mudança de ideia entra como linha nova).
drop policy if exists "consentimento: ler o próprio" on public.consentimentos;
create policy "consentimento: ler o próprio" on public.consentimentos
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "consentimento: registrar o próprio" on public.consentimentos;
create policy "consentimento: registrar o próprio" on public.consentimentos
  for insert to authenticated with check (user_id = auth.uid());

revoke update, delete on public.consentimentos from anon, authenticated;

-- Última escolha de marketing de cada conta (para montar a lista de envio)
create or replace view public.marketing_atual
with (security_invoker = true) as
select distinct on (user_id) user_id, aceito, criado_em
from public.consentimentos
where tipo = 'marketing'
order by user_id, criado_em desc;

-- Descadastro pelo link do e-mail, sem precisar entrar na conta.
-- Só consegue DESLIGAR o marketing (nunca ligar) e não diz se o e-mail existe.
create or replace function public.descadastrar_marketing(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if v_id is not null then
    insert into public.consentimentos (user_id, tipo, aceito, versao)
    values (v_id, 'marketing', false, 'descadastro-email');
  end if;
end;
$$;

revoke all on function public.descadastrar_marketing(text) from public;
grant execute on function public.descadastrar_marketing(text) to anon, authenticated;
