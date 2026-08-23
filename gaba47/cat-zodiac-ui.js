export const CAT_FUR_OPTIONS = [
  { value: "aries", label: "白羊座", breed: "白色长毛猫", asset: "./assets/zodiac-plaza/aries.webp" },
  { value: "taurus", label: "金牛座", breed: "金渐层", asset: "./assets/zodiac-plaza/taurus.webp" },
  { value: "gemini", label: "双子座", breed: "暹罗猫", asset: "./assets/zodiac-plaza/gemini.webp" },
  { value: "cancer", label: "巨蟹座", breed: "波斯猫", asset: "./assets/zodiac-plaza/cancer.webp" },
  { value: "leo", label: "狮子座", breed: "山东狮子猫", asset: "./assets/zodiac-plaza/leo.webp" },
  { value: "virgo", label: "处女座", breed: "布偶猫", asset: "./assets/zodiac-plaza/virgo.webp" },
  { value: "libra", label: "天秤座", breed: "奶牛猫", asset: "./assets/zodiac-plaza/libra.webp" },
  { value: "scorpio", label: "天蝎座", breed: "孟买猫", asset: "./assets/zodiac-plaza/scorpio.webp" },
  { value: "sagittarius", label: "射手座", breed: "孟加拉猫", asset: "./assets/zodiac-plaza/sagittarius.webp" },
  { value: "capricorn", label: "摩羯座", breed: "缅因猫", asset: "./assets/zodiac-plaza/capricorn.webp" },
  { value: "aquarius", label: "水瓶座", breed: "俄罗斯蓝猫", asset: "./assets/zodiac-plaza/aquarius.webp" },
  { value: "pisces", label: "双鱼座", breed: "橘白猫", asset: "./assets/zodiac-plaza/pisces.webp" },
];

// 保留旧表字段，避免修改现有数据库结构；V1 界面只开放 12 个完整角色。
export const CAT_HEADWEAR_OPTIONS = [{ value: "none", label: "固定造型" }];
export const CAT_OUTFIT_OPTIONS = [{ value: "zodiac", label: "星座战衣" }];
export const CAT_ACCESSORY_OPTIONS = [{ value: "none", label: "角色自带" }];

const allowedFurs = new Set(CAT_FUR_OPTIONS.map((item) => item.value));
const optionByValue = new Map(CAT_FUR_OPTIONS.map((item) => [item.value, item]));

function hashText(value = "47") {
  let hash = 0;
  for (const character of String(value)) hash = ((hash << 5) - hash + character.codePointAt(0)) | 0;
  return Math.abs(hash);
}

export function defaultCatProfile(userId = "47") {
  const furType = CAT_FUR_OPTIONS[hashText(userId) % CAT_FUR_OPTIONS.length].value;
  return {
    userId: String(userId || ""),
    furType,
    headwear: "none",
    outfit: "zodiac",
    accessory: "none",
    selectedTitle: "",
    unlockedItems: CAT_FUR_OPTIONS.map((item) => `fur:${item.value}`),
    unlockedAchievements: [],
    updatedAt: null,
  };
}

export function normalizeCatProfile(raw = {}, userId = raw.user_id || raw.userId || "") {
  const fallback = defaultCatProfile(userId);
  const furType = raw.fur_type || raw.furType;
  return {
    userId: String(userId || fallback.userId),
    furType: allowedFurs.has(furType) ? furType : fallback.furType,
    headwear: "none",
    outfit: "zodiac",
    accessory: "none",
    selectedTitle: String(raw.selected_title || raw.selectedTitle || ""),
    unlockedItems: CAT_FUR_OPTIONS.map((item) => `fur:${item.value}`),
    unlockedAchievements: Array.isArray(raw.unlocked_achievements || raw.unlockedAchievements) ? [...(raw.unlocked_achievements || raw.unlockedAchievements)] : [],
    updatedAt: raw.updated_at || raw.updatedAt || null,
  };
}

function safeText(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function catProfileDescriptor(rawProfile) {
  const profile = normalizeCatProfile(rawProfile, rawProfile?.userId || rawProfile?.user_id || "47");
  return optionByValue.get(profile.furType) || CAT_FUR_OPTIONS[0];
}

export function catCharacter(rawProfile, { label = "嘎巴47星座猫" } = {}) {
  const profile = normalizeCatProfile(rawProfile, rawProfile?.userId || rawProfile?.user_id || "47");
  const option = catProfileDescriptor(profile);
  return `<span class="cat-character zodiac-${option.value}" role="img" aria-label="${safeText(label)}，${option.label}${option.breed}"><img src="${option.asset}" alt="" loading="lazy" decoding="async" draggable="false" /></span>`;
}
