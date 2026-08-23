-- 嘎巴47：将旧猫咪换装字段升级为 12 星座猫完整角色。
-- 可重复执行；先执行 v3，再执行本文件。

alter table public.cat_profiles drop constraint if exists cat_profiles_fur_type_check;
alter table public.cat_profiles drop constraint if exists cat_profiles_headwear_check;
alter table public.cat_profiles drop constraint if exists cat_profiles_outfit_check;
alter table public.cat_profiles drop constraint if exists cat_profiles_accessory_check;

update public.cat_profiles
set fur_type = case fur_type
  when 'orange' then 'sagittarius'
  when 'cow' then 'libra'
  when 'black' then 'scorpio'
  when 'white' then 'leo'
  when 'tabby' then 'capricorn'
  else fur_type
end,
headwear = 'none',
outfit = 'zodiac',
accessory = 'none';

alter table public.cat_profiles alter column fur_type set default 'aries';
alter table public.cat_profiles alter column headwear set default 'none';
alter table public.cat_profiles alter column outfit set default 'zodiac';
alter table public.cat_profiles alter column accessory set default 'none';

alter table public.cat_profiles
  add constraint cat_profiles_fur_type_check
  check (fur_type in ('aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'));

alter table public.cat_profiles
  add constraint cat_profiles_headwear_check check (headwear = 'none');

alter table public.cat_profiles
  add constraint cat_profiles_outfit_check check (outfit = 'zodiac');

alter table public.cat_profiles
  add constraint cat_profiles_accessory_check check (accessory = 'none');
