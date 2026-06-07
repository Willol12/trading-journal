-- Segurança no nível do banco (Supabase) que NÃO é capturada pelo schema do Prisma.
-- Reaplicável (idempotente). Rodar no SQL Editor do Supabase se recriar o projeto.
--
-- Arquitetura: o app acessa dados via Prisma (role `postgres`, que BYPASSA RLS) e
-- filtra por userId no código (segurança ATIVA). As políticas abaixo são DEFESA EM
-- PROFUNDIDADE — só "mordem" se a Data API (PostgREST) for usada com o role authenticated.

-- 1) RLS por usuário nas tabelas de dados (Account, Instrument, JournalEntry, Setup, Tag, Trade)
--    Cada usuário só enxerga/escreve as próprias linhas (auth.uid() = userId).
do $$
declare t text;
begin
  foreach t in array array['Account','Instrument','JournalEntry','Setup','Tag','Trade'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "own_select" on %I', t);
    execute format('create policy "own_select" on %I for select to authenticated using ((select auth.uid())::text = "userId")', t);
    execute format('drop policy if exists "own_insert" on %I', t);
    execute format('create policy "own_insert" on %I for insert to authenticated with check ((select auth.uid())::text = "userId")', t);
    execute format('drop policy if exists "own_update" on %I', t);
    execute format('create policy "own_update" on %I for update to authenticated using ((select auth.uid())::text = "userId") with check ((select auth.uid())::text = "userId")', t);
    execute format('drop policy if exists "own_delete" on %I', t);
    execute format('create policy "own_delete" on %I for delete to authenticated using ((select auth.uid())::text = "userId")', t);
  end loop;
end $$;

-- 2) TradeTag herda o dono via Trade (não tem userId próprio).
alter table "TradeTag" enable row level security;
drop policy if exists "own_select" on "TradeTag";
create policy "own_select" on "TradeTag" for select to authenticated
  using (exists (select 1 from "Trade" t where t.id = "TradeTag"."tradeId" and t."userId" = (select auth.uid())::text));
drop policy if exists "own_insert" on "TradeTag";
create policy "own_insert" on "TradeTag" for insert to authenticated
  with check (exists (select 1 from "Trade" t where t.id = "TradeTag"."tradeId" and t."userId" = (select auth.uid())::text));
drop policy if exists "own_delete" on "TradeTag";
create policy "own_delete" on "TradeTag" for delete to authenticated
  using (exists (select 1 from "Trade" t where t.id = "TradeTag"."tradeId" and t."userId" = (select auth.uid())::text));

-- 3) Função do "automatic RLS" não deve ser chamável pela API pública.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- 4) Storage: bucket privado `trade-screenshots`, cada usuário só na própria pasta {uid}/.
drop policy if exists "own screenshots select" on storage.objects;
create policy "own screenshots select" on storage.objects for select to authenticated
  using ( bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = (select auth.uid())::text );
drop policy if exists "own screenshots insert" on storage.objects;
create policy "own screenshots insert" on storage.objects for insert to authenticated
  with check ( bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = (select auth.uid())::text );
drop policy if exists "own screenshots update" on storage.objects;
create policy "own screenshots update" on storage.objects for update to authenticated
  using ( bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = (select auth.uid())::text )
  with check ( bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = (select auth.uid())::text );
drop policy if exists "own screenshots delete" on storage.objects;
create policy "own screenshots delete" on storage.objects for delete to authenticated
  using ( bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = (select auth.uid())::text );
