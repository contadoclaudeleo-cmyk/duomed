-- ============================================================
-- Proteção da tabela "progresso" (o progresso de cada pessoa).
-- Cole no Supabase em: SQL Editor > New query > Run.
-- Pode rodar mais de uma vez sem problema.
--
-- Garante que cada pessoa só lê, salva e apaga a PRÓPRIA linha,
-- e que visitantes sem login não acessam nada.
-- ============================================================

alter table public.progresso enable row level security;

revoke all on public.progresso from anon;

drop policy if exists "ler o proprio progresso" on public.progresso;
create policy "ler o proprio progresso" on public.progresso
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "criar o proprio progresso" on public.progresso;
create policy "criar o proprio progresso" on public.progresso
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "alterar o proprio progresso" on public.progresso;
create policy "alterar o proprio progresso" on public.progresso
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "apagar o proprio progresso" on public.progresso;
create policy "apagar o proprio progresso" on public.progresso
  for delete to authenticated using (auth.uid() = user_id);
