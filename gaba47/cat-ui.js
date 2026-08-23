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

function furPattern(profile, palette) {
  if (profile.furType === "orange") return `<path d="M43 26l8 5m18-5l-8 5M36 57l10 3m38-3l-10 3M50 82l5 8m15-8l-5 8" fill="none" stroke="${palette.accent}" stroke-width="4" stroke-linecap="round"/>`;
  if (profile.furType === "cow") return `<path d="M33 38c5-11 17-13 23-5 3 5 0 14-7 17-7 3-15-3-16-12Zm38 4c3-9 14-11 20-5 5 6 0 15-8 17-7 2-15-4-12-12ZM43 78c9-7 18-3 20 6 1 8-7 14-15 11-8-3-11-11-5-17Z" fill="#111111"/>`;
  if (profile.furType === "tabby") return `<path d="M45 26l7 7m16-7-7 7M35 48l11 4m39-4-11 4M45 76l7 9m23-9-7 9" fill="none" stroke="${palette.accent}" stroke-width="4" stroke-linecap="round"/>`;
  if (profile.furType === "black") return `<path d="M42 48c10-8 27-8 37 0-2 11-10 18-19 18s-17-7-18-18Z" fill="${palette.face}"/>`;
  return `<path d="M41 29l7 5m24-5-7 5" fill="none" stroke="${palette.accent}" stroke-width="3" stroke-linecap="round"/>`;
}

function outfitMarkup(profile) {
  const colors = {
    "black-vest": ["#111111", "#b8ff26"],
    "green-vest": ["#b8ff26", "#111111"],
    "sport-tee": ["#ffffff", "#111111"],
    hoodie: ["#777771", "#b8ff26"],
  };
  const [fill, mark] = colors[profile.outfit] || colors["black-vest"];
  const sleeves = profile.outfit === "sport-tee" || profile.outfit === "hoodie"
    ? `<path d="M34 77l-11 13 10 8 9-15m44-6 11 13-10 8-9-15" fill="${fill}" stroke="#090909" stroke-width="4" stroke-linejoin="round"/>`
    : "";
  const hood = profile.outfit === "hoodie" ? `<path d="M42 76c4-9 32-9 36 0l-6 9H48Z" fill="#94948e" stroke="#090909" stroke-width="3"/>` : "";
  return `${sleeves}${hood}<path d="M38 74c9-7 35-7 44 0l-4 38H42Z" fill="${fill}" stroke="#090909" stroke-width="4" stroke-linejoin="round"/><path d="M55 78h10v25H55z" fill="${mark}"/><path d="M59 81l-5 10h6l-2 9 9-13h-6l3-6Z" fill="${fill}"/>`;
}

function headwearMarkup(profile) {
  if (profile.headwear === "green-headband") return `<path d="M31 36c16-9 42-9 58 0l-2 10c-15-7-39-7-54 0Z" fill="#b8ff26" stroke="#090909" stroke-width="4"/><path d="M60 34l-5 8h6l-2 7 8-11h-6l3-4Z" fill="#090909"/>`;
  if (profile.headwear === "black-cap") return `<path d="M35 35c7-15 36-17 49-3l-2 10H36Z" fill="#111111" stroke="#090909" stroke-width="4"/><path d="M75 40c13-1 20 2 23 7-10 2-18 1-25-2Z" fill="#111111" stroke="#090909" stroke-width="4"/>`;
  if (profile.headwear === "headphones") return `<path d="M30 47c0-29 60-29 60 0" fill="none" stroke="#090909" stroke-width="7"/><rect x="25" y="42" width="13" height="25" rx="6" fill="#b8ff26" stroke="#090909" stroke-width="4"/><rect x="82" y="42" width="13" height="25" rx="6" fill="#b8ff26" stroke="#090909" stroke-width="4"/>`;
  if (profile.headwear === "hairband") return `<path d="M34 39c13-12 39-12 52 0" fill="none" stroke="#ff9a42" stroke-width="6"/><path d="M83 34c10-8 15 1 9 8 8 5 2 14-8 6l-5-6Z" fill="#ff9a42" stroke="#090909" stroke-width="3"/>`;
  return "";
}

function accessoryMarkup(accessory) {
  if (accessory === "dumbbell") return `<g transform="translate(75 91) rotate(-10)"><rect x="0" y="5" width="27" height="6" rx="3" fill="#090909"/><rect x="-3" y="0" width="7" height="16" rx="2" fill="#b8ff26" stroke="#090909" stroke-width="3"/><rect x="24" y="0" width="7" height="16" rx="2" fill="#b8ff26" stroke="#090909" stroke-width="3"/></g>`;
  if (accessory === "cup") return `<g transform="translate(78 86)"><path d="M0 0h18l-2 25H2Z" fill="#71d9ff" stroke="#090909" stroke-width="3"/><path d="M18 6c10-1 10 13 0 13" fill="none" stroke="#090909" stroke-width="3"/></g>`;
  if (accessory === "shaker") return `<g transform="translate(80 84)"><path d="M2 6h16l-2 26H4Z" fill="#b8ff26" stroke="#090909" stroke-width="3"/><path d="M0 6h20V1H0Z" fill="#111111" stroke="#090909" stroke-width="3"/></g>`;
  if (accessory === "phone") return `<g transform="translate(79 86) rotate(8)"><rect width="17" height="28" rx="4" fill="#222222" stroke="#090909" stroke-width="3"/><circle cx="8.5" cy="23" r="1.5" fill="#b8ff26"/></g>`;
  return "";
}

export function catCharacter(rawProfile, { action = "sit", label = "嘎巴47猫咪" } = {}) {
  const profile = normalizeCatProfile(rawProfile, rawProfile?.userId || rawProfile?.user_id || "47");
  const palette = furOptions.find((item) => item.value === profile.furType) || furOptions[0];
  const safeAction = ["strength", "run", "stretch", "water", "phone", "sit", "rest"].includes(action) ? action : "sit";
  const fallbackAccessory = safeAction === "strength" ? "dumbbell" : safeAction === "water" ? "cup" : safeAction === "phone" ? "phone" : "none";
  const accessory = profile.accessory === "none" ? fallbackAccessory : profile.accessory;
  return `<span class="cat-character action-${safeAction}" role="img" aria-label="${safeText(label)}"><svg viewBox="0 0 120 136" aria-hidden="true" focusable="false"><ellipse class="cat-shadow" cx="60" cy="126" rx="40" ry="7" fill="rgba(9,9,9,.16)"/><path class="cat-tail" d="M36 99C15 103 15 79 27 76c11-2 7 14-1 11" fill="none" stroke="${palette.body}" stroke-width="12" stroke-linecap="round"/><path d="M36 99C15 103 15 79 27 76c11-2 7 14-1 11" fill="none" stroke="#090909" stroke-width="17" stroke-linecap="round"/><path class="cat-tail-color" d="M36 99C15 103 15 79 27 76c11-2 7 14-1 11" fill="none" stroke="${palette.body}" stroke-width="11" stroke-linecap="round"/><path class="cat-body" d="M35 80c5-18 45-18 50 0l4 34c-16 9-42 9-58 0Z" fill="${palette.body}" stroke="#090909" stroke-width="4" stroke-linejoin="round"/><path d="M32 42 35 17l20 15m33 10-3-25-20 15" fill="${palette.body}" stroke="#090909" stroke-width="4" stroke-linejoin="round"/><path d="M39 30 40 24l9 7m32-1-1-6-9 7" fill="#ffb6b6"/><circle class="cat-head" cx="60" cy="52" r="31" fill="${palette.body}" stroke="#090909" stroke-width="4"/>${furPattern(profile, palette)}<ellipse cx="60" cy="62" rx="15" ry="11" fill="${palette.face}"/><path d="M46 50c3-3 7-3 10 0m8 0c3-3 7-3 10 0" fill="none" stroke="#090909" stroke-width="4" stroke-linecap="round"/><path d="m57 59 3 3 3-3m-3 3v5m0 0-6 4m6-4 6 4" fill="none" stroke="#090909" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M31 60 13 57m19 11-18 3m75-11 18-3M88 68l18 3" fill="none" stroke="#090909" stroke-width="2.5" stroke-linecap="round"/>${outfitMarkup(profile)}<path class="cat-arm cat-arm-left" d="M39 82c-12 8-11 24-2 29" fill="none" stroke="#090909" stroke-width="12" stroke-linecap="round"/><path class="cat-arm-color cat-arm-left" d="M39 82c-12 8-11 24-2 29" fill="none" stroke="${palette.body}" stroke-width="7" stroke-linecap="round"/><path class="cat-arm cat-arm-right" d="M81 82c12 8 11 24 2 29" fill="none" stroke="#090909" stroke-width="12" stroke-linecap="round"/><path class="cat-arm-color cat-arm-right" d="M81 82c12 8 11 24 2 29" fill="none" stroke="${palette.body}" stroke-width="7" stroke-linecap="round"/><path class="cat-leg" d="M45 111v13m30-13v13" fill="none" stroke="#090909" stroke-width="12" stroke-linecap="round"/>${accessoryMarkup(accessory)}${headwearMarkup(profile)}</svg></span>`;
}
