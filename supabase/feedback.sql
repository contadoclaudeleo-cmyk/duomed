-- ============================================================
-- Feedbacks dos usuários (aba "Feedback" do app).
-- Cole tudo no Supabase em: SQL Editor > New query > Run.
--
-- Cada pessoa só envia e vê os próprios feedbacks.
-- Para ler todos, use o Table Editor do Supabase (tabela "feedbacks")
-- ou a consulta comentada no fim deste arquivo.
-- ============================================================

create table if not exists public.feedbacks (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('sugestao', 'problema', 'conteudo', 'elogio')),
  nota smallint check (nota between 1 and 5),
  mensagem text not null check (char_length(mensagem) between 3 and 2000),
  questao_id text,
  criado_em timestamptz not null default now()
);

alter table public.feedbacks enable row level security;

drop policy if exists "enviar o proprio feedback" on public.feedbacks;
create policy "enviar o proprio feedback" on public.feedbacks
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "ver os proprios feedbacks" on public.feedbacks;
create policy "ver os proprios feedbacks" on public.feedbacks
  for select to authenticated using (auth.uid() = user_id);

-- Para ler todos os feedbacks com o e-mail de quem mandou (rode no SQL Editor):
-- select f.criado_em, u.email, f.tipo, f.nota, f.mensagem
-- from feedbacks f join auth.users u on u.id = f.user_id
-- order by f.criado_em desc;
