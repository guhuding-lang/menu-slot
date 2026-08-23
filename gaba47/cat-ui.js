const furOptions = [
  { value: "orange", label: "橘猫", body: "#f3a84d", accent: "#c96f25", face: "#fff5e7" },
  { value: "cow", label: "奶牛猫", body: "#ffffff", accent: "#111111", face: "#ffffff" },
  { value: "black", label: "黑猫", body: "#222222", accent: "#090909", face: "#f5f5ef" },
  { value: "white", label: "白猫", body: "#ffffff", accent: "#d8d8d2", face: "#ffffff" },
  { value: "tabby", label: "灰狸花", body: "#9b9b94", accent: "#62625d", face: "#e9e9e4" },
];

export const CAT_FUR_OPTIONS = furOptions.map(({ value, label }) => ({ value, label }));
export const CAT_HEADWEAR_OPTIONS = [
  { value: "none", label: "不戴" },
  { value: "green-headband", label: "绿色头带" },
  { value: "black-cap", label: "黑色鸭舌帽" },
  { value: "headphones", label: "耳机" },
  { value: "hairband", label: "发带" },
];
export const CAT_OUTFIT_OPTIONS = [
  { value: "black-vest", label: "黑色背心" },
  { value: "green-vest", label: "绿色背心" },
  { value: "sport-tee", label: "运动T恤" },
  { value: "hoodie", label: "卫衣" },
];
export const CAT_ACCESSORY_OPTIONS = [
  { value: "none", label: "空手" },
  { value: "dumbbell", label: "哑铃" },
  { value: "cup", label: "水杯" },
  { value: "shaker", label: "摇摇杯" },
  { value: "phone", label: "手机" },
];

const allowed = {
  furType: new Set(CAT_FUR_OPTIONS.map((item) => item.value)),
  headwear: new Set(CAT_HEADWEAR_OPTIONS.map((item) => item.value)),
  outfit: new Set(CAT_OUTFIT_OPTIONS.map((item) => item.value)),
  accessory: new Set(CAT_ACCESSORY_OPTIONS.map((item) => item.value)),
};

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
    outfit: "black-vest",
    accessory: "none",
    selectedTitle: "",
    unlockedItems: [
      ...CAT_FUR_OPTIONS.map((item) => `fur:${item.value}`),
      ...CAT_HEADWEAR_OPTIONS.map((item) => `headwear:${item.value}`),
      ...CAT_OUTFIT_OPTIONS.map((item) => `outfit:${item.value}`),
      ...CAT_ACCESSORY_OPTIONS.map((item) => `accessory:${item.value}`),
    ],
    unlockedAchievements: [],
    updatedAt: null,
  };
}

export function normalizeCatProfile(raw = {}, userId = raw.user_id || raw.userId || "") {
  const fallback = defaultCatProfile(userId);
  const furType = raw.fur_type || raw.furType;
  const headwear = raw.headwear;
  const outfit = raw.outfit;
  const accessory = raw.accessory;
  return {
    userId: String(userId || fallback.userId),
    furType: allowed.furType.has(furType) ? furType : fallback.furType,
    headwear: allowed.headwear.has(headwear) ? headwear : fallback.headwear,
    outfit: allowed.outfit.has(outfit) ? outfit : fallback.outfit,
    accessory: allowed.accessory.has(accessory) ? accessory : fallback.accessory,
    selectedTitle: String(raw.selected_title || raw.selectedTitle || ""),
    unlockedItems: Array.isArray(raw.unlocked_items || raw.unlockedItems) ? [...(raw.unlocked_items || raw.unlockedItems)] : fallback.unlockedItems,
    unlockedAchievements: Array.isArray(raw.unlocked_achievements || raw.unlockedAchievements) ? [...(raw.unlocked_achievements || raw.unlockedAchievements)] : [],
    updatedAt: raw.updated_at || raw.updatedAt || null,
  };
}

function safeText(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

const catAssets = {
  orange: "./assets/cats-v2/orange-wave.webp",
  cow: "./assets/cats-v2/cow-run.webp",
  black: "./assets/cats-v2/black-strength.webp",
  white: "./assets/cats-v2/white-stretch.webp",
  tabby: "./assets/cats-v2/tabby-water.webp",
};

const traitIcons = {
  headwear: {
    "green-headband": "headphones",
    "black-cap": "headphones",
    headphones: "headphones",
    hairband: "headphones",
  },
  outfit: {
    "green-vest": "t-shirt",
    "sport-tee": "t-shirt",
    hoodie: "t-shirt",
  },
  accessory: {
    dumbbell: "barbell",
    cup: "coffee",
    shaker: "coffee",
    phone: "device-mobile",
  },
};

function traitBadges(profile) {
  const icons = [
    traitIcons.headwear[profile.headwear],
    traitIcons.outfit[profile.outfit],
    traitIcons.accessory[profile.accessory],
  ].filter(Boolean);
  if (!icons.length) return "";
  return `<span class="cat-traits" aria-hidden="true">${icons.map((name) => `<i class="ph ph-${name}"></i>`).join("")}</span>`;
}

export function catCharacter(rawProfile, { action = "sit", label = "嘎巴47猫咪" } = {}) {
  const profile = normalizeCatProfile(rawProfile, rawProfile?.userId || rawProfile?.user_id || "47");
  const safeAction = ["strength", "run", "stretch", "water", "phone", "sit", "rest"].includes(action) ? action : "sit";
  const orangeResting = profile.furType === "orange" && ["phone", "rest"].includes(safeAction);
  const asset = orangeResting ? "./assets/cats-v2/orange-phone.webp" : catAssets[profile.furType] || catAssets.orange;
  return `<span class="cat-character action-${safeAction} outfit-${profile.outfit}" role="img" aria-label="${safeText(label)}"><img src="${asset}" alt="" loading="lazy" decoding="async" draggable="false" />${traitBadges(profile)}</span>`;
}
