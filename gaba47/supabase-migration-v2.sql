-- 嘎巴47 v2 增量升级
-- 已经运行过 supabase-setup.sql 的项目只需要执行本文件。
-- 本脚本不删除、不重建、不迁移任何现有用户或打卡记录，可重复执行。

alter table public.profiles
  add column if not exists avatar_url text;

grant select, insert, update, delete on public.checkins to authenticated;

drop policy if exists "users update own checkins" on public.checkins;
create policy "users update own checkins"
on public.checkins for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace view public.checkins_feed
with (security_invoker = true)
as
select
  c.id,
  c.user_id,
  p.display_name,
  p.avatar_url,
  c.training_type,
  c.body_parts,
  c.duration_minutes,
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
group by c.id, p.display_name, p.avatar_url;

revoke all on public.checkins_feed from public, anon;
grant select on public.checkins_feed to authenticated;

select '嘎巴47 v2 增量升级完成，现有数据未改动' as result;
