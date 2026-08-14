const SUPABASE_URL = "https://jujvzrpqagjxeeafqlyo.supabase.co";
const SUPABASE_KEY = "sb_publishable_eg6Dbh9a46pa14-yPqrFiQ_AQgER7J-";
const SESSION_KEY = "gaba47-supabase-session-v1";
const USER_KEY = "gaba47-user-v2";
const PREVIEW_MODE = new URLSearchParams(location.search).get("preview") === "1";
const GROUP_CODE = "47GYM";

const app = document.querySelector("#app");
const initialUser = PREVIEW_MODE ? { id: "preview", name: "阿飞不累", avatarPath: null, avatarUrl: null } : readJSON(USER_KEY);
const trainingTypes = [
  ["力量", "barbell"], ["跑步", "person-simple-run"], ["骑行", "bicycle"],
  ["游泳", "waves"], ["拉伸", "person-simple-tai-chi"], ["其他", "dots-three"],
];
const bodyParts = ["胸", "背", "肩", "腿", "二头", "三头", "核心"];
const navItems = [
  ["home", "今日", "house"], ["ranking", "排行", "trophy"], ["checkin", "去打卡", "lightning"],
  ["members", "群友", "users-three"], ["profile", "我的", "user"],
];

const emptyCheckinForm = () => ({
  id: null, editing: false, date: localDateKey(), type: "力量", parts: ["胸"], duration: 60,
  photo: null, photoUrl: "", originalPhotoPath: null, removePhoto: false, uploadStatus: "", note: "", submitting: false,
});

const state = {
  user: initialUser,
  service: null, route: "home", checkins: [], profiles: [], booting: !PREVIEW_MODE && !initialUser, loading: false,
  connection: PREVIEW_MODE ? "preview" : "idle", identityIssue: null, toast: "", toastTimer: null,
  checkinForm: emptyCheckinForm(),
  profileEditor: { open: false, name: "", avatar: null, avatarUrl: "", removeAvatar: false, status: "", saving: false },
  deleteConfirm: false,
};

function readJSON(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function writeJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function isUUID(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "")); }
function escapeHTML(value = "") { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function icon(name, extra = "") { return `<i class="ph ph-${name} ${extra}" aria-hidden="true"></i>`; }
function initials(name = "47") { return [...String(name).trim()].slice(0, 1).join("") || "47"; }
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
  const url = entity?.avatarUrl || entity?.avatar_url_signed;
  return url ? `<span class="${className} has-image"><img src="${escapeHTML(url)}" alt="${escapeHTML(name)}的头像" /></span>` : `<span class="${className}" aria-label="${escapeHTML(name)}的头像">${escapeHTML(initials(name))}</span>`;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!response.ok) {
    let message = text;
    try { const parsed = JSON.parse(text); message = parsed?.message || parsed?.error_description || parsed?.hint || text; } catch {}
    const error = new Error(message || `请求失败：${response.status}`);
    error.status = response.status;
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

  return {
    userId,
    get supportsAvatar() { return supportsAvatar; },
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
      const [data, rawProfiles] = await Promise.all([
        api("/rest/v1/checkins_feed?select=*&order=created_at.desc&limit=80"), fetchProfiles(),
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
      return { checkins, profiles };
    },
    async createCheckin(input) {
      let photoPath = null;
      if (input.photo) photoPath = await uploadObject(input.photo, "checkin");
      await api("/rest/v1/checkins", {
        method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ user_id: userId, training_type: input.type, body_parts: input.parts, duration_minutes: input.duration, note: input.note, photo_url: photoPath, created_at: input.createdAt }),
      });
    },
    async updateCheckin(input) {
      let photoPath = input.originalPhotoPath || null;
      if (input.photo) {
        const nextPath = await uploadObject(input.photo, "checkin");
        if (photoPath) await deleteObject(photoPath).catch(() => {});
        photoPath = nextPath;
      } else if (input.removePhoto && photoPath) {
        await deleteObject(photoPath).catch(() => {});
        photoPath = null;
      }
      await api(`/rest/v1/checkins?id=eq.${encodeURIComponent(input.id)}&user_id=eq.${encodeURIComponent(userId)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ training_type: input.type, body_parts: input.parts, duration_minutes: input.duration, note: input.note, photo_url: photoPath, created_at: input.createdAt }),
      });
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
  state.profiles = [
    { id: "preview", display_name: "阿飞不累", avatar_url_signed: null, created_at: ago(720) },
    { id: "friend-1", display_name: "小鹿同学", avatar_url_signed: null, created_at: ago(700) },
    { id: "friend-2", display_name: "老周", avatar_url_signed: null, created_at: ago(600) },
  ];
  state.checkins = [
    { id: "p1", userId: "friend-1", name: "小鹿同学", createdAt: ago(1), type: "力量", details: "背 + 二头 · 48分钟", parts: ["背", "二头"], duration: 48, note: "今天状态不错。", likes: 3, liked: false, photo: null, photoPath: null },
    { id: "p2", userId: "preview", name: "阿飞不累", createdAt: ago(18), type: "跑步", details: "跑步 · 36分钟", parts: [], duration: 36, note: "慢慢跑，也算到场。", likes: 5, liked: true, photo: null, photoPath: null },
    { id: "p3", userId: "preview", name: "阿飞不累", createdAt: ago(66), type: "力量", details: "胸 + 三头 · 60分钟", parts: ["胸", "三头"], duration: 60, note: "", likes: 2, liked: false, photo: null, photoPath: null },
  ];
  state.service = {
    userId: "preview", toggleLike: async () => {},
    updateProfile: async (input) => ({ avatarPath: input.currentAvatarPath, avatarUrl: state.user.avatarUrl }),
    createCheckin: async () => {}, updateCheckin: async () => {}, deleteCheckin: async () => {},
  };
}

function memberStats() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const map = new Map();
  for (const profile of state.profiles) {
    map.set(profile.id, { id: profile.id, name: profile.display_name, avatarUrl: profile.avatar_url_signed || null, weeklyCount: 0, monthlyCount: 0, monthlyMinutes: 0, totalMinutes: 0, streak: 0, dates: new Set() });
  }
  for (const item of state.checkins) {
    const id = item.userId || item.name;
    if (!map.has(id)) map.set(id, { id, name: item.name, avatarUrl: item.avatarUrl, weeklyCount: 0, monthlyCount: 0, monthlyMinutes: 0, totalMinutes: 0, streak: 0, dates: new Set() });
    const member = map.get(id);
    const created = new Date(item.createdAt);
    const minutes = parseMinutes(item);
    if (!Number.isNaN(created.getTime())) {
      if (created >= weekStart) member.weeklyCount += 1;
      if (created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()) {
        member.monthlyCount += 1;
        member.monthlyMinutes += minutes;
      }
      member.dates.add(localDateKey(created));
    }
    member.totalMinutes += minutes;
  }
  for (const member of map.values()) {
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (!member.dates.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (member.dates.has(localDateKey(cursor))) { member.streak += 1; cursor.setDate(cursor.getDate() - 1); }
  }
  return [...map.values()].sort((a, b) => b.weeklyCount - a.weeklyCount || b.totalMinutes - a.totalMinutes || a.name.localeCompare(b.name, "zh-CN"));
}

function currentMember(members = memberStats()) { return members.find((member) => member.id === state.user?.id) || null; }
function recentDateOptions() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - index);
    return { key: localDateKey(date), day: index === 0 ? "今天" : ["日", "一", "二", "三", "四", "五", "六"][date.getDay()], label: `${date.getMonth() + 1}/${date.getDate()}` };
  });
}

function header(title = "嘎巴47") {
  return `<header class="app-header"><h1 class="brand">${escapeHTML(title)}</h1><button class="avatar-button" data-route="profile" aria-label="打开我的主页">${avatarMarkup(state.user, "header-avatar")}</button></header>`;
}
function nav() {
  return `<nav class="bottom-nav" aria-label="主导航">${navItems.map(([route, label, iconName], index) => index === 2
    ? `<button class="nav-primary" data-route="${route}" aria-label="${label}"><span class="primary-circle">${icon(iconName)}</span><span>${label}</span></button>`
    : `<button class="nav-item ${state.route === route ? "is-active" : ""}" data-route="${route}" ${state.route === route ? 'aria-current="page"' : ""}>${icon(iconName)}<span>${label}</span></button>`
  ).join("")}</nav>`;
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

function activityCard(item) {
  const own = item.userId === state.user?.id;
  return `<article class="feed-card"><div class="feed-main">${avatarMarkup(item, "feed-avatar")}<div class="feed-copy"><div class="feed-name-row"><strong>${escapeHTML(item.name)}</strong><span class="feed-type">${escapeHTML(item.type)}</span></div><p>${escapeHTML(item.details || `${item.type} · ${parseMinutes(item)}分钟`)}</p><small>${escapeHTML(relativeTime(item.createdAt))}</small></div><div class="feed-controls"><button class="like-button ${item.liked ? "is-liked" : ""}" data-like="${escapeHTML(item.id)}" aria-label="${item.liked ? "取消点赞" : "点赞"}">${icon("heart-straight")}<span>${item.likes}</span></button>${own ? `<button class="edit-button" data-edit-checkin="${escapeHTML(item.id)}" aria-label="编辑这条打卡">${icon("pencil-simple")}</button>` : ""}</div></div>${item.note ? `<p class="feed-note">${escapeHTML(item.note)}</p>` : ""}${item.photo ? `<img class="feed-photo" src="${escapeHTML(item.photo)}" alt="${escapeHTML(item.name)}的训练照片" loading="lazy" />` : ""}</article>`;
}

function homePage() {
  const members = memberStats();
  const me = currentMember(members) || { weeklyCount: 0, monthlyCount: 0, monthlyMinutes: 0, streak: 0, dates: new Set() };
  return `<main class="page page-home">${header()}<h2 class="home-title">今天你练了吗？</h2>${connectionNotice()}<section class="weekly-card" aria-label="我的训练概览"><div class="metric-grid"><div><span>本周训练</span><strong>${me.weeklyCount}<small>次</small></strong></div><div><span>连续</span><strong>${me.streak}<small>天</small></strong></div><div><span>本月分钟</span><strong>${me.monthlyMinutes}<small>分钟</small></strong></div></div><div class="week-bars">${weekBars(me)}</div><button class="glow-button" data-route="checkin">去打卡 ${icon("arrow-right")}</button></section><section class="feed-section"><div class="section-heading"><h2>动态</h2><span>${state.checkins.length ? `${state.checkins.length} 条记录` : "等待第一卡"}</span></div><div class="feed-list">${state.checkins.length ? state.checkins.slice(0, 20).map(activityCard).join("") : `<div class="empty-state">${icon("barbell")}<strong>还没有训练记录</strong><p>你来打第一卡，这里只展示真实数据。</p><button data-route="checkin">去打卡</button></div>`}</div></section></main>`;
}

function rankingPage() {
  const members = memberStats();
  const myIndex = members.findIndex((member) => member.id === state.user?.id);
  const total = members.reduce((sum, member) => sum + member.weeklyCount, 0);
  return `<main class="page page-ranking">${header("排行榜")}${connectionNotice()}<section class="rank-hero"><div><span>我的排名</span><strong>${myIndex >= 0 ? `#${myIndex + 1}` : "—"}</strong></div><div><span>群内本周</span><strong>${total}<small>次</small></strong></div></section><section class="ranking-list">${members.length ? members.map((member, index) => `<article class="rank-row ${index === 0 && member.weeklyCount > 0 ? "is-top" : ""}"><span class="rank-index">${String(index + 1).padStart(2, "0")}</span>${avatarMarkup(member, "member-avatar")}<div class="rank-copy"><strong>${escapeHTML(member.name)}</strong><small>${member.totalMinutes} 分钟</small></div><div class="rank-score"><strong>${member.weeklyCount}</strong><span>本周</span></div></article>`).join("") : `<div class="empty-state">${icon("trophy")}<strong>本周还没人上榜</strong><p>完成一次打卡就会出现在这里。</p></div>`}</section></main>`;
}

function membersPage() {
  const members = memberStats();
  const weeklyTotal = members.reduce((sum, member) => sum + member.weeklyCount, 0);
  return `<main class="page page-members">${header("47群友")}<section class="members-hero"><div><span>群友</span><strong>${members.length}<small>人</small></strong></div><div><span>本周训练</span><strong>${weeklyTotal}<small>次</small></strong></div></section>${connectionNotice()}<section class="member-list">${members.length ? members.map((member) => `<article class="member-row">${avatarMarkup(member, "member-avatar")}<div class="member-copy"><strong>${escapeHTML(member.name)}</strong><small>连续 ${member.streak} 天</small></div><div class="member-score"><strong>${member.weeklyCount}</strong><span>本周</span></div></article>`).join("") : `<div class="empty-state">${icon("users-three")}<strong>还没有群友加入</strong><p>成员加入后会显示在这里。</p></div>`}</section></main>`;
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

function deleteDialog() {
  return `<div class="modal-backdrop" role="presentation"><section class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><span class="danger-icon">${icon("trash")}</span><h2 id="delete-title">删除这条打卡？</h2><p>删除后无法恢复，点赞也会一起移除。</p><div class="confirm-actions"><button class="secondary-button" data-action="cancel-delete">取消</button><button class="danger-button" data-action="confirm-delete">确认删除</button></div></section></div>`;
}

function checkinPage() {
  const form = state.checkinForm;
  const recentDates = recentDateOptions();
  return `<main class="page page-checkin"><header class="edit-header"><button class="icon-button" data-action="close-checkin" aria-label="返回">${icon("arrow-left")}</button><h1>${form.editing ? "编辑打卡" : "发布打卡"}</h1>${form.editing ? `<button class="delete-link" data-action="ask-delete">删除</button>` : `<span></span>`}</header>${connectionNotice()}<section class="editor-card"><div class="form-section date-section"><div class="form-section-title"><h2>训练日期</h2><span>支持近一周补打卡</span></div><div class="date-picker">${recentDates.map((item) => `<button class="date-button ${form.date === item.key ? "is-selected" : ""}" data-date="${item.key}" aria-pressed="${form.date === item.key}"><strong>${item.day}</strong><span>${item.label}</span></button>`).join("")}</div></div><section class="form-section"><h2>训练类型</h2><div class="type-grid">${trainingTypes.map(([type, iconName]) => `<button class="type-button ${form.type === type ? "is-selected" : ""}" data-type="${type}">${icon(iconName)}<span>${type}</span></button>`).join("")}</div></section><section class="form-section"><h2>训练部位 <small>可多选</small></h2><div class="parts-row">${bodyParts.map((part) => `<button class="part-button ${form.parts.includes(part) ? "is-selected" : ""}" data-part="${part}">${part}</button>`).join("")}</div></section><section class="form-section"><h2>训练时长</h2><div class="duration-stepper"><button data-duration="-5" aria-label="减少5分钟">${icon("minus")}</button><strong>${form.duration}<span>分钟</span></strong><button data-duration="5" aria-label="增加5分钟">${icon("plus")}</button></div></section><section class="form-section"><h2>训练照片 <small>选填</small></h2><label class="photo-upload">${form.photoUrl && !form.removePhoto ? `<img class="photo-preview" src="${escapeHTML(form.photoUrl)}" alt="训练照片预览" />` : `${icon("camera")}<strong>添加训练照</strong><span>自动压缩后上传</span>`}<input id="photo-input" type="file" accept="image/*" /></label>${form.photoUrl && !form.removePhoto ? `<button class="text-button danger" data-action="remove-checkin-photo">移除照片</button>` : ""}${form.uploadStatus ? `<p class="form-status">${escapeHTML(form.uploadStatus)}</p>` : ""}</section><section class="form-section"><h2>训练感受 <small>选填</small></h2><textarea id="note-input" maxlength="300" placeholder="写一句真实感受，不写也可以">${escapeHTML(form.note)}</textarea></section><button class="primary-button" data-action="submit-checkin" ${form.submitting || (state.connection !== "ready" && state.connection !== "preview") ? "disabled" : ""}>${form.submitting ? "正在保存…" : form.editing ? "保存修改" : "完成打卡"}</button><p class="privacy-note">${icon("lock-simple")} 仅47群成员可见</p></section></main>${state.deleteConfirm ? deleteDialog() : ""}`;
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
  const pages = { home: homePage, ranking: rankingPage, members: membersPage, profile: profilePage, checkin: checkinPage };
  const page = (pages[state.route] || homePage)();
  app.innerHTML = `<div class="app-shell">${page}${state.route !== "checkin" ? nav() : ""}${state.toast ? `<div class="toast" role="status">${escapeHTML(state.toast)}</div>` : ""}</div>`;
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
  const me = data.profiles.find((profile) => profile.id === state.service.userId);
  if (me && state.user) {
    state.user = { id: me.id, name: me.display_name, avatarPath: me.avatar_url || null, avatarUrl: me.avatar_url_signed || null };
    writeJSON(USER_KEY, state.user);
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
  state.checkinForm = { ...emptyCheckinForm(), id: item.id, editing: true, date: localDateKey(item.createdAt), type: item.type, parts: parseParts(item), duration: parseMinutes(item) || 5, photoUrl: item.photo || "", originalPhotoPath: item.photoPath || null, note: item.note || "" };
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
    state.route = routeButton.dataset.route;
    window.scrollTo({ top: 0, behavior: "smooth" });
    render();
    return;
  }
  const editButton = event.target.closest("[data-edit-checkin]");
  if (editButton) { openEditCheckin(editButton.dataset.editCheckin); return; }
  const typeButton = event.target.closest("[data-type]");
  if (typeButton) { state.checkinForm.type = typeButton.dataset.type; if (state.checkinForm.type !== "力量") state.checkinForm.parts = []; render(); return; }
  const dateButton = event.target.closest("[data-date]");
  if (dateButton) { state.checkinForm.date = dateButton.dataset.date; render(); return; }
  const partButton = event.target.closest("[data-part]");
  if (partButton) {
    const part = partButton.dataset.part;
    state.checkinForm.parts = state.checkinForm.parts.includes(part) ? state.checkinForm.parts.filter((item) => item !== part) : [...state.checkinForm.parts, part];
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
    state.checkinForm.submitting = true;
    const selectedDate = state.checkinForm.date;
    const [year, month, day] = selectedDate.split("-").map(Number);
    const originalTime = state.checkinForm.editing ? new Date(state.checkins.find((item) => item.id === state.checkinForm.id)?.createdAt || Date.now()) : new Date();
    const createdAt = new Date(year, month - 1, day, originalTime.getHours(), originalTime.getMinutes(), originalTime.getSeconds()).toISOString();
    const payload = { ...state.checkinForm, note: state.checkinForm.note.trim(), createdAt };
    render();
    try {
      if (payload.editing) await state.service.updateCheckin(payload); else await state.service.createCheckin(payload);
      if (!PREVIEW_MODE) await loadData();
      state.checkinForm = emptyCheckinForm(); state.route = "home";
      showToast(payload.editing ? "打卡已经更新" : selectedDate === localDateKey() ? "打卡成功，今天没白过" : "补打卡成功，记录已经归位");
    } catch (error) { console.error(error); state.checkinForm.submitting = false; showToast(error.message.includes("policy") || error.message.includes("permission") ? "请先运行数据库升级脚本" : "保存失败，请稍后再试"); }
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

if (PREVIEW_MODE) { previewData(); render(); }
else { render(); connect(); }

if ("serviceWorker" in navigator && !PREVIEW_MODE) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
