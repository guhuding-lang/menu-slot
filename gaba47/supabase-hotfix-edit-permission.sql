-- 嘎巴47：修复“可以发布，但不能修改本人打卡”
-- 可在 Supabase SQL Editor 中重复执行；不会删除或重建现有数据。

begin;

grant select, insert, update, delete on public.checkins to authenticated;

alter table public.checkins enable row level security;

drop policy if exists "users update own checkins" on public.checkins;

create policy "users update own checkins"
on public.checkins for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

commit;

select '嘎巴47本人打卡修改权限已修复' as result;
