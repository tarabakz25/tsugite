-- Agent RAG should use Supabase HTTP/RPC instead of direct Postgres connections.

drop policy if exists "shops_select_agent_access" on public.shops;
create policy "shops_select_agent_access"
  on public.shops
  for select
  to authenticated
  using (exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and shops.id = any(p.organization_ids)
  ));

drop policy if exists "interviews_select_agent_access" on public.interviews;
create policy "interviews_select_agent_access"
  on public.interviews
  for select
  to authenticated
  using (exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and interviews.shop_id = any(p.organization_ids)
  ));

drop policy if exists "tacit_tags_select_agent_access" on public.tacit_tags;
create policy "tacit_tags_select_agent_access"
  on public.tacit_tags
  for select
  to authenticated
  using (exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and tacit_tags.shop_id = any(p.organization_ids)
  ));

drop policy if exists "tag_embeddings_select_agent_access" on public.tag_embeddings;
create policy "tag_embeddings_select_agent_access"
  on public.tag_embeddings
  for select
  to authenticated
  using (exists (
    select 1
    from public.tacit_tags t
    join public.profiles p on p.id = (select auth.uid())
    where t.id = tag_embeddings.tag_id
      and t.shop_id = any(p.organization_ids)
  ));

create or replace function public.match_tacit_tags_for_agent(
  target_shop_id uuid,
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id uuid,
  interview_id uuid,
  situation text,
  judgment text,
  reason text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    tt.id,
    tt.interview_id,
    tt.situation,
    tt.judgment,
    tt.reason,
    1 - (te.embedding <=> query_embedding) as similarity
  from public.tacit_tags tt
  inner join public.tag_embeddings te on tt.id = te.tag_id
  where tt.shop_id = target_shop_id
  order by te.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function public.match_tacit_tags_for_agent(uuid, vector, int) to authenticated;
