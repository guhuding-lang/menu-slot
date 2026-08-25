import {
  CAT_FUR_OPTIONS,
  catCharacter,
  catProfileDescriptor,
  defaultCatProfile,
  normalizeCatProfile,
} from "./cat-zodiac-ui.js?v=1";

const SUPABASE_URL = "https://jujvzrpqagjxeeafqlyo.supabase.co";
const SUPABASE_KEY = "sb_publishable_eg6Dbh9a46pa14-yPqrFiQ_AQgER7J-";
const SESSION_KEY = "gaba47-supabase-session-v1";
const USER_KEY = "gaba47-user-v2";
const CAT_LOCAL_KEY = "gaba47-cat-profile-v1";
const PREVIEW_MODE = new URLSearchParams(location.search).get("preview") === "1";
const GROUP_CODE = "47GYM";
const REPORT_PUBLISH_HOUR = 1;

const app = document.querySelector("#app");
const initialUser = PREVIEW_MODE ? { id: "preview", name: "阿飞不累", avatarPath: null, avatarUrl: null } : readJSON(USER_KEY);
const trainingOptions = [
  ["胸", "barbell"], ["背", "barbell"], ["肩", "barbell"],
  ["腿", "barbell"], ["二头", "barbell"], ["三头", "barbell"],
  ["核心", "person-simple-tai-chi"], ["跑步", "person-simple-run"], ["骑行", "bicycle"],
  ["游泳", "waves"], ["爬坡", "trend-up"], ["爬楼", "stairs"],
  ["椭圆机", "person-simple-run"], ["拉伸", "person-simple-tai-chi"], ["滑冰", "person-simple-ski"],
  ["篮球", "basketball"], ["跳操", "person-arms-spread"], ["攀岩", "person-simple-hike"],
  ["其他", "dots-three"],
];
const diceExercises = ["胸", "背", "臀腿", "肩", "手臂", "核心"];
const navItems = [
  ["home", "动态", "activity"], ["ranking", "排行榜", "trophy"],
  ["checkin", "去打卡", "lightning"], ["plaza", "广场", "sparkle"], ["profile", "我的", "user"],
];

const emptyCheckinForm = () => ({
  id: null, editing: false, date: localDateKey(), type: "胸", parts: ["胸"], duration: 60,
  photo: null, photoUrl: "", originalPhotoPath: null, removePhoto: false, uploadStatus: "", note: "", submitting: false,
});

const state = {
  user: initialUser,
  service: null, route: "home", checkins: [], profiles: [], catProfiles: [], booting: !PREVIEW_MODE && !initialUser, loading: false,
  connection: PREVIEW_MODE ? "preview" : "idle", identityIssue: null, toast: "", toastTimer: null,
  checkinForm: emptyCheckinForm(),
  profileEditor: { open: false, name: "", avatar: null, avatarUrl: "", removeAvatar: false, status: "", saving: false },
  deleteConfirm: false,
  reportModal: null,
  memberModal: null,
  showAllMembers: false,
  catEditor: { open: false, draft: null, saving: false, status: "" },
  rankingPeriod: "week",
  tools: { diceIndex: null, diceRolling: false, focus: null },
};

function readJSON(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function writeJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function isUUID(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "")); }
function escapeHTML(value = "") { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function icon(name, extra = "") { return `<i class="ph ph-${name} ${extra}" aria-hidden="true"></i>`; }
function initials(name = "47") { return [...String(name).trim()].slice(0, 1).join("") || "47"; }
function cleanDisplayName(name = "") {
  const value = String(name);
  const normalized = typeof value.normalize === "function" ? value.normalize("NFKC") : value;
  return normalized.trim().replace(/\s+/g, " ");
}
function displayNameKey(name = "") { return cleanDisplayName(name).toLocaleLowerCase("zh-CN"); }
function localDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function displayDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(date);
}
function parseMinutes(item) { return Number(item.duration || item.duration_minutes || (item.details?.match(/(\d+)\s*分钟/) || [])[1] || 0); }
function parseParts(item) {
  if (Array.isArray(item.parts)) return item.parts;
  if (Array.isArray(item.body_parts)) return item.body_parts;
  const detail = String(item.details || "").split("·")[0].trim();
  if (!detail || detail === item.type) return [];
  return detail.split("+").map((part) => part.trim()).filter(Boolean);
}
function trainingTypeFor(parts = []) {
  const selections = [...new Set(parts.filter(Boolean))];
  const strengthParts = new Set(["胸", "背", "肩", "腿", "二头", "三头", "核心"]);
  if (selections.length && selections.every((part) => strengthParts.has(part))) return "力量";
  if (selections.length === 1 && ["跑步", "骑行", "游泳", "拉伸", "其他"].includes(selections[0])) return selections[0];
  return "其他";
}
function activitySummary(item) {
  const selections = parseParts(item);
  const label = selections.length ? selections.join(" + ") : (item.type || "训练");
  return `${label} · ${parseMinutes(item)}分钟`;
}
function relativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.floor(Math.max(0, Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}天前` : displayDate(date);
}
function avatarMarkup(entity, className = "avatar") {
  const name = entity?.display_name || entity?.name || "47";
  const id = entity?.userId || entity?.user_id || entity?.id || entity;
  return `<span class="${className} cat-avatar">${catCharacter(catProfileFor(id), { label: `${name}的星座猫头像` })}</span>`;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!response.ok) {
    let message = text;
    let parsed = null;
    try { parsed = JSON.parse(text); message = parsed?.message || parsed?.error_description || parsed?.hint || text; } catch {}
    const error = new Error(message || `请求失败：${response.status}`);
    error.status = response.status;
    error.code = parsed?.code || "";
    error.details = parsed?.details || "";
    throw error;
  }
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function getSession() {
  let session = readJSON(SESSION_KEY);
  if (session?.access_token && (!session.expires_at || session.expires_at > Date.now() / 1000 + 60)) return session;
  if (session?.refresh_token) {
    try {
      const refreshed = await parseResponse(await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST", headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: session.refresh_token }),
      }));
      session = refreshed.session || refreshed;
      writeJSON(SESSION_KEY, session);
      return session;
    } catch (error) { console.warn("会话刷新失败，将创建新的本机匿名会话", error); }
  }
  const created = await parseResponse(await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST", headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ data: {} }),
  }));
  session = created.session || created;
  if (!session?.access_token) throw new Error("匿名登录失败，请稍后重试");
  writeJSON(SESSION_KEY, session);
  return session;
}

async function createService() {
  const session = await getSession();
  const userId = session.user?.id;
  if (!userId) throw new Error("没有取得用户身份");
  const api = async (path, { method = "GET", headers = {}, body } = {}) => parseResponse(await fetch(`${SUPABASE_URL}${path}`, {
    method, headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}`, ...headers }, body,
  }));
  const encodePath = (value) => value.split("/").map(encodeURIComponent).join("/");
  const signedCache = new Map();
  let supportsAvatar = true;
  let supportsCats = true;

  const signPath = async (path) => {
    if (!path) return null;
    if (signedCache.has(path)) return signedCache.get(path);
    try {
      const signed = await api(`/storage/v1/object/sign/checkin-photos/${encodePath(path)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: 3600 }),
      });
      const signedPath = signed?.signedURL || signed?.signedUrl;
      const url = signedPath?.startsWith("http") ? signedPath : (signedPath ? `${SUPABASE_URL}/storage/v1${signedPath}` : null);
      signedCache.set(path, url);
      return url;
    } catch { return null; }
  };
  const deleteObject = async (path) => {
    if (!path) return;
    await api(`/storage/v1/object/checkin-photos/${encodePath(path)}`, { method: "DELETE" });
    signedCache.delete(path);
  };
  const uploadObject = async (file, prefix) => {
    const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[file.type] || "webp";
    const nonce = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    const path = `${userId}/${prefix}-${Date.now()}-${nonce}.${extension}`;
    await api(`/storage/v1/object/checkin-photos/${encodePath(path)}`, {
      method: "POST", headers: { "Content-Type": file.type || "image/webp", "x-upsert": "false" }, body: file,
    });
    return path;
  };
  const fetchProfiles = async () => {
    try { return await api("/rest/v1/profiles?select=id,display_name,avatar_url,created_at&order=created_at.asc"); }
    catch (error) {
      if (!/avatar_url/i.test(error.message)) throw error;
      supportsAvatar = false;
      return api("/rest/v1/profiles?select=id,display_name,created_at&order=created_at.asc");
    }
  };
  const fetchCheckins = async () => {
    const rows = [];
    const pageSize = 1000;
    for (let offset = 0; offset < 50000; offset += pageSize) {
      const page = await api(`/rest/v1/checkins_feed?select=*&order=created_at.desc&limit=${pageSize}&offset=${offset}`);
      rows.push(...(page || []));
      if (!page || page.length < pageSize) break;
    }
    return rows;
  };
  const fetchCatProfiles = async () => {
    try {
      return await api("/rest/v1/cat_profiles?select=user_id,fur_type,headwear,outfit,accessory,selected_title,unlocked_items,unlocked_achievements,updated_at");
    } catch (error) {
      if (!/cat_profiles|schema cache|42P01|PGRST205/i.test(`${error.code || ""} ${error.message || ""}`)) throw error;
      supportsCats = false;
      return [];
    }
  };

  return {
    userId,
    get supportsAvatar() { return supportsAvatar; },
    get supportsCats() { return supportsCats; },
    async getOwnProfile() {
      let rows;
      try { rows = await api(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,display_name,avatar_url,created_at&limit=1`); }
      catch (error) {
        if (!/avatar_url/i.test(error.message)) throw error;
        supportsAvatar = false;
        rows = await api(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,display_name,created_at&limit=1`);
      }
      const profile = rows?.[0] || null;
      if (profile?.avatar_url) profile.avatar_url_signed = await signPath(profile.avatar_url);
      return profile;
    },
    async ensureProfile(displayName) {
      await api("/rest/v1/profiles?on_conflict=id", {
        method: "POST", headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ id: userId, display_name: displayName, group_code: GROUP_CODE }),
      });
    },
    async listData() {
      const [data, rawProfiles, rawCatProfiles] = await Promise.all([
        fetchCheckins(), fetchProfiles(), fetchCatProfiles(),
      ]);
      const profiles = await Promise.all((rawProfiles || []).map(async (profile) => ({ ...profile, avatar_url_signed: await signPath(profile.avatar_url) })));
      const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
      const checkins = await Promise.all((data || []).map(async (item, index) => {
        const profile = profileMap.get(item.user_id);
        return {
          id: item.id, userId: item.user_id, name: item.display_name, avatarUrl: profile?.avatar_url_signed || null,
          createdAt: item.created_at, type: item.training_type, details: item.details, parts: item.body_parts || undefined,
          duration: item.duration_minutes || undefined, note: item.note, photoPath: item.photo_url, photo: index < 20 ? await signPath(item.photo_url) : null,
          likes: Number(item.likes_count || 0), liked: Boolean(item.liked_by_me),
        };
      }));
      const catProfiles = (rawCatProfiles || []).map((profile) => normalizeCatProfile(profile, profile.user_id));
      return { checkins, profiles, catProfiles };
    },
    async createCheckin(input) {
      let photoPath = null;
      try {
        if (input.photo) photoPath = await uploadObject(input.photo, "checkin");
        await api("/rest/v1/checkins", {
          method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ user_id: userId, training_type: input.type, body_parts: input.parts, duration_minutes: input.duration, note: input.note, photo_url: photoPath, created_at: input.createdAt }),
        });
      } catch (error) {
        if (photoPath) await deleteObject(photoPath).catch(() => {});
        throw error;
      }
    },
    async updateCheckin(input) {
      const previousPhotoPath = input.originalPhotoPath || null;
      let photoPath = previousPhotoPath;
      let uploadedPhotoPath = null;
      if (input.photo) {
        uploadedPhotoPath = await uploadObject(input.photo, "checkin");
        photoPath = uploadedPhotoPath;
      } else if (input.removePhoto) {
        photoPath = null;
      }
      try {
        await api(`/rest/v1/checkins?id=eq.${encodeURIComponent(input.id)}&user_id=eq.${encodeURIComponent(userId)}`, {
          method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ training_type: input.type, body_parts: input.parts, duration_minutes: input.duration, note: input.note, photo_url: photoPath, created_at: input.createdAt }),
        });
      } catch (error) {
        if (uploadedPhotoPath) await deleteObject(uploadedPhotoPath).catch(() => {});
        throw error;
      }
      if (previousPhotoPath && previousPhotoPath !== photoPath) await deleteObject(previousPhotoPath).catch(() => {});
    },
    async deleteCheckin(input) {
      await api(`/rest/v1/checkins?id=eq.${encodeURIComponent(input.id)}&user_id=eq.${encodeURIComponent(userId)}`, { method: "DELETE" });
      if (input.originalPhotoPath) await deleteObject(input.originalPhotoPath).catch(() => {});
    },
    async updateProfile(input) {
      const previousPath = input.currentAvatarPath || null;
      let avatarPath = previousPath;
      let uploadedPath = null;
      if ((input.avatar || input.removeAvatar) && !supportsAvatar) throw new Error("请先运行数据库升级脚本，再修改头像");
      if (input.avatar) {
        uploadedPath = await uploadObject(input.avatar, "avatar");
        avatarPath = uploadedPath;
      } else if (input.removeAvatar) avatarPath = null;
      const payload = { display_name: input.name };
      if (supportsAvatar) payload.avatar_url = avatarPath;
      try {
        await api(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
          method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(payload),
        });
      } catch (error) {
        if (uploadedPath) await deleteObject(uploadedPath).catch(() => {});
        throw error;
      }
      if (previousPath && previousPath !== avatarPath) await deleteObject(previousPath).catch(() => {});
      return { avatarPath, avatarUrl: avatarPath ? await signPath(avatarPath) : null };
    },
    async saveCatProfile(input) {
      if (!supportsCats) return { synced: false };
      const profile = normalizeCatProfile(input, userId);
      await api("/rest/v1/cat_profiles?on_conflict=user_id", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          user_id: userId,
          fur_type: profile.furType,
          headwear: profile.headwear,
          outfit: profile.outfit,
          accessory: profile.accessory,
          selected_title: profile.selectedTitle,
          unlocked_items: profile.unlockedItems,
          unlocked_achievements: profile.unlockedAchievements,
          updated_at: new Date().toISOString(),
        }),
      });
      return { synced: true };
    },
    async toggleLike(id) {
      await api("/rest/v1/rpc/toggle_checkin_like", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target_checkin: id }) });
    },
  };
}

async function compressImage(file, maxBytes = 500 * 1024) {
  if (!file.type.startsWith("image/")) throw new Error("请选择图片文件");
  let source;
  let sourceUrl = "";
  try {
    if ("createImageBitmap" in window) source = await createImageBitmap(file);
  } catch (error) { console.warn("系统图片解码不可用，改用兼容模式", error); }
  if (!source) {
    sourceUrl = URL.createObjectURL(file);
    source = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("这张图片无法读取，请换一张再试"));
      image.src = sourceUrl;
    });
  }
  const width = source.width || source.naturalWidth;
  const height = source.height || source.naturalHeight;
  const scale = Math.min(1, 1400 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("当前浏览器无法处理图片，请换一张再试");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close?.();
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  const toBlob = (quality) => new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("图片压缩失败")), "image/webp", quality));
  let quality = 0.82;
  let blob = await toBlob(quality);
  while (blob.size > maxBytes && quality > 0.42) { quality -= 0.08; blob = await toBlob(quality); }
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp", lastModified: Date.now() });
}

function previewData() {
  const now = new Date();
  const ago = (hours) => new Date(now.getTime() - hours * 3600000).toISOString();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const previousWeek = (day, hour = 18) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() - 7 + day, hour).toISOString();
  const previousMonth = (day, hour = 18) => new Date(now.getFullYear(), now.getMonth() - 1, day, hour).toISOString();
  state.profiles = [
    { id: "preview", display_name: "阿飞不累", avatar_url_signed: null, created_at: ago(720) },
    { id: "friend-1", display_name: "朱紫瑶（见过张杰版）", avatar_url_signed: null, created_at: ago(700) },
    { id: "friend-2", display_name: "老周", avatar_url_signed: null, created_at: ago(600) },
    { id: "friend-3", display_name: "青鱼", avatar_url_signed: null, created_at: ago(48) },
    { id: "friend-4", display_name: "蛙蛙", avatar_url_signed: null, created_at: ago(1800) },
    { id: "friend-5", display_name: "故梦", avatar_url_signed: null, created_at: ago(2400) },
    { id: "friend-6", display_name: "天蝎-1", avatar_url_signed: null, created_at: ago(3000) },
    { id: "friend-7", display_name: "小鹿同学", avatar_url_signed: null, created_at: ago(36) },
    { id: "friend-8", display_name: "源氏的小钢刀", avatar_url_signed: null, created_at: ago(3600) },
    { id: "friend-9", display_name: "申懒腰", avatar_url_signed: null, created_at: ago(5000) },
    { id: "friend-10", display_name: "柚子", avatar_url_signed: null, created_at: ago(20) },
    { id: "friend-11", display_name: "Luna", avatar_url_signed: null, created_at: ago(4600) },
    { id: "friend-12", display_name: "阿豪", avatar_url_signed: null, created_at: ago(5600) },
  ];
  state.checkins = [
    { id: "p1", userId: "friend-1", name: "朱紫瑶（见过张杰版）", createdAt: ago(1), type: "力量", details: "背 + 二头 · 48分钟", parts: ["背", "二头"], duration: 48, note: "今天状态不错。", likes: 3, liked: false, photo: null, photoPath: null },
    { id: "p11", userId: "preview", name: "阿飞不累", createdAt: ago(4), type: "其他", details: "胸 + 跑步 · 62分钟", parts: ["胸", "跑步"], duration: 62, note: "力量和有氧都完成了。", likes: 4, liked: true, photo: null, photoPath: null },
    { id: "p12", userId: "friend-2", name: "老周", createdAt: ago(7), type: "爬楼", details: "爬楼 · 85分钟", parts: ["爬楼"], duration: 85, note: "一步一步往上。", likes: 6, liked: false, photo: null, photoPath: null },
    { id: "p13", userId: "friend-3", name: "青鱼", createdAt: ago(2), type: "跑步", details: "跑步 · 95分钟", parts: ["跑步"], duration: 95, note: "", likes: 2, liked: false, photo: null, photoPath: null },
    { id: "p14", userId: "friend-8", name: "源氏的小钢刀", createdAt: ago(3), type: "力量", details: "腿 · 70分钟", parts: ["腿"], duration: 70, note: "", likes: 2, liked: false, photo: null, photoPath: null },
    { id: "p15", userId: "friend-12", name: "阿豪", createdAt: ago(5), type: "力量", details: "胸 · 45分钟", parts: ["胸"], duration: 45, note: "", likes: 2, liked: false, photo: null, photoPath: null },
    { id: "p2", userId: "preview", name: "阿飞不累", createdAt: previousWeek(6, 20), type: "跑步", details: "跑步 · 36分钟", parts: [], duration: 36, note: "慢慢跑，也算到场。", likes: 5, liked: true, photo: null, photoPath: null },
    { id: "p3", userId: "preview", name: "阿飞不累", createdAt: previousWeek(4), type: "力量", details: "胸 + 三头 · 60分钟", parts: ["胸", "三头"], duration: 60, note: "", likes: 2, liked: false, photo: null, photoPath: null },
    { id: "p4", userId: "friend-1", name: "小鹿同学", createdAt: previousWeek(3), type: "力量", details: "臀腿 · 55分钟", parts: ["腿"], duration: 55, note: "", likes: 4, liked: false, photo: null, photoPath: null },
    { id: "p5", userId: "friend-2", name: "老周", createdAt: previousWeek(2), type: "骑行", details: "骑行 · 72分钟", parts: [], duration: 72, note: "风有点大，还是骑完了。", likes: 6, liked: false, photo: null, photoPath: null },
    { id: "p6", userId: "preview", name: "阿飞不累", createdAt: previousWeek(1), type: "力量", details: "背 + 二头 · 50分钟", parts: ["背", "二头"], duration: 50, note: "", likes: 3, liked: true, photo: null, photoPath: null },
    { id: "p7", userId: "preview", name: "阿飞不累", createdAt: previousMonth(23), type: "跑步", details: "跑步 · 45分钟", parts: [], duration: 45, note: "", likes: 2, liked: false, photo: null, photoPath: null },
    { id: "p8", userId: "friend-1", name: "小鹿同学", createdAt: previousMonth(18), type: "力量", details: "核心 · 40分钟", parts: ["核心"], duration: 40, note: "", likes: 1, liked: false, photo: null, photoPath: null },
    { id: "p9", userId: "friend-2", name: "老周", createdAt: previousMonth(12), type: "游泳", details: "游泳 · 65分钟", parts: [], duration: 65, note: "", likes: 5, liked: false, photo: null, photoPath: null },
    { id: "p10", userId: "preview", name: "阿飞不累", createdAt: previousMonth(5), type: "力量", details: "肩 + 核心 · 58分钟", parts: ["肩", "核心"], duration: 58, note: "", likes: 4, liked: true, photo: null, photoPath: null },
  ];
  state.catProfiles = [
    { ...defaultCatProfile("preview"), furType: "leo" },
    { ...defaultCatProfile("friend-3"), furType: "libra", selectedTitle: "还活着" },
    { ...defaultCatProfile("friend-12"), furType: "scorpio" },
  ];
  state.service = {
    userId: "preview", toggleLike: async () => {}, supportsCats: true,
    updateProfile: async (input) => ({ avatarPath: input.currentAvatarPath, avatarUrl: state.user.avatarUrl }),
    createCheckin: async () => {}, updateCheckin: async () => {}, deleteCheckin: async () => {}, saveCatProfile: async () => ({ synced: true }),
  };
}

function memberStats() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const map = new Map();
  const ensureMember = ({ id = "", name = "", avatarUrl = null, createdAt = null } = {}) => {
    const displayName = cleanDisplayName(name) || "47";
    const nameKey = displayNameKey(displayName) || `id:${id}`;
    if (!map.has(nameKey)) {
      map.set(nameKey, { id: id || nameKey, name: displayName, nameKey, profileIds: new Set(), avatarUrl, createdAt, weeklyCount: 0, weeklyMinutes: 0, monthlyCount: 0, monthlyMinutes: 0, yearlyCount: 0, yearlyMinutes: 0, totalCount: 0, totalMinutes: 0, streak: 0, dates: new Set() });
    }
    const member = map.get(nameKey);
    if (id) member.profileIds.add(id);
    if (id === state.user?.id) {
      member.id = id;
      member.name = cleanDisplayName(state.user?.name) || displayName;
      if (avatarUrl) member.avatarUrl = avatarUrl;
    } else if (!member.avatarUrl && avatarUrl) member.avatarUrl = avatarUrl;
    if (createdAt && (!member.createdAt || new Date(createdAt) < new Date(member.createdAt))) member.createdAt = createdAt;
    return member;
  };
  for (const profile of state.profiles) {
    ensureMember({ id: profile.id, name: profile.display_name, avatarUrl: profile.avatar_url_signed || null, createdAt: profile.created_at });
  }
  for (const item of state.checkins) {
    const member = ensureMember({ id: item.userId, name: item.name, avatarUrl: item.avatarUrl });
    const created = new Date(item.createdAt);
    const minutes = parseMinutes(item);
    if (!Number.isNaN(created.getTime())) {
      if (created >= weekStart) { member.weeklyCount += 1; member.weeklyMinutes += minutes; }
      if (created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()) {
        member.monthlyCount += 1;
        member.monthlyMinutes += minutes;
      }
      if (created.getFullYear() === now.getFullYear()) {
        member.yearlyCount += 1;
        member.yearlyMinutes += minutes;
      }
      member.dates.add(localDateKey(created));
    }
    member.totalCount += 1;
    member.totalMinutes += minutes;
  }
  for (const member of map.values()) {
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (!member.dates.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (member.dates.has(localDateKey(cursor))) { member.streak += 1; cursor.setDate(cursor.getDate() - 1); }
  }
  return [...map.values()].sort((a, b) => b.weeklyMinutes - a.weeklyMinutes || b.weeklyCount - a.weeklyCount || a.name.localeCompare(b.name, "zh-CN"));
}

function isCurrentMember(member) {
  if (!member || !state.user) return false;
  return member.profileIds?.has(state.user.id) || member.nameKey === displayNameKey(state.user.name);
}
function currentMember(members = memberStats()) { return members.find(isCurrentMember) || null; }

function memberRows(member) {
  if (!member) return [];
  return state.checkins.filter((item) => member.profileIds?.has(item.userId) || displayNameKey(item.name) === member.nameKey);
}
function memberFirstCheckin(rows = []) {
  const first = rows
    .map((item) => new Date(item.createdAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b)[0];
  if (!first) return "暂无打卡";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric", month: "numeric", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(first);
}
function memberFavoriteTraining(rows = []) {
  const counts = new Map();
  for (const row of rows) {
    const parts = parseParts(row).filter(Boolean);
    const selections = parts.length ? parts : [row.type].filter(Boolean);
    for (const item of new Set(selections)) counts.set(item, (counts.get(item) || 0) + 1);
  }
  const favorite = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))[0];
  return favorite ? `${favorite[0]} · ${favorite[1]}次` : "暂无记录";
}
function stableIndex(value, length) {
  let hash = 0;
  for (const character of String(value || "47")) hash = ((hash << 5) - hash + character.codePointAt(0)) | 0;
  return Math.abs(hash) % Math.max(1, length);
}
function catProfileFor(memberOrId) {
  const id = typeof memberOrId === "string" ? memberOrId : (memberOrId?.profileIds?.has(state.user?.id) ? state.user.id : memberOrId?.id);
  const stored = state.catProfiles.find((profile) => profile.userId === id);
  return normalizeCatProfile(stored || defaultCatProfile(id || "47"), id || "47");
}
function replaceCatProfile(profile) {
  const normalized = normalizeCatProfile(profile, profile.userId);
  state.catProfiles = [...state.catProfiles.filter((item) => item.userId !== normalized.userId), normalized];
  return normalized;
}
function isNewMember(member) {
  if (!member?.createdAt) return false;
  const joined = new Date(member.createdAt);
  return !Number.isNaN(joined.getTime()) && Date.now() - joined.getTime() <= 3 * 86400000;
}
function memberTodayState(member) {
  const rows = memberRows(member).filter((item) => localDateKey(item.createdAt) === localDateKey());
  const minutes = rows.reduce((sum, item) => sum + parseMinutes(item), 0);
  const parts = rows.flatMap(parseParts);
  const text = `${parts.join(" ")} ${rows.map((item) => item.type).join(" ")}`;
  const trained = rows.length > 0;
  let action = trained
    ? (/跑步|爬坡|爬楼|椭圆机|骑行|滑冰|篮球|跳操/.test(text) ? "run" : /拉伸|瑜伽/.test(text) ? "stretch" : /游泳/.test(text) ? "water" : "strength")
    : ["sit", "phone", "water"][stableIndex(member?.id, 3)];
  if (minutes >= 90) action = "rest";
  const kind = isNewMember(member) ? "new" : trained ? "trained" : "watching";
  return {
    kind,
    label: kind === "new" ? "新成员" : kind === "trained" ? "已打卡" : "围观中",
    action,
    rows,
    minutes,
    message: minutes >= 90 ? "今天练到关机" : trained ? "今天已经出动 ⚡" : "今天还在窝着",
  };
}
function hasResurrection(rows) {
  const dates = [...new Set(rows.map((item) => localDateKey(item.createdAt)).filter(Boolean))].sort();
  return dates.some((date, index) => index > 0 && (new Date(date) - new Date(dates[index - 1])) / 86400000 >= 14);
}
function progressFor(member) {
  const rows = memberRows(member);
  const now = Date.now();
  const late = rows.filter((item) => new Date(item.createdAt).getHours() >= 23).length;
  const early = rows.filter((item) => new Date(item.createdAt).getHours() < 8).length;
  const legs = rows.filter((item) => /腿|臀/.test(`${parseParts(item).join(" ")} ${item.type || ""}`)).length;
  const recent30 = rows.filter((item) => now - new Date(item.createdAt).getTime() <= 30 * 86400000).length;
  const memberAge = member?.createdAt ? (now - new Date(member.createdAt).getTime()) / 86400000 : 0;
  const resurrection = hasResurrection(rows);
  return { rows, late, early, legs, recent30, memberAge, resurrection };
}
const CAT_TITLES = [
  { id: "alive", label: "还活着", rule: "连续训练 7 天", test: (member) => member.streak >= 7 },
  { id: "regular", label: "健身房钉子户", rule: "累计打卡 50 次", test: (member) => member.totalCount >= 50 },
  { id: "night", label: "夜猫子", rule: "23:00 后完成 10 次打卡", test: (_, p) => p.late >= 10 },
  { id: "early", label: "早八战士", rule: "08:00 前完成 10 次打卡", test: (_, p) => p.early >= 10 },
  { id: "legs", label: "腿软猫", rule: "完成 10 次腿部训练", test: (_, p) => p.legs >= 10 },
  { id: "revive", label: "诈尸成功", rule: "停练 14 天后重新出动", test: (_, p) => p.resurrection },
  { id: "charity", label: "办卡慈善家", rule: "加入满 30 天且近 30 天打卡不超过 2 次", test: (_, p) => p.memberAge >= 30 && p.recent30 <= 2 },
];
const CAT_ACHIEVEMENTS = [
  { id: "first", label: "第一次出动", icon: "lightning", rule: "完成第一次打卡", test: (member) => member.totalCount >= 1 },
  { id: "streak3", label: "连续3天", icon: "fire", rule: "连续训练 3 天", test: (member) => member.streak >= 3 },
  { id: "streak7", label: "连续7天", icon: "calendar-check", rule: "连续训练 7 天", test: (member) => member.streak >= 7 },
  { id: "hours10", label: "累计10小时", icon: "clock", rule: "累计训练 10 小时", test: (member) => member.totalMinutes >= 600 },
  { id: "hours50", label: "累计50小时", icon: "trophy", rule: "累计训练 50 小时", test: (member) => member.totalMinutes >= 3000 },
  { id: "early", label: "晨练达人", icon: "sun-horizon", rule: "08:00 前完成 10 次打卡", test: (_, p) => p.early >= 10 },
  { id: "night", label: "夜猫子", icon: "moon-stars", rule: "23:00 后完成 10 次打卡", test: (_, p) => p.late >= 10 },
  { id: "revive", label: "诈尸成功", icon: "heartbeat", rule: "停练 14 天后重新出动", test: (_, p) => p.resurrection },
];
function unlockedFor(member) {
  const progress = progressFor(member);
  return {
    titles: CAT_TITLES.filter((item) => item.test(member, progress)),
    achievements: CAT_ACHIEVEMENTS.filter((item) => item.test(member, progress)),
  };
}
function selectedTitleFor(member, profile = catProfileFor(member)) {
  const unlocked = unlockedFor(member).titles;
  return unlocked.some((item) => item.label === profile.selectedTitle) ? profile.selectedTitle : "";
}
function recentDateOptions() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - index);
    return { key: localDateKey(date), day: index === 0 ? "今天" : ["日", "一", "二", "三", "四", "五", "六"][date.getDay()], label: `${date.getMonth() + 1}/${date.getDate()}` };
  });
}

function header(title = "") {
  return "";
}
function nav() {
  return `<nav class="bottom-nav" aria-label="主导航">${navItems.map(([route, label, iconName]) => {
    const active = state.route === route || (state.route === "tools" && route === "profile");
    return route === "checkin"
      ? `<button class="nav-primary" data-route="${route}" aria-label="${label}"><span class="primary-circle">${icon(iconName)}</span><span>${label}</span></button>`
      : `<button class="nav-item ${active ? "is-active" : ""}" data-route="${route}" ${active ? 'aria-current="page"' : ""}>${icon(iconName)}<span>${label}</span></button>`;
  }).join("")}</nav>`;
}
function connectionNotice() {
  if (state.connection !== "error") return "";
  return `<div class="notice-card">${icon("warning-circle")}<div><strong>暂时没有连上数据</strong><p>不会显示虚拟记录，检查网络后重试。</p></div><button data-action="retry">重试</button></div>`;
}
function weekBars(member) {
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const active = member?.dates?.has(localDateKey(date));
    const today = localDateKey(date) === localDateKey();
    return `<div class="week-day ${active ? "is-active" : ""} ${today ? "is-today" : ""}"><span>${["一", "二", "三", "四", "五", "六", "日"][index]}</span><i></i></div>`;
  }).join("");
}

function addDays(value, amount) {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}
function startOfWeek(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}
function reportPeriodLabel(start, end, type) {
  if (type === "month") return `${start.getFullYear()}年${start.getMonth() + 1}月`;
  const lastDay = addDays(end, -1);
  return `${start.getMonth() + 1}/${start.getDate()}–${lastDay.getMonth() + 1}/${lastDay.getDate()}`;
}
function createReport(type, start, end, publishedAt) {
  const grouped = new Map();
  const rows = state.checkins.filter((item) => {
    const date = new Date(item.createdAt);
    return !Number.isNaN(date.getTime()) && date >= start && date < end;
  });
  for (const item of rows) {
    const name = cleanDisplayName(item.name) || "47群友";
    const key = displayNameKey(name) || `id:${item.userId}`;
    if (!grouped.has(key)) grouped.set(key, { name, minutes: 0, checkins: 0, days: new Set() });
    const member = grouped.get(key);
    member.minutes += parseMinutes(item);
    member.checkins += 1;
    member.days.add(localDateKey(item.createdAt));
  }
  const ranking = [...grouped.values()]
    .map((member) => ({ ...member, activeDays: member.days.size }))
    .sort((a, b) => b.minutes - a.minutes || b.activeDays - a.activeDays || a.name.localeCompare(b.name, "zh-CN"));
  const totalMinutes = ranking.reduce((sum, member) => sum + member.minutes, 0);
  const timedRanking = ranking.filter((member) => member.minutes > 0);
  const periodLabel = reportPeriodLabel(start, end, type);
  const reportName = type === "week" ? "上周周报" : `${start.getMonth() + 1}月月报`;
  return {
    id: `report-${type}-${localDateKey(start)}`,
    feedKind: "report",
    reportType: type,
    reportName,
    periodLabel,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    createdAt: publishedAt.toISOString(),
    totalMinutes,
    activeCount: ranking.length,
    checkinCount: rows.length,
    top3: timedRanking.slice(0, 3),
    ranking: timedRanking,
  };
}
function scheduledReports(now = new Date()) {
  const reports = [];
  const currentWeek = startOfWeek(now);
  for (let index = 0; index < 6; index += 1) {
    const end = addDays(currentWeek, -7 * index);
    const start = addDays(end, -7);
    const publishedAt = new Date(end);
    publishedAt.setHours(REPORT_PUBLISH_HOUR, 0, 0, 0);
    if (publishedAt <= now) reports.push(createReport("week", start, end, publishedAt));
  }
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let index = 0; index < 3; index += 1) {
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - index, 1);
    const start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
    const publishedAt = new Date(end);
    publishedAt.setHours(REPORT_PUBLISH_HOUR, 0, 0, 0);
    if (publishedAt <= now) reports.push(createReport("month", start, end, publishedAt));
  }
  return reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
function homeFeedItems() {
  return [...state.checkins.map((item) => ({ ...item, feedKind: "checkin" })), ...scheduledReports()]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);
}
function reportById(id) { return scheduledReports().find((report) => report.id === id) || null; }

function roundedPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
function shortPosterText(ctx, value, maxWidth) {
  const original = String(value || "—");
  if (ctx.measureText(original).width <= maxWidth) return original;
  let text = original;
  while (text.length > 1 && ctx.measureText(`${text}…`).width > maxWidth) text = text.slice(0, -1);
  return `${text}…`;
}
function posterFont(weight, size) {
  const safeWeight = Math.min(900, Math.max(400, Math.round((Number(weight) || 400) / 100) * 100));
  return `${safeWeight} ${size}px "PingFang SC", "Microsoft YaHei", Arial, sans-serif`;
}
function drawPosterText(ctx, value, x, y, maxWidth, options = {}) {
  const { weight = 800, size = 16, minSize = 9, align = "left", color = "#090909" } = options;
  const original = String(value ?? "—");
  let fittedSize = size;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.font = posterFont(weight, fittedSize);
  while (fittedSize > minSize && ctx.measureText(original).width > maxWidth) {
    fittedSize -= 1;
    ctx.font = posterFont(weight, fittedSize);
  }
  const text = ctx.measureText(original).width <= maxWidth ? original : shortPosterText(ctx, original, maxWidth);
  ctx.fillText(text, x, y);
}
function drawLightning(ctx, x, y, radius = 22) {
  ctx.fillStyle = "#b8ff26";
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = "#090909"; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 3, y - 15); ctx.lineTo(x - 8, y + 1); ctx.lineTo(x - 1, y + 1);
  ctx.lineTo(x - 5, y + 16); ctx.lineTo(x + 10, y - 3); ctx.lineTo(x + 2, y - 3); ctx.closePath();
  ctx.fillStyle = "#090909"; ctx.fill();
}
function drawTrophy(ctx, x, y) {
  ctx.save();
  ctx.lineWidth = 4; ctx.strokeStyle = "#090909"; ctx.fillStyle = "#b8ff26";
  roundedPath(ctx, x, y, 78, 62, 13); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 12, y + 7); ctx.lineTo(x + 17, y + 48); ctx.lineTo(x + 61, y + 48); ctx.lineTo(x + 66, y + 7); ctx.stroke();
  ctx.beginPath(); ctx.arc(x - 1, y + 24, 17, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + 79, y + 24, 17, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 39, y + 62); ctx.lineTo(x + 39, y + 81); ctx.moveTo(x + 17, y + 82); ctx.lineTo(x + 61, y + 82); ctx.stroke();
  ctx.font = posterFont(900, 27); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff"; ctx.fillText("★", x + 39, y + 31);
  ctx.restore();
}
function formatReportHours(minutes) {
  const hours = Math.max(0, Number(minutes) || 0) / 60;
  if (hours >= 1000) return Math.round(hours).toLocaleString("zh-CN");
  return hours.toFixed(1).replace(/\.0$/, "");
}
function reportPosterLayout(report) {
  const ranking = (report.ranking || report.top3 || []).filter((member) => Number(member?.minutes) > 0);
  const remainingRows = Math.ceil(Math.max(0, ranking.length - 3) / 3);
  const rankingTop = 382;
  const rankingBottom = remainingRows ? 806 + remainingRows * 74 + 20 : 790;
  const footerY = rankingBottom + 48;
  return {
    ranking,
    remainingRows,
    rankingTop,
    rankingBottom,
    footerY,
    height: Math.max(960, footerY + 34),
  };
}
function drawReportPoster(canvas, report) {
  const baseWidth = 540;
  const layout = reportPosterLayout(report);
  const scale = canvas.width / baseWidth;
  const targetHeight = Math.round(layout.height * scale);
  if (canvas.height !== targetHeight) canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, baseWidth, layout.height);
  ctx.fillStyle = "#f4f4ef"; ctx.fillRect(0, 0, baseWidth, layout.height);
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#090909"; roundedPath(ctx, 28, 24, 484, 64, 22); ctx.fill();
  drawLightning(ctx, 59, 56, 17);
  drawPosterText(ctx, "嘎巴47", 88, 49, 180, { weight: 950, size: 20, color: "#ffffff" });
  drawPosterText(ctx, "一起运动 · 一起变强", 88, 67, 180, { weight: 650, size: 9, color: "#b8ff26" });
  drawPosterText(ctx, report.periodLabel, 488, 56, 180, { weight: 800, size: 12, minSize: 9, align: "right", color: "#ffffff" });

  ctx.fillStyle = "#090909"; roundedPath(ctx, 34, 116, 478, 246, 28); ctx.fill();
  ctx.fillStyle = "#b8ff26"; roundedPath(ctx, 28, 108, 478, 246, 28); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = "#090909"; ctx.stroke();
  const month = new Date(report.periodStart).getMonth() + 1;
  const reportTitle = report.reportType === "week" ? "上周训练周报" : `${month}月训练月报`;
  drawPosterText(ctx, report.reportType === "week" ? "WEEKLY REPORT" : "MONTHLY REPORT", 52, 137, 300, { weight: 900, size: 11 });
  drawPosterText(ctx, reportTitle, 52, 178, 422, { weight: 950, size: 42, minSize: 32 });
  ctx.fillStyle = "#ffffff"; roundedPath(ctx, 364, 128, 112, 34, 17); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = "#090909"; ctx.stroke();
  drawPosterText(ctx, report.reportType === "week" ? "上周结算" : "月度结算", 420, 146, 84, { weight: 900, size: 12, align: "center" });
  const averageMinutes = report.activeCount ? Math.round(report.totalMinutes / report.activeCount) : 0;
  const metrics = [
    ["累计时长", formatReportHours(report.totalMinutes), "小时"],
    ["活跃人数", report.activeCount, "人"],
    ["打卡次数", report.checkinCount, "次"],
    ["人均时长", formatReportHours(averageMinutes), "小时"],
  ];
  ctx.beginPath(); ctx.moveTo(52, 211); ctx.lineTo(482, 211); ctx.lineWidth = 1.5; ctx.strokeStyle = "#090909"; ctx.stroke();
  metrics.forEach(([label, value, unit], index) => {
    const left = 52 + index * 107.5;
    const center = left + 53.75;
    if (index) { ctx.beginPath(); ctx.moveTo(left, 226); ctx.lineTo(left, 306); ctx.lineWidth = 1.1; ctx.strokeStyle = "rgba(9, 9, 9, .35)"; ctx.stroke(); }
    drawPosterText(ctx, label, center, 230, 94, { weight: 800, size: 10, minSize: 8, align: "center", color: "#3f3f3a" });
    drawPosterText(ctx, value, center, 270, 92, { weight: 950, size: 31, minSize: 20, align: "center" });
    drawPosterText(ctx, unit, center, 297, 82, { weight: 800, size: 9, minSize: 8, align: "center", color: "#3f3f3a" });
  });
  drawPosterText(ctx, `统计周期  ${report.periodLabel}`, 52, 331, 410, { weight: 750, size: 12, minSize: 9 });

  ctx.fillStyle = "#ffffff"; roundedPath(ctx, 28, layout.rankingTop, 484, layout.rankingBottom - layout.rankingTop, 24); ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = "#090909"; ctx.stroke();
  ctx.fillStyle = "#090909"; roundedPath(ctx, 44, 398, 130, 32, 16); ctx.fill();
  drawPosterText(ctx, "♛  时长 TOP 3", 109, 415, 108, { weight: 900, size: 13, align: "center", color: "#ffffff" });
  drawPosterText(ctx, "按小时排名", 486, 415, 120, { weight: 750, size: 10, align: "right", color: "#74746f" });
  const podiumSlots = [
    { rank: 2, x: 44, y: 586, width: 148, height: 160, avatarY: 552, avatarRadius: 30, color: "#e3e6ea", nameY: 618, checkinY: 638, scoreY: 675, unitY: 701, labelY: 727 },
    { rank: 1, x: 190, y: 520, width: 160, height: 226, avatarY: 482, avatarRadius: 36, color: "#b8ff26", nameY: 558, checkinY: 579, scoreY: 624, unitY: 654, labelY: 718 },
    { rank: 3, x: 348, y: 618, width: 148, height: 128, avatarY: 588, avatarRadius: 28, color: "#f1bd84", nameY: 648, checkinY: 666, scoreY: 694, unitY: 716, labelY: 733 },
  ];
  podiumSlots.forEach((slot) => {
    const member = report.top3[slot.rank - 1] || null;
    const center = slot.x + slot.width / 2;
    ctx.fillStyle = slot.color; roundedPath(ctx, slot.x, slot.y, slot.width, slot.height, 18); ctx.fill();
    ctx.lineWidth = slot.rank === 1 ? 3 : 2; ctx.strokeStyle = "#090909"; ctx.stroke();

    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(center, slot.avatarY, slot.avatarRadius, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = slot.rank === 1 ? 3 : 2.2; ctx.strokeStyle = "#090909"; ctx.stroke();
    drawPosterText(ctx, member ? initials(member.name) : "—", center, slot.avatarY + 1, slot.avatarRadius * 1.35, { weight: 900, size: slot.rank === 1 ? 24 : 20, minSize: 14, align: "center" });
    if (slot.rank === 1) {
      ctx.fillStyle = "#090909"; roundedPath(ctx, center - 22, 438, 44, 26, 13); ctx.fill();
      drawPosterText(ctx, "♛", center, 452, 28, { weight: 900, size: 17, align: "center", color: "#ffffff" });
    }

    ctx.fillStyle = "#090909"; ctx.beginPath(); ctx.arc(slot.x + 19, slot.y + 19, 15, 0, Math.PI * 2); ctx.fill();
    drawPosterText(ctx, slot.rank, slot.x + 19, slot.y + 20, 20, { weight: 900, size: 13, align: "center", color: "#ffffff" });
    drawPosterText(ctx, member?.name || "等待上榜", center, slot.nameY, slot.width - 30, { weight: 900, size: slot.rank === 1 ? 15 : 13, minSize: 9, align: "center" });
    drawPosterText(ctx, member ? `${member.checkins} 次打卡` : "完成一次训练", center, slot.checkinY, slot.width - 30, { weight: 700, size: 9, minSize: 8, align: "center", color: "#565650" });
    drawPosterText(ctx, member ? formatReportHours(member.minutes) : "—", center, slot.scoreY, slot.width - 24, { weight: 900, size: slot.rank === 1 ? 35 : 28, minSize: 18, align: "center" });
    drawPosterText(ctx, member ? "小时" : "待挑战", center, slot.unitY, slot.width - 30, { weight: 700, size: 9, minSize: 8, align: "center", color: "#565650" });
    drawPosterText(ctx, slot.rank === 1 ? "冠军" : `第 ${slot.rank} 名`, center, slot.labelY, slot.width - 30, { weight: 900, size: 11, align: "center" });
  });
  ctx.beginPath(); ctx.moveTo(46, 746); ctx.lineTo(494, 746); ctx.lineWidth = 3; ctx.strokeStyle = "#090909"; ctx.stroke();

  const remaining = layout.ranking.slice(3);
  if (remaining.length) {
    drawPosterText(ctx, "其他训练成员", 44, 780, 170, { weight: 900, size: 13 });
    drawPosterText(ctx, `共 ${layout.ranking.length} 人有训练时长`, 494, 780, 220, { weight: 750, size: 9, minSize: 8, align: "right", color: "#74746f" });
    remaining.forEach((member, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const width = 145.33;
      const x = 44 + column * (width + 8);
      const y = 806 + row * 74;
      ctx.fillStyle = "#f4f4ef"; roundedPath(ctx, x, y, width, 62, 14); ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = "#090909"; ctx.stroke();
      ctx.fillStyle = "#090909"; ctx.beginPath(); ctx.arc(x + 16, y + 17, 11, 0, Math.PI * 2); ctx.fill();
      drawPosterText(ctx, index + 4, x + 16, y + 18, 17, { weight: 900, size: 9, minSize: 8, align: "center", color: "#ffffff" });
      drawPosterText(ctx, member.name, x + 32, y + 17, width - 42, { weight: 900, size: 11, minSize: 8 });
      drawPosterText(ctx, `${formatReportHours(member.minutes)} 小时 · ${member.checkins} 次`, x + width / 2, y + 44, width - 18, { weight: 800, size: 11, minSize: 8, align: "center", color: "#50504b" });
    });
  }

  drawLightning(ctx, 49, layout.footerY, 17);
  drawPosterText(ctx, "每一次打卡，都算数。", 78, layout.footerY - 5, 250, { weight: 950, size: 16 });
  drawPosterText(ctx, "嘎巴47 · 47群训练记录", 506, layout.footerY + 5, 210, { weight: 700, size: 9, align: "right", color: "#6c6c68" });
}
function paintReportCanvases() {
  const reports = new Map(scheduledReports().map((report) => [report.id, report]));
  document.querySelectorAll("canvas[data-report-canvas]").forEach((canvas) => {
    const report = reports.get(canvas.dataset.reportCanvas);
    if (report) drawReportPoster(canvas, report);
  });
  document.querySelectorAll("img[data-report-image]").forEach((image) => {
    const report = reports.get(image.dataset.reportImage);
    if (!report) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    drawReportPoster(canvas, report);
    image.src = canvas.toDataURL("image/png");
  });
}
function saveReportImage(report) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  drawReportPoster(canvas, report);
  try {
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `嘎巴47-${report.reportName}-${localDateKey(report.periodStart)}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("报表图片已生成");
  } catch (error) {
    console.error("报表图片生成失败", error);
    showToast("图片生成失败，请截图保存");
  }
}

function reportCard(report) {
  return `<article class="feed-card system-feed-card"><div class="feed-main"><span class="feed-avatar system-avatar">${icon("lightning")}</span><div class="feed-copy"><div class="feed-name-row"><strong>嘎巴47系统</strong><span class="feed-type">${report.reportType === "week" ? "周报" : "月报"}</span></div><p>${escapeHTML(report.reportName)}已生成 · ${escapeHTML(report.periodLabel)}</p><small>${escapeHTML(relativeTime(report.createdAt))}</small></div></div><button class="report-preview" data-action="open-report" data-report-id="${escapeHTML(report.id)}" aria-label="放大查看${escapeHTML(report.reportName)}"><canvas width="540" height="960" data-report-canvas="${escapeHTML(report.id)}"></canvas><span>${icon("arrows-out-simple")} 点击放大查看并保存</span></button></article>`;
}
function reportModal(report) {
  if (!report) return "";
  return `<div class="report-modal-backdrop" role="presentation"><section class="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-modal-title"><header><div><small>${escapeHTML(report.periodLabel)}</small><h2 id="report-modal-title">${escapeHTML(report.reportName)}</h2></div><button class="report-close" data-action="close-report" aria-label="关闭报表">${icon("x")}</button></header><div class="report-canvas-wrap"><img data-report-image="${escapeHTML(report.id)}" alt="${escapeHTML(report.reportName)}高清海报" /></div><div class="report-modal-actions"><p>长按海报可保存；普通浏览器也可点右侧按钮。</p><button data-action="save-report" data-report-id="${escapeHTML(report.id)}">${icon("download-simple")} 保存图片</button></div></section></div>`;
}

function activityCard(item) {
  const own = item.userId === state.user?.id;
  const heart = item.liked ? `<span class="liked-heart" aria-hidden="true">♥</span>` : icon("heart-straight");
  return `<article class="feed-card"><div class="feed-main">${avatarMarkup(item, "feed-avatar")}<div class="feed-copy"><div class="feed-name-row"><strong>${escapeHTML(item.name)}</strong><span class="feed-type">${escapeHTML(item.type)}</span></div><p>${escapeHTML(activitySummary(item))}</p><small>${escapeHTML(relativeTime(item.createdAt))}</small></div><div class="feed-controls"><button class="like-button ${item.liked ? "is-liked" : ""}" data-like="${escapeHTML(item.id)}" aria-label="${item.liked ? "取消点赞" : "点赞"}">${heart}<span>${item.likes}</span></button>${own ? `<button class="edit-button" data-edit-checkin="${escapeHTML(item.id)}" aria-label="编辑这条打卡">${icon("pencil-simple")}</button>` : ""}</div></div>${item.note ? `<p class="feed-note">${escapeHTML(item.note)}</p>` : ""}${item.photo ? `<img class="feed-photo" src="${escapeHTML(item.photo)}" alt="${escapeHTML(item.name)}的训练照片" loading="lazy" />` : ""}</article>`;
}

function homePage() {
  const members = memberStats();
  const me = currentMember(members) || { weeklyCount: 0, monthlyCount: 0, monthlyMinutes: 0, streak: 0, dates: new Set() };
  const reports = scheduledReports();
  const latest = reports[0];
  const feedItems = homeFeedItems();
  const latestButton = latest ? `<button class="latest-report-button" data-action="open-report" data-report-id="${escapeHTML(latest.id)}"><span class="latest-report-icon">${icon(latest.reportType === "week" ? "trophy" : "calendar-star")}</span><span><small>最近一期</small><strong>${escapeHTML(latest.reportName)}</strong></span>${icon("arrow-right")}</button>` : "";
  return `<main class="page page-home">${header("嘎巴47", true)}${connectionNotice()}<section class="weekly-card" aria-label="我的训练概览"><div class="metric-grid"><div><span>本周训练</span><strong>${me.weeklyCount}<small>次</small></strong></div><div><span>连续</span><strong>${me.streak}<small>天</small></strong></div><div><span>本月分钟</span><strong>${me.monthlyMinutes}<small>分钟</small></strong></div></div><div class="week-bars">${weekBars(me)}</div></section>${latestButton}<section class="feed-section"><div class="section-heading"><h2>动态</h2><span>${feedItems.length ? `${feedItems.length} 条最近动态` : "等待第一卡"}</span></div><div class="feed-list">${feedItems.length ? feedItems.map((item) => item.feedKind === "report" ? reportCard(item) : activityCard(item)).join("") : `<div class="empty-state">${icon("barbell")}<strong>还没有训练记录</strong><p>你来打第一卡，这里只展示真实数据。</p><button data-route="checkin">去打卡</button></div>`}</div></section></main>`;
}

function rankingPage() {
  const periods = {
    week: { label: "周榜", context: "本周", minutes: "weeklyMinutes", count: "weeklyCount" },
    month: { label: "月榜", context: "本月", minutes: "monthlyMinutes", count: "monthlyCount" },
    year: { label: "年榜", context: "今年", minutes: "yearlyMinutes", count: "yearlyCount" },
    all: { label: "总榜", context: "累计", minutes: "totalMinutes", count: "totalCount" },
  };
  const period = periods[state.rankingPeriod] || periods.week;
  const members = memberStats()
    .map((member) => ({ ...member, periodMinutes: member[period.minutes] || 0, periodCount: member[period.count] || 0 }))
    .filter((member) => member.periodMinutes > 0)
    .sort((a, b) => b.periodMinutes - a.periodMinutes || b.periodCount - a.periodCount || a.name.localeCompare(b.name, "zh-CN"));
  const myIndex = members.findIndex(isCurrentMember);
  const me = myIndex >= 0 ? members[myIndex] : null;
  const gapToPrevious = myIndex > 0 ? Math.max(0, members[myIndex - 1].periodMinutes - me.periodMinutes) : 0;
  const total = members.reduce((sum, member) => sum + member.periodMinutes, 0);
  const tabs = Object.entries(periods).map(([key, item]) => `<button class="ranking-tab ${state.rankingPeriod === key ? "is-active" : ""}" data-ranking-period="${key}" aria-pressed="${state.rankingPeriod === key}">${item.label}</button>`).join("");
  const chaseMessage = myIndex < 0
    ? `完成一次${period.context}打卡，就会进入${period.label}`
    : myIndex === 0
      ? "你正在领跑，继续把差距拉大"
      : gapToPrevious === 0
        ? "时长已经追平，增加打卡次数可继续上升"
        : `再练 ${gapToPrevious} 分钟，就能追平第 ${myIndex} 名`;
  const gapValue = myIndex < 0 ? "—" : myIndex === 0 ? "榜首" : gapToPrevious;
  const gapUnit = myIndex < 0 ? "未上榜" : myIndex === 0 ? "继续保持" : "分钟";
  return `<main class="page page-ranking">${header()}${connectionNotice()}<nav class="ranking-tabs" aria-label="排行榜周期">${tabs}</nav><section class="rank-hero"><div><span>我的排名</span><strong>${myIndex >= 0 ? `#${myIndex + 1}` : "—"}</strong></div><div><span>我的${period.context}时长</span><strong>${me?.periodMinutes || 0}<small>分钟</small></strong></div><div><span>距上一名</span><strong class="rank-gap-value">${gapValue}<small>${gapUnit}</small></strong></div></section><div class="rank-chase">${icon(myIndex === 0 ? "crown" : "lightning")}<strong>${escapeHTML(chaseMessage)}</strong><span>群内共 ${total} 分钟</span></div><section class="ranking-list">${members.length ? members.map((member, index) => {
    const gap = index === 0 ? null : Math.max(0, members[index - 1].periodMinutes - member.periodMinutes);
    const gapLabel = index === 0 ? "稳居榜首" : gap === 0 ? "同分钟，按次数排序" : `距上一名 ${gap} 分钟`;
    const podium = index < 3 ? `<span class="rank-medal podium-${index + 1}"><b>${index === 0 ? "♛" : index + 1}</b><small>TOP</small></span>` : `<span class="rank-index">${String(index + 1).padStart(2, "0")}</span>`;
    return `<article class="rank-row ${index < 3 ? `is-podium podium-row-${index + 1}` : ""} ${isCurrentMember(member) ? "is-me" : ""}">${podium}${avatarMarkup(member, "rank-avatar")}<div class="rank-copy"><div class="rank-name"><strong>${escapeHTML(member.name)}</strong>${isCurrentMember(member) ? `<span>我</span>` : ""}</div><small>${member.periodCount} 次打卡 · ${gapLabel}</small></div><div class="rank-score"><strong>${member.periodMinutes}</strong><span>分钟</span></div></article>`;
  }).join("") : `<div class="empty-state">${icon("trophy")}<strong>${period.label}还没人上榜</strong><p>完成一次打卡就会出现在这里。</p></div>`}</section></main>`;
}

function memberCatCard(member) {
  const profile = catProfileFor(member);
  const status = memberTodayState(member);
  return `<button class="member-list-row" data-member-id="${escapeHTML(member.id)}" aria-label="查看${escapeHTML(member.name)}的训练信息">${catCharacter(profile, { label: `${member.name}的星座猫` })}<span class="member-cat-copy"><strong>${escapeHTML(member.name)}</strong><small class="cat-status status-${status.kind}">${status.label}</small></span>${icon("caret-right")}</button>`;
}

const PLAZA_SPOTS = [
  [18, 43], [43, 41], [71, 44], [29, 50], [58, 51], [78, 53],
  [15, 59], [41, 58], [68, 61], [25, 67], [53, 68], [77, 67],
  [16, 75], [39, 77], [67, 76], [27, 84], [54, 83], [77, 84],
  [20, 88], [46, 87], [72, 88], [10, 66], [86, 70], [48, 47],
];

function plazaMotion(member, index, count) {
  const [baseX, baseY] = PLAZA_SPOTS[index % PLAZA_SPOTS.length];
  const hash = stableIndex(`${member.id}:${member.name}`, 100003);
  const layer = Math.floor(index / PLAZA_SPOTS.length);
  const x = Math.max(8, Math.min(88, baseX + ((hash % 7) - 3) + (layer % 2 ? 3 : -2)));
  const y = Math.max(41, Math.min(89, baseY + ((Math.floor(hash / 7) % 7) - 3)));
  const dx1 = (hash % 17) - 8;
  const dy1 = (Math.floor(hash / 17) % 15) - 7;
  const dx2 = (Math.floor(hash / 31) % 19) - 9;
  const dy2 = (Math.floor(hash / 53) % 17) - 8;
  const duration = 13 + (hash % 9);
  const delay = -(hash % 12);
  const size = 15;
  return `--x:${x}%;--y:${y}%;--dx1:${dx1}px;--dy1:${dy1}px;--dx2:${dx2}px;--dy2:${dy2}px;--wander-duration:${duration}s;--wander-delay:${delay}s;--cat-size:${size}%;--depth:${100 + Math.round(y)}`;
}

function plazaCatCard(member, index, count) {
  const profile = catProfileFor(member);
  const weeklyCrown = member.weeklyCount > 0 ? `<span class="weekly-crown" aria-label="本周已打卡">${icon("crown")}</span>` : "";
  return `<button class="plaza-cat" style="${plazaMotion(member, index, count)}" data-member-id="${escapeHTML(member.id)}" aria-label="查看${escapeHTML(member.name)}的训练信息${member.weeklyCount > 0 ? "，本周已打卡" : ""}"><span class="plaza-cat-motion">${weeklyCrown}<span class="plaza-cat-sprite">${catCharacter(profile, { label: `${member.name}的星座猫` })}</span><strong class="plaza-cat-name">${escapeHTML(member.name)}</strong></span></button>`;
}
function memberDetailModal() {
  const member = memberStats().find((item) => item.id === state.memberModal);
  if (!member) return "";
  const profile = catProfileFor(member);
  const status = memberTodayState(member);
  const title = selectedTitleFor(member, profile);
  const rows = memberRows(member);
  const periods = [
    ["累计", member.totalMinutes, member.totalCount],
    ["今年", member.yearlyMinutes, member.yearlyCount],
    ["本月", member.monthlyMinutes, member.monthlyCount],
    ["本周", member.weeklyMinutes, member.weeklyCount],
  ].map(([label, minutes, count]) => `<article class="member-period-card"><span>${label}</span><strong>${formatReportHours(minutes)}<small>小时</small></strong><em>${count} 次训练</em></article>`).join("");
  return `<div class="modal-backdrop member-backdrop" role="presentation"><section class="modal-sheet member-sheet" role="dialog" aria-modal="true" aria-labelledby="member-title"><button class="member-close" data-action="close-member" aria-label="关闭">${icon("x")}</button><div class="member-sheet-head"><div class="member-detail-cat">${catCharacter(profile, { action: status.action, label: `${member.name}的猫咪` })}<span class="cat-status status-${status.kind}">${status.label}</span></div><div class="member-detail-copy"><small>群友训练档案</small><h2 id="member-title">${escapeHTML(member.name)}</h2>${title ? `<p class="member-title-badge">${icon("seal-check")} ${escapeHTML(title)}</p>` : ""}</div></div><div class="member-period-grid" aria-label="训练时长与次数">${periods}</div><div class="member-insights"><div class="member-insight"><i>${icon("calendar-check")}</i><span><small>首次打卡时间</small><strong>${escapeHTML(memberFirstCheckin(rows))}</strong></span></div><div class="member-insight"><i>${icon("barbell")}</i><span><small>最喜欢训练</small><strong>${escapeHTML(memberFavoriteTraining(rows))}</strong></span></div><div class="member-insight"><i>${icon("fire")}</i><span><small>当前连续打卡</small><strong>${member.streak} 天</strong></span></div></div><p class="member-detail-status">${escapeHTML(status.message)}</p></section></div>`;
}
function plazaPage() {
  const members = memberStats();
  const todayCount = members.filter((member) => memberTodayState(member).rows.length > 0).length;
  const newCount = members.filter(isNewMember).length;
  const scene = members.length
    ? members.map((member, index) => plazaCatCard(member, index, members.length)).join("")
    : `<div class="plaza-empty"><strong>广场还空着</strong><span>第一只星座猫加入后就会出现。</span></div>`;
  return `<main class="page page-plaza">${connectionNotice()}<section class="fantasy-plaza-card"><div class="plaza-card-head"><div class="plaza-meta"><div><small>GABA 47</small><h2>嘎巴训练大厅</h2></div><span>${icon("crown")} 本周打卡戴皇冠</span></div><div class="plaza-stats" aria-label="广场统计"><div><span>群友</span><strong>${members.length}</strong></div><div><span>今日打卡</span><strong>${todayCount}</strong></div><div><span>新加入</span><strong>${newCount}</strong></div></div></div><div class="fantasy-plaza" aria-label="47群友星座猫奇幻健身广场">${scene}</div><button class="view-members-button" data-action="toggle-member-list">${icon("list-dashes")}<span>${state.showAllMembers ? "收起群友列表" : "查看全部群友"}</span>${icon(state.showAllMembers ? "caret-up" : "caret-down")}</button></section>${state.showAllMembers ? `<section class="all-members"><div class="section-heading"><h2>全部群友</h2><span>${members.length} 人</span></div><div class="member-list">${members.map((member) => memberCatCard(member)).join("")}</div></section>` : ""}</main>`;
}

function catEditorPanel(member, profile) {
  if (!state.catEditor.open) return "";
  const draft = normalizeCatProfile(state.catEditor.draft || profile, state.user.id);
  const selected = catProfileDescriptor(draft);
  const options = CAT_FUR_OPTIONS.map((item) => `<button class="zodiac-choice ${draft.furType === item.value ? "is-selected" : ""}" data-cat-field="furType" data-cat-value="${item.value}" aria-pressed="${draft.furType === item.value}"><img src="${item.asset}" alt="" loading="lazy" decoding="async" /><span><strong>${item.label}</strong><small>${item.breed}</small></span></button>`).join("");
  return `<section class="cat-editor"><div class="cat-editor-preview">${catCharacter(draft, { label: "星座猫形象预览" })}<div><span>当前选择</span><strong>${selected.label} · ${selected.breed}</strong><small>保存后会同步成为全站头像</small></div></div><section class="cat-option-group"><h3>选择你的星座猫</h3><div class="zodiac-choice-grid">${options}</div></section>${state.catEditor.status ? `<p class="cat-save-status">${escapeHTML(state.catEditor.status)}</p>` : ""}<div class="cat-editor-actions"><button class="secondary-button" data-action="close-cat-editor">取消</button><button class="primary-button" data-action="save-cat" ${state.catEditor.saving ? "disabled" : ""}>${state.catEditor.saving ? "正在保存…" : "保存形象"}</button></div></section>`;
}
function catDenPage() {
  const members = memberStats();
  const me = currentMember(members) || { id: state.user.id, name: state.user.name, profileIds: new Set([state.user.id]), monthlyCount: 0, totalMinutes: 0, streak: 0, totalCount: 0, createdAt: new Date().toISOString() };
  const profile = catProfileFor(me);
  const today = memberTodayState(me);
  const unlocked = unlockedFor(me);
  const title = selectedTitleFor(me, profile);
  return `<main class="page page-catden"><header class="feature-heading"><span class="feature-kicker">猫窝</span><h1>我的猫窝</h1><p>今天你的猫是什么状态？</p></header>${connectionNotice()}<section class="catden-hero"><div class="catden-label"><span>${escapeHTML(state.user.name)}</span>${title ? `<strong>${icon("seal-check")} ${escapeHTML(title)}</strong>` : ""}</div><div class="catden-character">${catCharacter(profile, { action: today.action, label: `${state.user.name}的猫咪` })}</div><p>${escapeHTML(today.message)}</p><div class="catden-metrics"><div><span>本月</span><strong>${me.monthlyCount}<small>次</small></strong></div><div><span>累计</span><strong>${formatReportHours(me.totalMinutes)}<small>小时</small></strong></div><div><span>连续</span><strong>${me.streak}<small>天</small></strong></div></div><button class="cat-change-button" data-action="open-cat-editor">${icon("t-shirt")} 换装</button></section>${catEditorPanel(me, profile)}<section class="catden-section"><div class="section-heading"><h2>我的称号</h2><span>${unlocked.titles.length} / ${CAT_TITLES.length} 已解锁</span></div><div class="current-title-card"><span>${icon("seal-check")}</span><div><small>当前展示</small><strong>${escapeHTML(title || "还没有选择称号")}</strong></div><button data-action="open-cat-editor">选择</button></div></section><section class="catden-section"><div class="section-heading"><h2>猫猫成就</h2><span>${unlocked.achievements.length} / ${CAT_ACHIEVEMENTS.length}</span></div><div class="achievement-grid">${CAT_ACHIEVEMENTS.map((item) => { const earned = unlocked.achievements.some((achievement) => achievement.id === item.id); return `<button class="achievement-card ${earned ? "is-earned" : ""}" data-achievement-rule="${escapeHTML(item.rule)}"><span>${icon(item.icon)}</span><strong>${item.label}</strong><small>${earned ? "已获得" : "未获得"}</small></button>`; }).join("")}</div></section></main>`;
}

function toolsPage() {
  const result = state.tools.diceIndex === null ? "等你掷骰子" : diceExercises[state.tools.diceIndex];
  const cubeClass = state.tools.diceIndex === null ? "show-face-0" : `show-face-${state.tools.diceIndex}`;
  return `<main class="page page-tools">${header("工具")}<section class="tool-card dice-tool"><div class="tool-heading"><span class="tool-number">01</span><div><h2>掷骰子随机运动</h2><p>胸、背、臀腿、肩、手臂、核心，交给骰子。</p></div></div><div class="dice-layout"><div class="dice-stage" aria-hidden="true"><div class="exercise-dice ${cubeClass} ${state.tools.diceRolling ? "is-rolling" : ""}">${diceExercises.map((exercise, index) => `<span class="dice-face face-${index}">${exercise}</span>`).join("")}</div></div><div class="dice-result" aria-live="polite"><span>今天练</span><strong>${escapeHTML(result)}</strong></div></div><button class="tool-action" data-action="roll-dice" ${state.tools.diceRolling ? "disabled" : ""}>${icon("dice-six")}<span>${state.tools.diceRolling ? "正在掷…" : "掷一下"}</span>${icon("arrow-clockwise")}</button></section><section class="tool-card heart-tool"><div class="tool-heading"><span class="tool-number">02</span><div><h2>最佳燃脂心率</h2><p>按最大心率的 60%–70% 估算参考区间。</p></div></div><div class="tool-input-row"><label class="tool-field"><span>年龄</span><span class="input-with-unit"><input id="age-input" type="number" min="12" max="100" inputmode="numeric" placeholder="例如 30" /><em>岁</em></span></label><button class="calculate-button" data-action="calculate-heart">计算</button></div><div class="tool-output" id="heart-output" aria-live="polite"><span>参考燃脂心率</span><strong>—</strong><small>次 / 分钟</small></div><p class="tool-formula">公式：（220 − 年龄）× 60%～70%</p></section><section class="tool-card bmi-tool"><div class="tool-heading"><span class="tool-number">03</span><div><h2>BMI 计算</h2><p>输入身高和体重，看看现在处在哪个区间。</p></div></div><div class="bmi-fields"><label class="tool-field"><span>身高</span><span class="input-with-unit"><input id="height-input" type="number" min="100" max="230" inputmode="decimal" placeholder="例如 170" /><em>cm</em></span></label><label class="tool-field"><span>体重</span><span class="input-with-unit"><input id="weight-input" type="number" min="25" max="300" step="0.1" inputmode="decimal" placeholder="例如 65" /><em>kg</em></span></label></div><button class="calculate-button bmi-calculate" data-action="calculate-bmi">计算 BMI</button><div class="tool-output bmi-output" id="bmi-output" aria-live="polite"><span>你的 BMI</span><strong>—</strong><small>等待计算</small></div><p class="tool-formula">BMI ＝ 体重（kg）÷ 身高²（m²）</p></section><p class="tools-note">心率和 BMI 仅作日常运动参考；如有心脏疾病、正在服药或运动不适，请先咨询专业医生。</p></main>`;
}

function integratedToolsPage() {
  return toolsPage()
    .replace('<main class="page page-tools">', `<main class="page page-tools"><header class="edit-header tool-page-header"><button class="icon-button" data-route="profile" aria-label="返回我的">${icon("arrow-left")}</button><h1>运动工具</h1><span></span></header>`)
    .replace('<section class="tool-card dice-tool">', `<section id="tool-dice" class="tool-card dice-tool ${state.tools.focus === "dice" ? "is-focused" : ""}">`)
    .replace('<section class="tool-card heart-tool">', `<section id="tool-heart" class="tool-card heart-tool ${state.tools.focus === "heart" ? "is-focused" : ""}">`)
    .replace('<section class="tool-card bmi-tool">', `<section id="tool-bmi" class="tool-card bmi-tool ${state.tools.focus === "bmi" ? "is-focused" : ""}">`);
}

function profileEditorModal() {
  const form = state.profileEditor;
  const preview = form.removeAvatar ? "" : (form.avatarUrl || state.user?.avatarUrl || "");
  return `<div class="modal-backdrop" role="presentation"><section class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="profile-editor-title"><div class="modal-head"><h2 id="profile-editor-title">编辑资料</h2><button class="icon-button" data-action="close-profile-editor" aria-label="关闭">${icon("x")}</button></div><label class="avatar-picker">${preview ? `<span class="profile-avatar has-image"><img src="${escapeHTML(preview)}" alt="头像预览" /></span>` : `<span class="profile-avatar">${escapeHTML(initials(form.name))}</span>`}<span>选择新头像</span><input id="avatar-input" type="file" accept="image/*" /></label>${(state.user?.avatarUrl || form.avatarUrl) && !form.removeAvatar ? `<button class="text-button danger" data-action="remove-avatar">移除头像</button>` : ""}<label class="field-label"><span>昵称</span><input id="profile-name-input" maxlength="20" value="${escapeHTML(form.name)}" autocomplete="nickname" /></label>${form.status ? `<p class="form-status">${escapeHTML(form.status)}</p>` : ""}<button class="primary-button" data-action="save-profile" ${form.saving ? "disabled" : ""}>${form.saving ? "正在保存…" : "保存修改"}</button></section></div>`;
}

function profilePage() {
  const members = memberStats();
  const me = currentMember(members) || { monthlyCount: 0, monthlyMinutes: 0, streak: 0, dates: new Set() };
  const now = new Date();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const offset = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7;
  const cells = Math.ceil((offset + days) / 7) * 7;
  return `<main class="page">${header("我的")}<section class="profile-card"><div class="profile-head">${avatarMarkup(state.user, "profile-avatar")}<div class="profile-copy"><h1>${escapeHTML(state.user?.name)}</h1><p>每一次坚持，都算你的。</p></div><button class="outline-button" data-action="open-profile-editor">编辑资料</button></div><div class="profile-metrics"><div><span>连续</span><strong>${me.streak}<small>天</small></strong></div><div><span>本月</span><strong>${me.monthlyCount}<small>次</small></strong></div><div><span>本月</span><strong>${me.monthlyMinutes}<small>分钟</small></strong></div></div><div class="calendar-panel"><div class="section-heading"><h2>${now.getMonth() + 1}月训练日历</h2><span>${me.monthlyCount} 次</span></div><div class="weekdays">${["一", "二", "三", "四", "五", "六", "日"].map((day) => `<span>${day}</span>`).join("")}</div><div class="training-calendar">${Array.from({ length: cells }, (_, i) => { const day = i - offset + 1; const key = day > 0 && day <= days ? localDateKey(new Date(now.getFullYear(), now.getMonth(), day)) : ""; return `<span class="${key && me.dates?.has(key) ? "trained" : ""}">${day > 0 && day <= days ? day : ""}</span>`; }).join("")}</div></div></section>${connectionNotice()}<section class="settings-list"><button class="action-row" data-action="open-profile-editor">${icon("user-circle")}<span>修改昵称和头像</span>${icon("caret-right")}</button><button class="action-row" data-action="retry">${icon("cloud-check")}<span>数据连接</span><small>${state.connection === "ready" || state.connection === "preview" ? "云端正常" : "点击重试"}</small></button><button class="action-row" data-route="checkin">${icon("calendar-plus")}<span>补一条训练记录</span>${icon("caret-right")}</button></section></main>${state.profileEditor.open ? profileEditorModal() : ""}`;
}

function nicknameEditorModal() {
  const form = state.profileEditor;
  return `<div class="modal-backdrop" role="presentation"><section class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="profile-editor-title"><div class="modal-head"><h2 id="profile-editor-title">修改昵称</h2><button class="icon-button" data-action="close-profile-editor" aria-label="关闭">${icon("x")}</button></div><p class="nickname-editor-note">头像由你选择的星座猫自动生成。</p><label class="field-label"><span>昵称</span><input id="profile-name-input" maxlength="20" value="${escapeHTML(form.name)}" autocomplete="nickname" /></label>${form.status ? `<p class="form-status">${escapeHTML(form.status)}</p>` : ""}<button class="primary-button" data-action="save-profile" ${form.saving ? "disabled" : ""}>${form.saving ? "正在保存…" : "保存昵称"}</button></section></div>`;
}

function integratedProfilePage() {
  const members = memberStats();
  const me = currentMember(members) || { id: state.user.id, name: state.user.name, nameKey: displayNameKey(state.user.name), profileIds: new Set([state.user.id]), monthlyCount: 0, monthlyMinutes: 0, totalMinutes: 0, weeklyCount: 0, streak: 0, dates: new Set(), createdAt: new Date().toISOString() };
  const profile = catProfileFor(me);
  const descriptor = catProfileDescriptor(profile);
  const now = new Date();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const offset = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7;
  const cells = Math.ceil((offset + days) / 7) * 7;
  const calendar = Array.from({ length: cells }, (_, i) => {
    const day = i - offset + 1;
    const key = day > 0 && day <= days ? localDateKey(new Date(now.getFullYear(), now.getMonth(), day)) : "";
    return `<span class="${key && me.dates?.has(key) ? "trained" : ""}">${day > 0 && day <= days ? day : ""}</span>`;
  }).join("");
  const tools = `<section class="profile-tools"><div class="section-heading"><h2>工具</h2><span>常用功能都在这里</span></div><div class="profile-tool-grid"><button class="profile-tool-button tool-dice-button" data-route="tools" data-tool-focus="dice">${icon("dice-six")}<span><strong>训练骰子</strong><small>随机决定练什么</small></span>${icon("caret-right")}</button><button class="profile-tool-button tool-heart-button" data-route="tools" data-tool-focus="heart">${icon("heartbeat")}<span><strong>燃脂心率</strong><small>估算运动区间</small></span>${icon("caret-right")}</button><button class="profile-tool-button tool-bmi-button" data-route="tools" data-tool-focus="bmi">${icon("calculator")}<span><strong>BMI 计算</strong><small>查看体重区间</small></span>${icon("caret-right")}</button><a class="profile-tool-button coffee-link" href="https://docs.qq.com/sheet/DZXZ6WXBZc0t0TnZt" target="_blank" rel="noopener noreferrer">${icon("coffee")}<span><strong>咖啡打卡</strong><small>记录今天这一杯</small></span>${icon("arrow-up-right")}</a><a class="profile-tool-button listen-link" href="https://guhuding-lang.github.io/menu-slot/j/" target="_blank" rel="noopener noreferrer">${icon("headphones")}<span><strong>随听机</strong><small>随机听点不一样的</small></span>${icon("arrow-up-right")}</a></div></section>`;
  return `<main class="page page-profile"><section class="profile-zodiac-card"><div class="profile-zodiac-cat">${catCharacter(profile, { label: `${state.user.name}的${descriptor.label}猫` })}</div><div class="profile-zodiac-copy"><span class="profile-zodiac-chip">${descriptor.label} · ${descriptor.breed}</span><h1>${escapeHTML(state.user.name)}</h1><p>这只猫会成为你在嘎巴47里的统一头像。</p><div class="profile-zodiac-actions"><button data-action="open-cat-editor">${icon("sparkle")} 选择形象</button><button data-action="open-profile-editor">修改昵称</button></div></div></section>${catEditorPanel(me, profile)}<section class="profile-metrics"><div><span>连续</span><strong>${me.streak}<small>天</small></strong></div><div><span>本月</span><strong>${me.monthlyCount}<small>次</small></strong></div><div><span>本月</span><strong>${formatReportHours(me.monthlyMinutes)}<small>小时</small></strong></div></section><section class="calendar-panel"><div class="section-heading"><h2>${now.getMonth() + 1}月训练日历</h2><span>${me.monthlyCount} 次</span></div><div class="weekdays">${["一", "二", "三", "四", "五", "六", "日"].map((day) => `<span>${day}</span>`).join("")}</div><div class="training-calendar">${calendar}</div></section>${connectionNotice()}${tools}<section class="settings-list"><button class="action-row" data-action="retry">${icon("cloud-check")}<span>数据连接</span><small>${state.connection === "ready" || state.connection === "preview" ? "云端正常" : "点击重试"}</small></button><button class="action-row" data-route="checkin">${icon("calendar-plus")}<span>补一条训练记录</span>${icon("caret-right")}</button></section></main>${state.profileEditor.open ? nicknameEditorModal() : ""}`;
}

function deleteDialog() {
  return `<div class="modal-backdrop" role="presentation"><section class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><span class="danger-icon">${icon("trash")}</span><h2 id="delete-title">删除这条打卡？</h2><p>删除后无法恢复，点赞也会一起移除。</p><div class="confirm-actions"><button class="secondary-button" data-action="cancel-delete">取消</button><button class="danger-button" data-action="confirm-delete">确认删除</button></div></section></div>`;
}

function checkinPage() {
  const form = state.checkinForm;
  const recentDates = recentDateOptions();
  const trainingSelector = trainingOptions.map(([option, iconName]) => `<button class="type-button ${form.parts.includes(option) ? "is-selected" : ""}" data-part="${option}" aria-pressed="${form.parts.includes(option)}">${icon(iconName)}<span>${option}</span></button>`).join("");
  return `<main class="page page-checkin"><header class="edit-header"><button class="icon-button" data-action="close-checkin" aria-label="返回">${icon("arrow-left")}</button><h1>${form.editing ? "编辑打卡" : "发布打卡"}</h1>${form.editing ? `<button class="delete-link" data-action="ask-delete">删除</button>` : `<span></span>`}</header>${connectionNotice()}<section class="editor-card"><div class="form-section date-section"><div class="form-section-title"><h2>训练日期</h2><span>支持近一周补打卡</span></div><div class="date-picker">${recentDates.map((item) => `<button class="date-button ${form.date === item.key ? "is-selected" : ""}" data-date="${item.key}" aria-pressed="${form.date === item.key}"><strong>${item.day}</strong><span>${item.label}</span></button>`).join("")}</div></div><section class="form-section"><div class="form-section-title"><h2>训练内容 <small>可多选</small></h2><span>力量、有氧可以一起选</span></div><div class="type-grid training-grid">${trainingSelector}</div></section><section class="form-section"><h2>训练时长</h2><div class="duration-stepper"><button data-duration="-5" aria-label="减少5分钟">${icon("minus")}</button><strong>${form.duration}<span>分钟</span></strong><button data-duration="5" aria-label="增加5分钟">${icon("plus")}</button></div></section><section class="form-section"><h2>训练照片 <small>选填</small></h2><label class="photo-upload">${form.photoUrl && !form.removePhoto ? `<img class="photo-preview" src="${escapeHTML(form.photoUrl)}" alt="训练照片预览" />` : `${icon("camera")}<strong>添加训练照</strong><span>自动压缩后上传</span>`}<input id="photo-input" type="file" accept="image/*" /></label>${form.photoUrl && !form.removePhoto ? `<button class="text-button danger" data-action="remove-checkin-photo">移除照片</button>` : ""}${form.uploadStatus ? `<p class="form-status">${escapeHTML(form.uploadStatus)}</p>` : ""}</section><section class="form-section"><h2>训练感受 <small>选填</small></h2><textarea id="note-input" maxlength="300" placeholder="写一句真实感受，不写也可以">${escapeHTML(form.note)}</textarea></section><button class="primary-button" data-action="submit-checkin" ${form.submitting || (state.connection !== "ready" && state.connection !== "preview") ? "disabled" : ""}>${form.submitting ? "正在保存…" : form.editing ? "保存修改" : "完成打卡"}</button><p class="privacy-note">${icon("lock-simple")} 仅47群成员可见</p></section></main>${state.deleteConfirm ? deleteDialog() : ""}`;
}

function joinPage(error = "") {
  return `<main class="join-page"><h1 class="join-mark">嘎巴47</h1><form class="join-form" id="join-form"><label><span>群邀请码</span><input name="code" placeholder="请输入群邀请码" value="" autocomplete="off" autocapitalize="characters" /></label><label><span>你的昵称</span><input name="name" placeholder="群友认得出的名字" maxlength="20" autocomplete="nickname" /></label>${error ? `<p class="form-error">${escapeHTML(error)}</p>` : ""}<button class="primary-button" type="submit">进入嘎巴47 ${icon("arrow-right")}</button><p class="privacy-note">${icon("lock-simple")} 47群专属</p></form></main>`;
}

function identityIssuePage() {
  return `<main class="join-page identity-page"><h1 class="join-mark">嘎巴47</h1><section class="identity-card">${icon("shield-warning")}<h1>身份没有被覆盖</h1><p>检测到这台设备保存的旧身份与当前云端会话不同。为避免再创建一个用户，嘎巴已暂停自动建档。</p><small>请回到原来使用嘎巴47的同一浏览器打开；如果仍看到这里，再联系我处理已有两个身份的合并。</small><button class="primary-button" data-action="retry">重新检查</button></section></main>`;
}
function loadingPage() { return `<div class="app-shell"><div class="loading-page"><div><span class="loading-mark"></span><strong>等待嘎巴</strong></div></div></div>`; }

function render() {
  if (state.booting) { app.innerHTML = loadingPage(); return; }
  if (state.identityIssue) { app.innerHTML = identityIssuePage(); return; }
  if (!state.user) { app.innerHTML = joinPage(); return; }
  const pages = { home: homePage, ranking: rankingPage, plaza: plazaPage, tools: integratedToolsPage, profile: integratedProfilePage, checkin: checkinPage };
  const page = (pages[state.route] || homePage)();
  const openReport = state.reportModal ? reportById(state.reportModal) : null;
  app.innerHTML = `<div class="app-shell">${page}${state.route !== "checkin" ? nav() : ""}${openReport ? reportModal(openReport) : ""}${state.memberModal ? memberDetailModal() : ""}${state.toast ? `<div class="toast" role="status">${escapeHTML(state.toast)}</div>` : ""}</div>`;
  requestAnimationFrame(paintReportCanvases);
}
function showToast(message) {
  state.toast = message;
  clearTimeout(state.toastTimer);
  render();
  state.toastTimer = setTimeout(() => { state.toast = ""; render(); }, 2400);
}
async function loadData() {
  if (!state.service) return;
  const data = await state.service.listData();
  state.checkins = data.checkins;
  state.profiles = data.profiles;
  state.catProfiles = data.catProfiles || [];
  const me = data.profiles.find((profile) => profile.id === state.service.userId);
  if (me && state.user) {
    state.user = { id: me.id, name: me.display_name, avatarPath: me.avatar_url || null, avatarUrl: me.avatar_url_signed || null };
    writeJSON(USER_KEY, state.user);
  }
  if (state.user) {
    const cloudProfile = state.catProfiles.find((profile) => profile.userId === state.user.id);
    const localProfile = normalizeCatProfile(readJSON(CAT_LOCAL_KEY) || {}, state.user.id);
    if (cloudProfile) writeJSON(CAT_LOCAL_KEY, cloudProfile);
    else if (readJSON(CAT_LOCAL_KEY)?.userId === state.user.id) replaceCatProfile(localProfile);
    else {
      const created = replaceCatProfile(defaultCatProfile(state.user.id));
      writeJSON(CAT_LOCAL_KEY, created);
    }
  }
}
async function connect() {
  if (PREVIEW_MODE) return;
  const cachedUser = readJSON(USER_KEY);
  state.loading = true;
  state.connection = "connecting";
  state.identityIssue = null;
  render();
  try {
    const service = await createService();
    state.service = service;
    const profile = await service.getOwnProfile();
    if (profile) {
      state.user = { id: profile.id, name: profile.display_name, avatarPath: profile.avatar_url || null, avatarUrl: profile.avatar_url_signed || null };
      writeJSON(USER_KEY, state.user);
      await loadData();
    } else if (cachedUser?.name) {
      if (isUUID(cachedUser.id) && cachedUser.id !== service.userId) {
        state.identityIssue = { localId: cachedUser.id, sessionId: service.userId };
        state.user = null;
      } else {
        localStorage.removeItem(USER_KEY);
        state.user = null;
      }
    } else state.user = null;
    state.connection = "ready";
  } catch (error) {
    console.error("嘎巴47数据连接失败", error);
    state.connection = "error";
    if (!state.user) state.service = null;
  } finally {
    state.loading = false;
    state.booting = false;
    render();
  }
}

function openEditCheckin(id) {
  const item = state.checkins.find((checkin) => checkin.id === id && checkin.userId === state.user?.id);
  if (!item) return;
  const selections = parseParts(item);
  const parts = selections.length ? selections : [item.type].filter(Boolean);
  state.checkinForm = { ...emptyCheckinForm(), id: item.id, editing: true, date: localDateKey(item.createdAt), type: trainingTypeFor(parts), parts, duration: parseMinutes(item) || 5, photoUrl: item.photo || "", originalPhotoPath: item.photoPath || null, note: item.note || "" };
  state.route = "checkin";
  window.scrollTo({ top: 0 });
  render();
}
function closeCheckin() {
  if (state.checkinForm.photo && state.checkinForm.photoUrl) URL.revokeObjectURL(state.checkinForm.photoUrl);
  state.checkinForm = emptyCheckinForm();
  state.deleteConfirm = false;
  state.route = "home";
  render();
}

app.addEventListener("click", async (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    if (routeButton.dataset.route === "checkin") state.checkinForm = emptyCheckinForm();
    if (routeButton.dataset.toolFocus) state.tools.focus = routeButton.dataset.toolFocus;
    state.reportModal = null;
    state.memberModal = null;
    state.showAllMembers = false;
    if (routeButton.dataset.route !== "profile") state.catEditor = { open: false, draft: null, saving: false, status: "" };
    state.route = routeButton.dataset.route;
    window.scrollTo({ top: 0, behavior: "smooth" });
    render();
    if (state.route === "tools" && state.tools.focus) requestAnimationFrame(() => document.querySelector(`#tool-${state.tools.focus}`)?.scrollIntoView({ block: "start", behavior: "smooth" }));
    return;
  }
  const memberButton = event.target.closest("[data-member-id]");
  if (memberButton) { state.memberModal = memberButton.dataset.memberId; render(); return; }
  const catOptionButton = event.target.closest("[data-cat-field]");
  if (catOptionButton && state.catEditor.open) {
    state.catEditor.draft = { ...state.catEditor.draft, [catOptionButton.dataset.catField]: catOptionButton.dataset.catValue };
    render(); return;
  }
  const catTitleButton = event.target.closest("[data-cat-title]");
  if (catTitleButton && state.catEditor.open && !catTitleButton.disabled) {
    state.catEditor.draft = { ...state.catEditor.draft, selectedTitle: catTitleButton.dataset.catTitle };
    render(); return;
  }
  const achievementButton = event.target.closest("[data-achievement-rule]");
  if (achievementButton) { showToast(`解锁条件：${achievementButton.dataset.achievementRule}`); return; }
  const editButton = event.target.closest("[data-edit-checkin]");
  if (editButton) { openEditCheckin(editButton.dataset.editCheckin); return; }
  const dateButton = event.target.closest("[data-date]");
  if (dateButton) { state.checkinForm.date = dateButton.dataset.date; render(); return; }
  const partButton = event.target.closest("[data-part]");
  if (partButton) {
    const part = partButton.dataset.part;
    state.checkinForm.parts = state.checkinForm.parts.includes(part) ? state.checkinForm.parts.filter((item) => item !== part) : [...state.checkinForm.parts, part];
    state.checkinForm.type = trainingTypeFor(state.checkinForm.parts);
    render(); return;
  }
  const rankingPeriodButton = event.target.closest("[data-ranking-period]");
  if (rankingPeriodButton) {
    state.rankingPeriod = rankingPeriodButton.dataset.rankingPeriod;
    render(); return;
  }
  const durationButton = event.target.closest("[data-duration]");
  if (durationButton) { state.checkinForm.duration = Math.min(600, Math.max(5, state.checkinForm.duration + Number(durationButton.dataset.duration))); render(); return; }
  const likeButton = event.target.closest("[data-like]");
  if (likeButton && state.service) {
    const item = state.checkins.find((checkin) => checkin.id === likeButton.dataset.like);
    if (!item) return;
    const previous = { liked: item.liked, likes: item.likes };
    item.liked = !item.liked;
    item.likes = Math.max(0, item.likes + (item.liked ? 1 : -1));
    render();
    try { await state.service.toggleLike(item.id); }
    catch { item.liked = previous.liked; item.likes = previous.likes; showToast("点赞没有保存，请再试一次"); }
    return;
  }
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const action = actionButton.dataset.action;
  if (action === "close-member") { state.memberModal = null; render(); return; }
  if (action === "toggle-member-list") { state.showAllMembers = !state.showAllMembers; render(); return; }
  if (action === "open-cat-editor") {
    const me = currentMember(memberStats());
    state.catEditor = { open: true, draft: { ...catProfileFor(me || state.user.id) }, saving: false, status: "" };
    render(); return;
  }
  if (action === "close-cat-editor") { state.catEditor = { open: false, draft: null, saving: false, status: "" }; render(); return; }
  if (action === "save-cat" && state.catEditor.open && !state.catEditor.saving) {
    const me = currentMember(memberStats());
    const unlocked = me ? unlockedFor(me) : { achievements: [] };
    const profile = normalizeCatProfile({
      ...state.catEditor.draft,
      userId: state.user.id,
      unlockedAchievements: unlocked.achievements.map((item) => item.id),
      updatedAt: new Date().toISOString(),
    }, state.user.id);
    state.catEditor.saving = true;
    state.catEditor.status = "";
    replaceCatProfile(profile);
    writeJSON(CAT_LOCAL_KEY, profile);
    render();
    try {
      const result = await state.service?.saveCatProfile(profile);
      state.catEditor = { open: false, draft: null, saving: false, status: "" };
      showToast(result?.synced === false ? "形象已保存在本机；运行猫咪数据库升级后可同步" : "星座猫已保存，广场和头像同步更新");
    } catch (error) {
      console.error("猫咪云端保存失败", error);
      state.catEditor = { ...state.catEditor, saving: false, status: "云端同步失败，本机形象已保留" };
      render();
    }
    return;
  }
  if (action === "open-report") {
    const report = reportById(actionButton.dataset.reportId);
    if (!report) { showToast("这期报表暂时不可用"); return; }
    state.reportModal = report.id;
    render();
    return;
  }
  if (action === "close-report") { state.reportModal = null; render(); return; }
  if (action === "save-report") {
    const report = reportById(actionButton.dataset.reportId);
    if (report) saveReportImage(report);
    return;
  }
  if (action === "roll-dice" && !state.tools.diceRolling) {
    state.tools.diceRolling = true;
    const previous = state.tools.diceIndex;
    let next = Math.floor(Math.random() * diceExercises.length);
    if (diceExercises.length > 1 && next === previous) next = (next + 1 + Math.floor(Math.random() * (diceExercises.length - 1))) % diceExercises.length;
    render();
    setTimeout(() => { state.tools.diceIndex = next; state.tools.diceRolling = false; render(); }, 900);
    return;
  }
  if (action === "calculate-heart") {
    const age = Number(document.querySelector("#age-input")?.value);
    const output = document.querySelector("#heart-output");
    if (!output) return;
    if (!Number.isFinite(age) || age < 12 || age > 100) {
      output.innerHTML = `<span>参考燃脂心率</span><strong>—</strong><small>请输入 12～100 岁</small>`;
      return;
    }
    const maximum = 220 - age;
    output.innerHTML = `<span>参考燃脂心率</span><strong>${Math.round(maximum * 0.6)}–${Math.round(maximum * 0.7)}</strong><small>次 / 分钟</small>`;
    return;
  }
  if (action === "calculate-bmi") {
    const height = Number(document.querySelector("#height-input")?.value);
    const weight = Number(document.querySelector("#weight-input")?.value);
    const output = document.querySelector("#bmi-output");
    if (!output) return;
    if (!Number.isFinite(height) || height < 100 || height > 230 || !Number.isFinite(weight) || weight < 25 || weight > 300) {
      output.innerHTML = `<span>你的 BMI</span><strong>—</strong><small>请检查身高和体重</small>`;
      return;
    }
    const bmi = weight / ((height / 100) ** 2);
    const category = bmi < 18.5 ? "体重偏低" : bmi < 24 ? "正常范围" : bmi < 28 ? "超重" : "肥胖";
    output.innerHTML = `<span>你的 BMI</span><strong>${bmi.toFixed(1)}</strong><small>${category}</small>`;
    return;
  }
  if (action === "retry") { state.booting = !state.user; await connect(); if (state.connection === "ready" && state.user) showToast("已经重新连上云端"); return; }
  if (action === "open-profile-editor") { state.profileEditor = { open: true, name: state.user?.name || "", avatar: null, avatarUrl: state.user?.avatarUrl || "", removeAvatar: false, status: "", saving: false }; render(); return; }
  if (action === "close-profile-editor") { if (state.profileEditor.avatar && state.profileEditor.avatarUrl) URL.revokeObjectURL(state.profileEditor.avatarUrl); state.profileEditor.open = false; render(); return; }
  if (action === "remove-avatar") { if (state.profileEditor.avatar && state.profileEditor.avatarUrl) URL.revokeObjectURL(state.profileEditor.avatarUrl); state.profileEditor.avatar = null; state.profileEditor.avatarUrl = ""; state.profileEditor.removeAvatar = true; render(); return; }
  if (action === "save-profile" && state.service && !state.profileEditor.saving) {
    const name = state.profileEditor.name.trim();
    if (!name) { state.profileEditor.status = "昵称不能为空"; render(); return; }
    state.profileEditor.saving = true; state.profileEditor.status = ""; render();
    try {
      const avatar = await state.service.updateProfile({ name, avatar: state.profileEditor.avatar, removeAvatar: state.profileEditor.removeAvatar, currentAvatarPath: state.user?.avatarPath });
      state.user = { ...state.user, name, ...avatar };
      writeJSON(USER_KEY, state.user);
      if (!PREVIEW_MODE) await loadData();
      else state.profiles.find((profile) => profile.id === state.user.id).display_name = name;
      state.profileEditor.open = false;
      showToast("资料已经更新");
    } catch (error) { state.profileEditor.saving = false; state.profileEditor.status = error.message.includes("policy") || error.message.includes("permission") ? "请先运行数据库升级脚本" : error.message; render(); }
    return;
  }
  if (action === "remove-checkin-photo") { if (state.checkinForm.photo && state.checkinForm.photoUrl) URL.revokeObjectURL(state.checkinForm.photoUrl); state.checkinForm.photo = null; state.checkinForm.photoUrl = ""; state.checkinForm.removePhoto = true; render(); return; }
  if (action === "close-checkin") { closeCheckin(); return; }
  if (action === "ask-delete") { state.deleteConfirm = true; render(); return; }
  if (action === "cancel-delete") { state.deleteConfirm = false; render(); return; }
  if (action === "confirm-delete" && state.service && state.checkinForm.id) {
    try {
      await state.service.deleteCheckin(state.checkinForm);
      if (!PREVIEW_MODE) await loadData(); else state.checkins = state.checkins.filter((item) => item.id !== state.checkinForm.id);
      state.checkinForm = emptyCheckinForm(); state.deleteConfirm = false; state.route = "home"; showToast("这条打卡已经删除");
    } catch (error) { console.error(error); state.deleteConfirm = false; showToast(error.message.includes("policy") || error.message.includes("permission") ? "请先运行数据库升级脚本" : "删除失败，请稍后再试"); }
    return;
  }
  if (action === "submit-checkin" && state.service && !state.checkinForm.submitting) {
    if (!state.checkinForm.parts.length) { showToast("请至少选择一项训练内容"); return; }
    state.checkinForm.submitting = true;
    const selectedDate = state.checkinForm.date;
    const [year, month, day] = selectedDate.split("-").map(Number);
    const originalTime = state.checkinForm.editing ? new Date(state.checkins.find((item) => item.id === state.checkinForm.id)?.createdAt || Date.now()) : new Date();
    const createdAt = new Date(year, month - 1, day, originalTime.getHours(), originalTime.getMinutes(), originalTime.getSeconds()).toISOString();
    const payload = { ...state.checkinForm, type: trainingTypeFor(state.checkinForm.parts), note: state.checkinForm.note.trim(), createdAt };
    render();
    try {
      if (payload.editing) await state.service.updateCheckin(payload); else await state.service.createCheckin(payload);
      if (!PREVIEW_MODE) await loadData();
      state.checkinForm = emptyCheckinForm(); state.route = "home";
      showToast(payload.editing ? "打卡已经更新" : selectedDate === localDateKey() ? "打卡成功，今天没白过" : "补打卡成功，记录已经归位");
    } catch (error) {
      console.error(error);
      state.checkinForm.submitting = false;
      const detail = `${error.code || ""} ${error.message || ""}`;
      const message = /23514|training_type|check constraint/i.test(detail)
        ? "训练内容不兼容，请刷新页面后重试"
        : /policy|permission|42501/i.test(detail)
          ? "登录状态失效，请重新打开页面"
          : /fetch|network|timeout/i.test(detail)
            ? "网络连接失败，请检查网络后重试"
            : /storage|bucket|mime|file size/i.test(detail)
              ? "照片上传失败，请换一张照片后重试"
              : "保存失败，请稍后再试";
      showToast(message);
    }
  }
});

app.addEventListener("submit", async (event) => {
  if (event.target.id !== "join-form") return;
  event.preventDefault();
  const data = new FormData(event.target);
  const code = String(data.get("code") || "").trim().toUpperCase();
  const name = String(data.get("name") || "").trim();
  if (code !== GROUP_CODE) { app.innerHTML = joinPage("邀请码不对，再问问群友。"); return; }
  if (!name) { app.innerHTML = joinPage("先写一个群友认得出的昵称。"); return; }
  try {
    if (!state.service) state.service = await createService();
    const existing = await state.service.getOwnProfile();
    if (existing) state.user = { id: existing.id, name: existing.display_name, avatarPath: existing.avatar_url || null, avatarUrl: existing.avatar_url_signed || null };
    else { await state.service.ensureProfile(name); state.user = { id: state.service.userId, name, avatarPath: null, avatarUrl: null }; }
    writeJSON(USER_KEY, state.user);
    state.connection = "ready";
    await loadData();
    render();
  } catch (error) { console.error(error); app.innerHTML = joinPage("加入失败，请检查网络后重试。"); }
});

app.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (event.target.id === "photo-input") {
    state.checkinForm.uploadStatus = "正在压缩…"; render();
    try {
      const compressed = await compressImage(file);
      if (state.checkinForm.photo && state.checkinForm.photoUrl) URL.revokeObjectURL(state.checkinForm.photoUrl);
      state.checkinForm.photo = compressed; state.checkinForm.photoUrl = URL.createObjectURL(compressed); state.checkinForm.removePhoto = false; state.checkinForm.uploadStatus = `已压缩到 ${Math.round(compressed.size / 1024)}KB`;
    } catch (error) { state.checkinForm.uploadStatus = error.message; }
    render();
  }
  if (event.target.id === "avatar-input") {
    state.profileEditor.status = "正在压缩…"; render();
    try {
      const compressed = await compressImage(file, 300 * 1024);
      if (state.profileEditor.avatar && state.profileEditor.avatarUrl) URL.revokeObjectURL(state.profileEditor.avatarUrl);
      state.profileEditor.avatar = compressed; state.profileEditor.avatarUrl = URL.createObjectURL(compressed); state.profileEditor.removeAvatar = false; state.profileEditor.status = `头像已压缩到 ${Math.round(compressed.size / 1024)}KB`;
    } catch (error) { state.profileEditor.status = error.message; }
    render();
  }
});

app.addEventListener("input", (event) => {
  if (event.target.id === "note-input") state.checkinForm.note = event.target.value;
  if (event.target.id === "profile-name-input") state.profileEditor.name = event.target.value;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.reportModal) { state.reportModal = null; render(); }
  else if (event.key === "Escape" && state.memberModal) { state.memberModal = null; render(); }
});

if (PREVIEW_MODE) { previewData(); render(); }
else { render(); connect(); }

if ("serviceWorker" in navigator && !PREVIEW_MODE) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
