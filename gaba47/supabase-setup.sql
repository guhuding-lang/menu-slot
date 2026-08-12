-- 嘎巴47：Supabase 初始化脚本
-- 可重复执行。包含成员、打卡、点赞、私有照片存储和 RLS 权限。

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 20),
  group_code text not null default '47GYM',
  created_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  training_type text not null check (training_type in ('力量', '跑步', '骑行', '游泳', '拉伸', '其他')),
  body_parts text[] not null default '{}',
  duration_minutes integer not null check (duration_minutes between 1 and 600),
  note text not null default '' check (char_length(note) <= 300),
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  checkin_id uuid not null references public.checkins(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (checkin_id, user_id)
);

create index if not exists checkins_user_id_idx on public.checkins(user_id);
create index if not exists checkins_created_at_idx on public.checkins(created_at desc);
create index if not exists likes_user_id_idx on public.likes(user_id);

alter table public.profiles enable row level security;
alter table public.checkins enable row level security;
alter table public.likes enable row level security;

revoke all on public.profiles, public.checkins, public.likes from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.checkins to authenticated;
grant select, insert, delete on public.likes to authenticated;

drop policy if exists "group members can read profiles" on public.profiles;
drop policy if exists "users create own profile" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;
drop policy if exists "group members can read checkins" on public.checkins;
drop policy if exists "users create own checkins" on public.checkins;
drop policy if exists "users delete own checkins" on public.checkins;
drop policy if exists "group members can read likes" on public.likes;
drop policy if exists "users add own likes" on public.likes;
drop policy if exists "users remove own likes" on public.likes;

create policy "group members can read profiles"
on public.profiles for select to authenticated using (true);

create policy "users create own profile"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id and group_code = '47GYM');

create policy "users update own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id and group_code = '47GYM');

create policy "group members can read checkins"
on public.checkins for select to authenticated using (true);

create policy "users create own checkins"
on public.checkins for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "users delete own checkins"
on public.checkins for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "group members can read likes"
on public.likes for select to authenticated using (true);

create policy "users add own likes"
on public.likes for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "users remove own likes"
on public.likes for delete to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'checkin-photos',
  'checkin-photos',
  false,
  1048576,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "members upload own photos" on storage.objects;
drop policy if exists "members read checkin photos" on storage.objects;
drop policy if exists "public reads checkin photos" on storage.objects;
drop policy if exists "members delete own photos" on storage.objects;

create policy "members upload own photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'checkin-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "members read checkin photos"
on storage.objects for select to authenticated
using (bucket_id = 'checkin-photos');

create policy "members delete own photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'checkin-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create or replace function public.toggle_checkin_like(target_checkin uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.likes
    where checkin_id = target_checkin
      and user_id = (select auth.uid())
  ) then
    delete from public.likes
    where checkin_id = target_checkin
      and user_id = (select auth.uid());
  else
    insert into public.likes(checkin_id, user_id)
    values (target_checkin, (select auth.uid()));
  end if;
end;
$$;

revoke all on function public.toggle_checkin_like(uuid) from public, anon;
grant execute on function public.toggle_checkin_like(uuid) to authenticated;

create or replace view public.checkins_feed
with (security_invoker = true)
as
select
  c.id,
  c.user_id,
  p.display_name,
  c.training_type,
  case
    when array_length(c.body_parts, 1) > 0
      then array_to_string(c.body_parts, ' + ') || ' · ' || c.duration_minutes || '分钟'
    else c.training_type || ' · ' || c.duration_minutes || '分钟'
  end as details,
  c.note,
  c.photo_url,
  c.created_at,
  count(l.user_id)::integer as likes_count,
  coalesce(bool_or(l.user_id = (select auth.uid())), false) as liked_by_me
from public.checkins c
join public.profiles p on p.id = c.user_id
left join public.likes l on l.checkin_id = c.id
group by c.id, p.display_name;

revoke all on public.checkins_feed from public, anon;
grant select on public.checkins_feed to authenticated;

select '嘎巴47数据库初始化完成' as result;
