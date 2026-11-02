-- Shared comments (eval notebook + TB4 task browser) and private TB4
-- trajectories. Applied to the sebrusso Supabase project.
--
-- Access model (Seb's call): name-only login. Each person is a Supabase Auth
-- user whose password ships in the site bundle, so the name picks the account.
-- Nothing is readable without a signed-in member; anon gets no policies.

create table if not exists people (
  user_id uuid primary key references auth.users on delete cascade,
  who text not null unique check (who in ('seb', 'daniel')),
  display_name text not null
);

create or replace function current_who() returns text
language sql stable security definer set search_path = public as $$
  select who from people where user_id = auth.uid()
$$;
revoke execute on function current_who() from public, anon;
grant execute on function current_who() to authenticated;

-- ── Comments ────────────────────────────────────────────────────
-- slug: an eval slug, or 'tb4:<task>'; field_id: a notebook field id,
-- 'instruction', 'file:<path>' or 'trial:<trial id>'.
create table if not exists comments (
  id text primary key,                         -- client-generated, so offline copies merge by id
  slug text not null,
  field_id text not null,
  parent_id text references comments on delete cascade,
  quote text,
  body text not null check (length(body) between 1 and 10000),
  author text not null check (author in ('seb', 'daniel')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists comments_slug on comments (slug);

alter table people enable row level security;
alter table comments enable row level security;

create policy members_read on people for select to authenticated using (current_who() is not null);

create policy members_read on comments for select to authenticated using (current_who() is not null);
create policy own_insert on comments for insert to authenticated with check (author = current_who());
create policy own_delete on comments for delete to authenticated using (author = current_who());
-- Either person resolves or reopens any thread; bodies stay their author's.
create policy members_resolve on comments for update to authenticated
  using (current_who() is not null) with check (current_who() is not null);

create or replace function comments_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.body is distinct from old.body or new.quote is distinct from old.quote
     or new.author is distinct from old.author or new.slug is distinct from old.slug
     or new.field_id is distinct from old.field_id or new.parent_id is distinct from old.parent_id then
    if old.author is distinct from current_who() then
      raise exception 'only the author can edit a comment';
    end if;
  end if;
  return new;
end $$;
create trigger comments_guard before update on comments for each row execute function comments_guard();

-- ── TB4 trajectories (private copies of Harbor Hub transcripts) ──
create table if not exists tb4_trajectories (
  trial_id text primary key,
  task text not null,
  config_id text not null,
  outcome text not null,
  object_path text not null,      -- in the tb4-trajectories bucket, gzipped ATIF JSON
  size_bytes integer not null,    -- uncompressed
  steps integer,
  fetched_at timestamptz not null default now()
);
create index if not exists tb4_trajectories_task on tb4_trajectories (task);
alter table tb4_trajectories enable row level security;
create policy members_read on tb4_trajectories for select to authenticated using (current_who() is not null);
create policy members_write on tb4_trajectories for insert to authenticated with check (current_who() is not null);
create policy members_update on tb4_trajectories for update to authenticated using (current_who() is not null) with check (current_who() is not null);

insert into storage.buckets (id, name, public, file_size_limit)
values ('tb4-trajectories', 'tb4-trajectories', false, 52428800)
on conflict (id) do nothing;

create policy tb4_traj_read on storage.objects for select to authenticated
  using (bucket_id = 'tb4-trajectories' and public.current_who() is not null);
create policy tb4_traj_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'tb4-trajectories' and public.current_who() is not null);
create policy tb4_traj_update on storage.objects for update to authenticated
  using (bucket_id = 'tb4-trajectories' and public.current_who() is not null);
