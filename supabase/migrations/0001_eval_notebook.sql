-- Eval Notebook schema (design doc milestone 2). Not applied yet.
--
-- Rules this file enforces:
--   * Nothing is readable without a signed-in Seb or Daniel (RLS, no anon policies).
--   * AI never writes a live field. Claude Code and the weekly job call
--     stage_ai_value(), which only inserts a 'staged' proposal; a value goes
--     live when Seb accepts it (accept_proposal) — the weekly gate.
--   * Every value change appends to field_history (trigger), whoever made it.

create type author_kind as enum ('ai', 'seb', 'daniel');
create type confidence_kind as enum ('Confirmed', 'Reported', 'Inferred');
create type proposal_status as enum ('staged', 'accepted', 'rejected');

create table people (
  user_id uuid primary key references auth.users on delete cascade,
  who author_kind not null unique check (who <> 'ai'),
  display_name text not null,
  aliases text[] not null default '{}'
);

create table template_fields (
  template_version int not null,
  key text not null,
  section text not null,
  label text not null,
  answer_type text not null,         -- bool | enum | multi | int | number | percent | date | name | short
  options text[],
  unit text,
  notes_guide text not null default '',
  format text,
  fill text not null check (fill in ('ai', 'human')),
  position int not null,
  primary key (template_version, key)
);

create table evals (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  template_version int not null,
  cost_unit text,
  summary jsonb not null default '{}',
  created_by author_kind not null,
  created_at timestamptz not null default now(),
  archived boolean not null default false
);

create table fields (
  id uuid primary key default gen_random_uuid(),
  eval_id uuid not null references evals on delete cascade,
  key text not null,
  section text not null,
  label text not null,
  answer_type text not null default 'short',
  options text[],
  unit text,
  notes_guide text not null default '',
  format text,
  fill text not null default 'human',
  position int not null,
  value text not null default '',     -- the short answer, formatted per answer_type
  notes text not null default '',     -- longer Markdown, collapsed in the UI
  sources text[] not null default '{}',
  confidence confidence_kind,
  author author_kind,
  updated_at timestamptz,
  checked_by author_kind check (checked_by <> 'ai'),
  origin text not null default 'template' check (origin in ('template', 'custom')),
  deleted_at timestamptz,
  unique (eval_id, key)
);

create table field_history (
  id bigint generated always as identity primary key,
  field_id uuid not null references fields on delete cascade,
  value text not null,
  notes text not null default '',
  author author_kind not null,
  at timestamptz not null default now()
);

create table model_results (
  id uuid primary key default gen_random_uuid(),
  eval_id uuid not null references evals on delete cascade,
  model text not null,
  lab text not null,
  score numeric not null,
  cost_per_task_usd numeric,
  scaffold text,
  reported_on date,
  source_url text,
  author author_kind not null,
  unique nulls not distinct (eval_id, model, scaffold)
);

-- Staged AI writes awaiting Seb's accept: updates to AI fields and
-- suggestions for human fields. One run_id per weekly/ad-hoc run.
create table proposals (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references fields on delete cascade,
  run_id text not null,
  proposed_value text not null,
  proposed_notes text not null default '',
  sources text[] not null default '{}',
  confidence confidence_kind,
  reason text not null default '',
  base_value text not null,          -- the live value when staged, for 3-way warnings
  status proposal_status not null default 'staged',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by author_kind
);
create index on proposals (status, run_id);

-- Highlight comments (Google Docs style) and their replies.
create table comments (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references fields on delete cascade,
  parent_id uuid references comments on delete cascade,
  quote text,
  start_offset int,
  end_offset int,
  body text not null,
  author author_kind not null check (author <> 'ai'),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ── Who is calling ──────────────────────────────────────────────
create function current_who() returns author_kind
language sql stable security definer set search_path = public as $$
  select who from people where user_id = auth.uid()
$$;

-- ── Row-level security: signed-in Seb or Daniel, nothing for anon ─
alter table people enable row level security;
alter table template_fields enable row level security;
alter table evals enable row level security;
alter table fields enable row level security;
alter table field_history enable row level security;
alter table model_results enable row level security;
alter table proposals enable row level security;
alter table comments enable row level security;

create policy members_read on people for select to authenticated using (current_who() is not null);
create policy members_read on template_fields for select to authenticated using (current_who() is not null);
create policy members_all on evals for all to authenticated using (current_who() is not null) with check (current_who() is not null);
create policy members_all on fields for all to authenticated using (current_who() is not null) with check (current_who() is not null);
create policy members_read on field_history for select to authenticated using (current_who() is not null);
create policy members_all on model_results for all to authenticated using (current_who() is not null) with check (current_who() is not null);
create policy members_read on proposals for select to authenticated using (current_who() is not null);
create policy members_read on comments for select to authenticated using (current_who() is not null);
create policy own_insert on comments for insert to authenticated with check (author = current_who());
create policy own_delete on comments for delete to authenticated using (author = current_who());
-- Either person may resolve or reopen any thread; set_comment_resolved() is
-- the only update path, so bodies stay their author's.
create function set_comment_resolved(p_id uuid, p_resolved boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if current_who() is null then raise exception 'sign in first'; end if;
  update comments set resolved_at = case when p_resolved then now() end
   where id = p_id and parent_id is null;
end $$;

-- ── Field writes by people stamp author/time and append history ───
create function stamp_field() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and (new.value is distinct from old.value or new.notes is distinct from old.notes) then
    -- accept_proposal sets the author itself; anyone else editing becomes the author.
    if current_who() is not null and coalesce(current_setting('evalnb.accepting', true), '') <> 'on' then
      new.author := current_who();
      new.checked_by := null;
    end if;
    new.updated_at := now();
    insert into field_history (field_id, value, notes, author) values (new.id, new.value, new.notes, new.author);
  end if;
  return new;
end $$;
create trigger fields_stamp before update on fields for each row execute function stamp_field();

-- ── AI path: stage only ─────────────────────────────────────────
-- Called by the evalnb CLI with the ai_writer role. Never touches fields.
create function stage_ai_value(
  p_eval_slug text, p_key text, p_run_id text, p_value text,
  p_sources text[], p_confidence confidence_kind, p_reason text default ''
) returns uuid
language plpgsql security definer set search_path = public as $$
declare f fields; pid uuid;
begin
  if coalesce(array_length(p_sources, 1), 0) = 0 then
    raise exception 'every AI value needs at least one source';
  end if;
  select fl.* into f from fields fl join evals e on e.id = fl.eval_id
   where e.slug = p_eval_slug and fl.key = p_key and fl.deleted_at is null;
  if not found then raise exception 'no field % on %', p_key, p_eval_slug; end if;
  if f.value = p_value then return null; end if;
  -- Rejected before, or already waiting, with the same value: don't re-stage it.
  if exists (select 1 from proposals where field_id = f.id and status in ('rejected', 'staged') and proposed_value = p_value) then
    return null;
  end if;
  insert into proposals (field_id, run_id, proposed_value, sources, confidence, reason, base_value)
  values (f.id, p_run_id, p_value, p_sources, p_confidence, p_reason, f.value)
  returning id into pid;
  return pid;
end $$;

-- ── Seb's gate: accept or reject staged values ──────────────────
-- p_force: apply even though the field changed since the proposal was staged
-- (the UI shows base, current and proposed values before offering it).
create function accept_proposal(p_id uuid, p_value text default null, p_force boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare p proposals; f fields; was_human boolean;
begin
  if current_who() is distinct from 'seb' then raise exception 'only Seb accepts staged AI writes'; end if;
  select * into p from proposals where id = p_id and status = 'staged' for update;
  if not found then raise exception 'proposal % is not staged', p_id; end if;
  select * into f from fields where id = p.field_id for update;
  if f.value is distinct from p.base_value and not p_force then
    raise exception 'field changed since this proposal was staged' using errcode = 'P0409';
  end if;
  was_human := f.author in ('seb', 'daniel');
  perform set_config('evalnb.accepting', 'on', true);
  update fields set
    value = coalesce(p_value, p.proposed_value),
    notes = case when p.proposed_notes <> '' then p.proposed_notes else f.notes end,
    sources = p.sources,
    confidence = p.confidence,
    -- Edit-then-accept makes it Seb's; a human field keeps its human author;
    -- an AI field accepted as-is stays AI.
    author = case when p_value is not null then 'seb'::author_kind
                  when was_human then f.author
                  else 'ai'::author_kind end,
    updated_at = now(),
    checked_by = null
  where id = f.id;
  perform set_config('evalnb.accepting', 'off', true);
  update proposals set status = 'accepted', decided_at = now(), decided_by = 'seb' where id = p_id;
  -- Older proposals for this field were made against a value that is now gone.
  update proposals set status = 'rejected', decided_at = now(), decided_by = 'seb'
   where field_id = p.field_id and status = 'staged' and id <> p_id;
end $$;

create function reject_proposal(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if current_who() is distinct from 'seb' then raise exception 'only Seb rejects staged AI writes'; end if;
  update proposals set status = 'rejected', decided_at = now(), decided_by = 'seb'
   where id = p_id and status = 'staged';
end $$;

-- The CLI's role: may call stage_ai_value and read, nothing else.
create role ai_writer nologin;
grant usage on schema public to ai_writer;
grant select on evals, fields, model_results, template_fields, proposals to ai_writer;
-- RLS applies to ai_writer too; without these it would read zero rows.
create policy ai_read on evals for select to ai_writer using (true);
create policy ai_read on fields for select to ai_writer using (true);
create policy ai_read on model_results for select to ai_writer using (true);
create policy ai_read on template_fields for select to ai_writer using (true);
create policy ai_read on proposals for select to ai_writer using (true);

-- Functions are executable by PUBLIC by default; lock each to its caller.
revoke execute on function stage_ai_value(text, text, text, text, text[], confidence_kind, text) from public, anon, authenticated;
grant execute on function stage_ai_value(text, text, text, text, text[], confidence_kind, text) to ai_writer;
revoke execute on function accept_proposal(uuid, text, boolean), reject_proposal(uuid), set_comment_resolved(uuid, boolean) from public, anon;
grant execute on function accept_proposal(uuid, text, boolean), reject_proposal(uuid), set_comment_resolved(uuid, boolean) to authenticated;
revoke execute on function current_who() from public, anon;
grant execute on function current_who() to authenticated, ai_writer;
