-- 嘎巴47：清空当前业务数据
-- 警告：执行后，所有昵称、打卡和点赞将永久删除，无法恢复。
-- 本脚本只清空业务数据，不删除表、视图、RLS、函数、存储桶或匿名 Auth 用户。

begin;

delete from public.likes;
delete from public.checkins;
delete from public.profiles;

commit;

select
  (select count(*) from public.profiles) as profiles_remaining,
  (select count(*) from public.checkins) as checkins_remaining,
  (select count(*) from public.likes) as likes_remaining;

-- 预期结果：三个 remaining 字段均为 0。
-- 照片文件请在 Supabase 的 Storage > checkin-photos 中点击 Empty bucket 清空。
-- 不要直接 delete storage.objects；那可能只删元数据而留下孤儿文件。
