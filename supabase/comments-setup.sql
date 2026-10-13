-- Run once in the new blog-comments project.
begin;
create table public.comments (
  id uuid primary key,
  post_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  email text not null default '' check (char_length(email) <= 254),
  comment text not null check (char_length(btrim(comment)) between 1 and 5000),
  created_at timestamptz not null default now(),
  show boolean not null default true,
  deletion_hash text not null check (deletion_hash ~ '^[0-9a-f]{64}$')
);
create index comments_post_date_idx on public.comments (post_id, created_at desc) where show;
alter table public.comments enable row level security;
revoke all on public.comments from public, anon, authenticated;
grant select (id, post_id, name, comment, created_at, show) on public.comments to anon;
grant insert (id, post_id, name, email, comment, deletion_hash) on public.comments to anon;
grant delete on public.comments to anon;
create policy "Read visible comments" on public.comments for select to anon using (show);
create policy "Submit visible comments" on public.comments for insert to anon with check (show = true);
-- Require the author's 256-bit random token, not their nickname or email.
-- Public queries cannot read email or deletion_hash.
create policy "Delete with author token" on public.comments for delete to anon using (
  deletion_hash = encode(sha256(convert_to(
    coalesce(nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-comment-token', ''),
    'UTF8'
  )), 'hex')
);
commit;
