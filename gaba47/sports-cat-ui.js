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
const selectedCatPrefix = "sports-cat:";

function hashText(value = "47") {
  let hash = 0;
  for (const character of String(value)) hash = ((hash << 5) - hash + character.codePointAt(0)) | 0;
  return Math.abs(hash);
}

function optionForValue(value, userId = "47") {
  if (optionByValue.has(value)) return optionByValue.get(value);
  // 没有主动选择过运动猫（含旧星座猫数据）的用户，按账号稳定随机。
  // 同一用户每次刷新都会得到同一只猫，直到本人保存新的选择。
  return CAT_FUR_OPTIONS[hashText(userId) % CAT_FUR_OPTIONS.length];
}

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
  const rawItems = Array.isArray(raw.unlocked_items || raw.unlockedItems) ? [...(raw.unlocked_items || raw.unlockedItems)] : [];
  const selectedItem = rawItems.find((item) => String(item).startsWith(selectedCatPrefix));
  // 编辑器会先更新 camelCase 的 furType；它必须优先于旧的持久化标记。
  // 从数据库读取时没有 furType，才回退到 unlocked_items 中保存的实际选择。
  const rawFur = optionByValue.has(raw.furType)
    ? raw.furType
    : selectedItem
      ? String(selectedItem).slice(selectedCatPrefix.length)
      : raw.fur_type;
  const option = optionForValue(rawFur, userId || fallback.userId);
  return {
    userId: String(userId || fallback.userId),
    furType: option.value,
    headwear: "none",
    outfit: "sport",
    accessory: "none",
    selectedTitle: String(raw.selected_title || raw.selectedTitle || ""),
    // 复用既有 text[] 字段记录 14 选 1，兼容线上旧星座猫表结构。
    unlockedItems: [...CAT_FUR_OPTIONS.map((item) => `fur:${item.value}`), `${selectedCatPrefix}${option.value}`],
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

export function catCharacter(rawProfile, { label = "运动猫咪" } = {}) {
  const profile = normalizeCatProfile(rawProfile, rawProfile?.userId || rawProfile?.user_id || "47");
  // 角色身份只由用户选择决定。页面场景不再覆盖成另一只猫。
  const option = optionForValue(profile.furType, profile.userId);
  return `<span class="cat-character sports-cat sports-cat-${option.value}" role="img" aria-label="${safeText(label)}，${option.label}"><img src="${option.asset}" alt="" loading="lazy" decoding="async" draggable="false" /></span>`;
}
