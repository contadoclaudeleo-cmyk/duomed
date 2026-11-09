-- Envio dos lembretes: segredos, funções do servidor e agendamento diário (19h de Brasília = 22h UTC).
-- As chaves (VAPID e senha do agendador) são gravadas à parte, fora do Git: veja supabase/vapid-privada.txt.
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.segredos_lembretes (
  nome text primary key,
  valor text not null
);
alter table public.segredos_lembretes enable row level security;
revoke all on public.segredos_lembretes from anon, authenticated;

-- Quem aceitou lembretes e ainda não estudou hoje
create or replace function public.lembretes_pendentes()
returns table (endpoint text, p256dh text, auth text)
language sql security definer set search_path = public as $$
  select p.endpoint, p.p256dh, p.auth
  from push_assinaturas p
  where not exists (
    select 1 from xp_dias x
    where x.user_id = p.user_id
      and x.dia = (now() at time zone 'America/Sao_Paulo')::date
      and x.xp > 0
  );
$$;

create or replace function public.lembretes_remover(p_endpoints text[])
returns void language sql security definer set search_path = public as $$
  delete from push_assinaturas where endpoint = any (p_endpoints);
$$;

create or replace function public.lembretes_segredos()
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_object_agg(nome, valor) from segredos_lembretes;
$$;

revoke all on function public.lembretes_pendentes(), public.lembretes_remover(text[]), public.lembretes_segredos() from public, anon, authenticated;
grant execute on function public.lembretes_pendentes(), public.lembretes_remover(text[]), public.lembretes_segredos() to service_role;

select cron.unschedule('lembrete-diario') where exists (select 1 from cron.job where jobname = 'lembrete-diario');
select cron.schedule('lembrete-diario', '0 22 * * *', $cron$
  select net.http_post(
    url := 'https://dkdizfpywyvpxhfpiivr.supabase.co/functions/v1/enviar-lembretes',
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'x-cron-secret', (select valor from public.segredos_lembretes where nome = 'cron')),
    body := '{}'::jsonb
  );
$cron$);
