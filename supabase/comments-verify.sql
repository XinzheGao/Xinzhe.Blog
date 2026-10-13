-- Run after comments-setup.sql. All test data is rolled back.
begin;
set local role anon;
insert into public.comments (id, post_id, name, email, comment, deletion_hash)
values ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
  'Permission test', 'private@example.invalid', 'Temporary permission test',
  encode(sha256(convert_to(repeat('a', 64), 'UTF8')), 'hex'));
do $$
declare affected integer;
begin
  perform id, name, comment from public.comments where id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  if not found then raise exception 'Public read failed'; end if;
  begin
    perform email from public.comments;
    raise exception 'Contact information is publicly readable';
  exception when insufficient_privilege then null; end;
  begin
    perform deletion_hash from public.comments;
    raise exception 'Deletion hashes are publicly readable';
  exception when insufficient_privilege then null; end;
  begin
    update public.comments set show = false where id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
    raise exception 'Public update is permitted';
  exception when insufficient_privilege then null; end;
  perform set_config('request.headers', '{"x-comment-token":"wrong-token"}', true);
  delete from public.comments where id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Wrong token could delete a comment'; end if;
  perform set_config('request.headers', jsonb_build_object('x-comment-token', repeat('a', 64))::text, true);
  delete from public.comments where id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Owner deletion failed'; end if;
end $$;
reset role;
rollback;
select 'All comment permission checks passed; test data rolled back' as result;
