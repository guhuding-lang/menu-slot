export const CAT_FUR_OPTIONS = [
  ["hiking", "徒步猫", "背上包，慢慢走", "01-hiking-cat.webp"],
  ["bench", "卧推猫", "今天也有认真用力", "02-bench-press-cat.webp"],
  ["skating", "滑冰猫", "轻轻滑过训练日", "03-ice-skating-cat.webp"],
  ["basketball", "篮球猫", "球场上见", "04-basketball-cat.webp"],
  ["running", "跑步猫", "迈出去就算赢", "05-running-cat.webp"],
  ["flexing", "力量猫", "小肌肉正在长大", "06-flexing-cat.webp"],
  ["stairs", "爬楼猫", "一层一层向上", "07-stair-climbing-cat.webp"],
  ["yoga", "瑜伽猫", "先把身体舒展开", "08-yoga-cat.webp"],
  ["meal", "加餐猫", "认真吃饭也是训练", "09-chicken-breast-cat.webp"],
  ["core", "核心猫", "再来一个就收工", "10-sit-up-cat.webp"],
  ["sleeping", "休息猫", "恢复也是计划的一部分", "11-sleeping-cat.webp"],
  ["snack", "放松猫", "偶尔松一口气", "12-fast-food-cat.webp"],
  ["working", "加班猫", "忙完也记得动一动", "13-working-overtime-cat.webp"],
  ["aerobics", "跳操猫", "跟着节拍出发", "14-aerobics-cat.webp"],
].map(([value, label, breed, file]) => ({ value, label, breed, asset: `./assets/sports-cats/${file}` }));

// 继续使用旧表的通用字段，不要求数据库迁移。
export const CAT_HEADWEAR_OPTIONS = [{ value: "none", label: "固定造型" }];
export const CAT_OUTFIT_OPTIONS = [{ value: "sport", label: "运动日常" }];
export const CAT_ACCESSORY_OPTIONS = [{ value: "none", label: "角色自带" }];

const optionByValue = new Map(CAT_FUR_OPTIONS.map((item) => [item.value, item]));
const legacyValues = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];

function hashText(value = "47") {
  let hash = 0;
  for (const character of String(value)) hash = ((hash << 5) - hash + character.codePointAt(0)) | 0;
  return Math.abs(hash);
}

function optionForValue(value, userId = "47") {
  if (optionByValue.has(value)) return optionByValue.get(value);
  const legacyIndex = legacyValues.indexOf(value);
  if (legacyIndex >= 0) return CAT_FUR_OPTIONS[legacyIndex];
  return CAT_FUR_OPTIONS[hashText(userId) % CAT_FUR_OPTIONS.length];
}

const actionMap = {
  hike: "hiking",
  strength: "bench",
  skate: "skating",
  water: "skating",
  basketball: "basketball",
  run: "running",
  flex: "flexing",
  stairs: "stairs",
  stretch: "yoga",
  yoga: "yoga",
  meal: "meal",
  core: "core",
  rest: "sleeping",
  sit: "sleeping",
  snack: "snack",
  phone: "working",
  work: "working",
  aerobics: "aerobics",
};

export function defaultCatProfile(userId = "47") {
  const option = CAT_FUR_OPTIONS[hashText(userId) % CAT_FUR_OPTIONS.length];
  return {
    userId: String(userId || ""),
    furType: option.value,
    headwear: "none",
    outfit: "sport",
    accessory: "none",
    selectedTitle: "",
    unlockedItems: CAT_FUR_OPTIONS.map((item) => `fur:${item.value}`),
    unlockedAchievements: [],
    updatedAt: null,
  };
}

export function normalizeCatProfile(raw = {}, userId = raw.user_id || raw.userId || "") {
  const fallback = defaultCatProfile(userId);
  const rawFur = raw.fur_type || raw.furType;
  const option = optionForValue(rawFur, userId || fallback.userId);
  return {
    userId: String(userId || fallback.userId),
    furType: option.value,
    headwear: "none",
    outfit: "sport",
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
  return optionForValue(profile.furType, profile.userId);
}

export function catCharacter(rawProfile, { label = "运动猫咪", action = "" } = {}) {
  const profile = normalizeCatProfile(rawProfile, rawProfile?.userId || rawProfile?.user_id || "47");
  const option = optionForValue(actionMap[action] || profile.furType, profile.userId);
  return `<span class="cat-character sports-cat sports-cat-${option.value}" role="img" aria-label="${safeText(label)}，${option.label}"><img src="${option.asset}" alt="" loading="lazy" decoding="async" draggable="false" /></span>`;
}

