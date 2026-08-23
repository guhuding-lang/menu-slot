-- 嘎巴47 v3：群友猫咪与猫窝配置
-- 已运行 supabase-setup.sql 的项目执行本文件即可。
-- 本脚本只新增 cat_profiles，不修改现有用户、打卡、点赞和照片数据，可重复执行。

create table if not exists public.cat_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  fur_type text not null default 'aries' check (fur_type in ('aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces')),
  headwear text not null default 'none' check (headwear = 'none'),
  outfit text not null default 'zodiac' check (outfit = 'zodiac'),
  accessory text not null default 'none' check (accessory = 'none'),
  selected_title text not null default '' check (char_length(selected_title) <= 30),
  unlocked_items text[] not null default '{}',
  unlocked_achievements text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists cat_profiles_updated_at_idx on public.cat_profiles(updated_at desc);

alter table public.cat_profiles enable row level security;

revoke all on public.cat_profiles from anon, authenticated;
grant select, insert, update on public.cat_profiles to authenticated;

drop policy if exists "group members can read cat profiles" on public.cat_profiles;
drop policy if exists "users create own cat profile" on public.cat_profiles;
drop policy if exists "users update own cat profile" on public.cat_profiles;

create policy "group members can read cat profiles"
on public.cat_profiles for select to authenticated
using (true);

create policy "users create own cat profile"
on public.cat_profiles for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "users update own cat profile"
on public.cat_profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

select '嘎巴47 v3 猫咪配置升级完成，现有数据未改动' as result;
