const SUPABASE_URL = "https://jujvzrpqagjxeeafqlyo.supabase.co";
const SUPABASE_KEY = "sb_publishable_eg6Dbh9a46pa14-yPqrFiQ_AQgER7J-";
const SESSION_KEY = "gaba47-supabase-session-v1";
const USER_KEY = "gaba47-user-v1";
const PREVIEW_MODE = new URLSearchParams(location.search).get("preview") === "1";

const app = document.querySelector("#app");
const state = {
  user: PREVIEW_MODE ? { id: "preview", name: "预览" } : readJSON(USER_KEY),
  service: null,
  route: "home",
  checkins: [],
  profiles: [],
  loading: false,
  connection: PREVIEW_MODE ? "preview" : "idle",
  toast: "",
  toastTimer: null,
  checkinForm: {
    date: localDateKey(),
    type: "力量",
    parts: ["胸", "三头"],
    duration: 60,
    photo: null,
    photoUrl: "",
    uploadStatus: "",
    note: "",
    submitting: false,
  },
};

const navItems = [
  ["home", "今日", "house"],
  ["ranking", "排行", "trophy"],
  ["checkin", "去打卡", "check"],
  ["members", "群友", "users-three"],
  ["profile", "我的", "user"],
];

const trainingTypes = [
  ["力量", "barbell"],
  ["跑步", "person-simple-run"],
  ["骑行", "bicycle"],
  ["游泳", "waves"],
  ["拉伸", "person-simple-tai-chi"],
  ["其他", "dots-three"],
];
const bodyParts = ["胸", "背", "肩", "腿", "二头", "三头", "核心"];

function readJSON(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function icon(name, extra = "") {
  return `<i class="ph ph-${name} ${extra}" aria-hidden="true"></i>`;
}

function initials(name = "47") {
  return [...String(name).trim()].slice(0, 1).join("") || "47";
}

function localDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseMinutes(item) {
  return Number(item.duration || (item.details?.match(/(\d+)\s*分钟/) || [])[1] || 0);
}

function relativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(date);
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!response.ok) {
    let message = text;
    try { message = JSON.parse(text)?.message || JSON.parse(text)?.error_description || text; } catch {}
    throw new Error(message || `请求失败：${response.status}`);
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
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      }));
      session = refreshed.session || refreshed;
      writeJSON(SESSION_KEY, session);
      return session;
    } catch {}
  }

  const created = await parseResponse(await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ data: {} }),
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
    method,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}`, ...headers },
    body,
  }));

  const encodePath = (value) => value.split("/").map(encodeURIComponent).join("/");

  return {
    userId,
    async ensureProfile(displayName) {
      await api("/rest/v1/profiles?on_conflict=id", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ id: userId, display_name: displayName, group_code: "47GYM" }),
      });
    },
    async listData() {
      const [data, profiles] = await Promise.all([
        api("/rest/v1/checkins_feed?select=*&order=created_at.desc&limit=200"),
        api("/rest/v1/profiles?select=id,display_name,created_at&order=created_at.asc"),
      ]);

      const checkins = await Promise.all((data || []).map(async (item) => {
        let photo = null;
        if (item.photo_url) {
          try {
            const signed = await api(`/storage/v1/object/sign/checkin-photos/${encodePath(item.photo_url)}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ expiresIn: 3600 }),
            });
            const signedPath = signed?.signedURL || signed?.signedUrl;
            photo = signedPath?.startsWith("http") ? signedPath : (signedPath ? `${SUPABASE_URL}/storage/v1${signedPath}` : null);
          } catch {}
        }
        return {
          id: item.id,
          userId: item.user_id,
          name: item.display_name,
          createdAt: item.created_at,
          type: item.training_type,
          details: item.details,
          note: item.note,
          likes: item.likes_count || 0,
          liked: Boolean(item.liked_by_me),
          photo,
        };
      }));
      return { checkins, profiles: profiles || [] };
    },
    async createCheckin(input) {
      let photoPath = null;
      if (input.photo) {
        photoPath = `${userId}/${Date.now()}.webp`;
        await api(`/storage/v1/object/checkin-photos/${encodePath(photoPath)}`, {
          method: "POST",
          headers: { "Content-Type": input.photo.type || "image/webp", "x-upsert": "false" },
          body: input.photo,
        });
      }
      await api("/rest/v1/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          user_id: userId,
          training_type: input.type,
          body_parts: input.parts,
          duration_minutes: input.duration,
          note: input.note,
          photo_url: photoPath,
          created_at: input.createdAt,
        }),
      });
    },
    async toggleLike(id) {
      await api("/rest/v1/rpc/toggle_checkin_like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_checkin: id }),
      });
    },
  };
}

async function compressImage(file, maxBytes = 500 * 1024) {
  if (!file.type.startsWith("image/")) throw new Error("请选择图片文件");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.fillStyle = "#15171a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const toBlob = (quality) => new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("图片压缩失败")), "image/webp", quality));
  let quality = 0.82;
  let blob = await toBlob(quality);
  while (blob.size > maxBytes && quality > 0.46) {
    quality -= 0.08;
    blob = await toBlob(quality);
  }
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp", lastModified: Date.now() });
}

function memberStats() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const map = new Map();

  for (const profile of state.profiles) {
    map.set(profile.id, {
      id: profile.id,
      name: profile.display_name,
      weeklyCount: 0,
      monthlyCount: 0,
      monthlyMinutes: 0,
      totalMinutes: 0,
      streak: 0,
      dates: new Set(),
    });
  }

  for (const item of state.checkins) {
    const id = item.userId || item.name;
    if (!map.has(id)) map.set(id, { id, name: item.name, weeklyCount: 0, monthlyCount: 0, monthlyMinutes: 0, totalMinutes: 0, streak: 0, dates: new Set() });
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
    while (member.dates.has(localDateKey(cursor))) {
      member.streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  return [...map.values()].sort((a, b) => b.weeklyCount - a.weeklyCount || b.totalMinutes - a.totalMinutes || a.name.localeCompare(b.name, "zh-CN"));
}

function currentMember(members = memberStats()) {
  return members.find((member) => member.id === state.user?.id) || members.find((member) => member.name === state.user?.name) || null;
}

function header(title = "嘎巴47") {
  return `<header class="app-header">
    <h1 class="brand">${escapeHTML(title)}</h1>
    <button class="avatar-button" data-route="profile" aria-label="打开我的主页">${escapeHTML(initials(state.user?.name))}</button>
  </header>`;
}

function nav() {
  return `<nav class="bottom-nav" aria-label="主导航">
    ${navItems.map(([route, label, iconName], index) => index === 2
      ? `<button class="nav-primary" data-route="${route}" aria-label="${label}"><span class="primary-circle">${icon(iconName)}</span><span>${label}</span></button>`
      : `<button class="nav-item ${state.route === route ? "is-active" : ""}" data-route="${route}" ${state.route === route ? 'aria-current="page"' : ""}>${icon(iconName)}<span>${label}</span></button>`
    ).join("")}
  </nav>`;
}

function connectionNotice() {
  if (state.connection !== "error") return "";
  return `<div class="empty-state" style="margin-bottom:18px">
    ${icon("warning-circle")}
    <strong>暂时没有连上数据</strong>
    <p>页面不会显示虚拟记录。检查网络后可以重试。</p>
    <button class="primary-button" data-action="retry" style="margin-top:18px">重新连接</button>
  </div>`;
}

function activityCard(item) {
  const minutes = parseMinutes(item);
  return `<article class="feed-card">
    <div class="feed-meta">
      <span class="feed-avatar" aria-hidden="true">${escapeHTML(initials(item.name))}</span>
      <div class="feed-identity"><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(relativeTime(item.createdAt))}</span></div>
      <span class="feed-type">${escapeHTML(item.type)}</span>
    </div>
    <div class="feed-number">${minutes}<span>分钟</span></div>
    ${item.note ? `<p class="feed-note">${escapeHTML(item.note)}</p>` : ""}
    ${item.photo ? `<img class="feed-photo" src="${escapeHTML(item.photo)}" alt="${escapeHTML(item.name)}的训练照片" loading="lazy" />` : ""}
    <div class="feed-actions"><button class="like-button ${item.liked ? "is-liked" : ""}" data-like="${escapeHTML(item.id)}" aria-label="${item.liked ? "取消点赞" : "点赞"}">${icon("heart")}<span>${item.likes}</span></button></div>
  </article>`;
}

function homePage() {
  const members = memberStats();
  const me = currentMember(members) || { weeklyCount: 0, monthlyCount: 0, monthlyMinutes: 0, streak: 0 };
  const weeklyGoal = 5;
  const progress = Math.min(100, Math.round((me.weeklyCount / weeklyGoal) * 100));
  const participants = members.filter((member) => member.weeklyCount > 0);
  const weekday = (new Date().getDay() + 6) % 7;
  const daysLeft = 7 - weekday;

  return `<main class="page page-home">
    ${header()}
    <h2 class="page-title">今天也别躺</h2>
    <p class="page-subtitle">每一次训练都算数，记录会直接同步给群友。</p>
    ${connectionNotice()}
    <section class="rail" aria-label="训练概览">
      <article class="challenge-card">
        <div class="card-top"><span class="card-kicker">本周挑战 ${icon("caret-right")}</span><span class="days-left">剩余 ${daysLeft} 天</span></div>
        <h2>一周练够五次</h2>
        <p>完成 5 次任意训练</p>
        <div class="challenge-progress">${me.weeklyCount}<span>/ ${weeklyGoal}</span></div>
        <div class="progress-track"><i style="width:${progress}%"></i></div>
        <div class="challenge-foot">
          <div class="avatar-stack">${participants.slice(0, 4).map((member) => `<span class="mini-avatar" title="${escapeHTML(member.name)}">${escapeHTML(initials(member.name))}</span>`).join("")}</div>
          <span>${participants.length} 位群友本周已参与</span>
        </div>
      </article>
      <article class="stats-card">
        <h2>我的本月</h2>
        <div class="stat-block"><span>训练次数</span><strong>${me.monthlyCount}<small> 次</small></strong></div>
        <div class="stat-block"><span>训练时长</span><strong>${formatDuration(me.monthlyMinutes)}</strong></div>
        <div class="stat-block"><span>连续打卡</span><strong>${me.streak}<small> 天</small></strong></div>
      </article>
    </section>
    <section>
      <div class="section-heading"><h2>群友动态</h2><span>${state.checkins.length ? `最近 ${Math.min(20, state.checkins.length)} 条` : "暂无记录"}</span></div>
      <div class="feed-list">
        ${state.checkins.length ? state.checkins.slice(0, 20).map(activityCard).join("") : `<div class="empty-state">${icon("barbell")}<strong>还没有训练记录</strong><p>你来打第一卡，页面只展示真实数据。</p></div>`}
      </div>
    </section>
  </main>`;
}

function rankingPage() {
  const members = memberStats();
  const myIndex = members.findIndex((member) => member.id === state.user?.id || member.name === state.user?.name);
  return `<main class="page">
    ${header("排行榜")}
    <h2 class="page-title">这周谁最能扛</h2>
    <p class="page-subtitle">按本周训练次数排序，次数相同时比较累计时长。</p>
    ${connectionNotice()}
    <section class="rank-summary"><strong>${myIndex >= 0 ? `#${myIndex + 1}` : "—"}</strong><span>我的本周排名</span></section>
    <section class="ranking-list">
      ${members.length ? members.map((member, index) => `<article class="rank-row ${index === 0 && member.weeklyCount > 0 ? "is-top" : ""}">
        <span class="rank-index">${String(index + 1).padStart(2, "0")}</span>
        <span class="member-avatar">${escapeHTML(initials(member.name))}</span>
        <div class="rank-copy"><strong>${escapeHTML(member.name)}</strong><small>${member.totalMinutes} 分钟</small></div>
        <div class="rank-score"><strong>${member.weeklyCount}</strong><span>本周次数</span></div>
      </article>`).join("") : `<div class="empty-state" style="margin-top:18px">${icon("trophy")}<strong>本周还没人上榜</strong><p>完成一次打卡就会出现在这里。</p></div>`}
    </section>
  </main>`;
}

function membersPage() {
  const members = memberStats();
  const weeklyTotal = members.reduce((sum, member) => sum + member.weeklyCount, 0);
  return `<main class="page">
    ${header("47群友")}
    <h2 class="page-title">人齐了<br />就差你练</h2>
    <section class="members-summary"><strong>${members.length}</strong><span>位群友 · 本周共训练 ${weeklyTotal} 次</span></section>
    ${connectionNotice()}
    <section class="member-list">
      ${members.length ? members.map((member) => `<article class="member-row">
        <span class="member-avatar">${escapeHTML(initials(member.name))}</span>
        <div class="member-copy"><strong>${escapeHTML(member.name)}</strong><small>连续 ${member.streak} 天</small></div>
        <div class="member-score"><strong>${member.weeklyCount}</strong><span>本周</span></div>
      </article>`).join("") : `<div class="empty-state" style="margin-top:18px">${icon("users-three")}<strong>还没有群友加入</strong><p>成员加入后会显示在这里。</p></div>`}
    </section>
  </main>`;
}

function profilePage() {
  const members = memberStats();
  const me = currentMember(members) || { monthlyCount: 0, monthlyMinutes: 0, streak: 0, dates: new Set() };
  const now = new Date();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const offset = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7;
  const cells = Math.ceil((offset + days) / 7) * 7;

  return `<main class="page">
    ${header("我的")}
    <section class="profile-head">
      <span class="profile-avatar">${escapeHTML(initials(state.user?.name))}</span>
      <div class="profile-copy"><h1>${escapeHTML(state.user?.name)}</h1><p>训练留痕，状态自己挣。</p></div>
    </section>
    <section class="profile-summary">
      <div><strong>${me.streak}</strong><span>连续 / 天</span></div>
      <div><strong>${me.monthlyCount}</strong><span>本月 / 次</span></div>
      <div><strong>${formatDuration(me.monthlyMinutes)}</strong><span>本月时长</span></div>
    </section>
    ${connectionNotice()}
    <section class="calendar-panel">
      <div class="section-heading"><h2>${now.getMonth() + 1}月训练日历</h2><span>${me.monthlyCount} 次</span></div>
      <div class="weekdays">${["一", "二", "三", "四", "五", "六", "日"].map((day) => `<span>${day}</span>`).join("")}</div>
      <div class="training-calendar">${Array.from({ length: cells }, (_, i) => {
        const day = i - offset + 1;
        const key = day > 0 && day <= days ? localDateKey(new Date(now.getFullYear(), now.getMonth(), day)) : "";
        return `<span class="${key && me.dates?.has(key) ? "trained" : ""}">${day > 0 && day <= days ? day : ""}</span>`;
      }).join("")}</div>
    </section>
    <section class="profile-actions">
      <button class="action-row" data-action="retry">${icon("cloud-check")}<span>数据连接</span><small>${state.connection === "ready" ? "云端正常" : "点击重试"}</small></button>
      <button class="action-row" data-route="checkin">${icon("plus")}<span>补一条训练记录</span>${icon("caret-right")}</button>
      <button class="action-row danger" data-action="logout">${icon("sign-out")}<span>退出当前身份</span></button>
    </section>
  </main>`;
}

function checkinPage() {
  const form = state.checkinForm;
  const recentDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - index);
    return {
      key: localDateKey(date),
      day: index === 0 ? "今天" : new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(date),
      label: `${date.getMonth() + 1}/${date.getDate()}`,
    };
  });
  return `<main class="page page-checkin">
    <header class="checkin-header">
      <div class="form-head">
        <button class="icon-button" data-route="home" aria-label="返回">${icon("arrow-left")}</button>
        <div><h1>发布打卡</h1><p>只记录真实训练</p></div>
      </div>
    </header>
    ${connectionNotice()}
    <section class="form-section date-section">
      <div class="form-section-title"><h2>打卡日期</h2><span>支持近一周补打卡</span></div>
      <div class="date-picker" aria-label="选择打卡日期">
        ${recentDates.map((item) => `<button class="date-button ${form.date === item.key ? "is-selected" : ""}" data-date="${item.key}" aria-pressed="${form.date === item.key}"><strong>${item.day}</strong><span>${item.label}</span></button>`).join("")}
      </div>
    </section>
    <section class="form-section">
      <h2>训练类型</h2>
      <div class="type-grid">${trainingTypes.map(([type, iconName]) => `<button class="type-button ${form.type === type ? "is-selected" : ""}" data-type="${type}">${icon(iconName)}<span>${type}</span></button>`).join("")}</div>
    </section>
    <section class="form-section">
      <h2>训练部位</h2>
      <div class="parts-row">${bodyParts.map((part) => `<button class="part-button ${form.parts.includes(part) ? "is-selected" : ""}" data-part="${part}">${part}</button>`).join("")}</div>
    </section>
    <section class="form-section">
      <h2>训练时长</h2>
      <div class="duration-stepper"><button data-duration="-5" aria-label="减少5分钟">${icon("minus")}</button><strong>${form.duration} <span>分钟</span></strong><button data-duration="5" aria-label="增加5分钟">${icon("plus")}</button></div>
    </section>
    <section class="form-section">
      <h2>训练照片 <span style="color:var(--dim);font-size:12px;font-weight:400">选填</span></h2>
      <label class="photo-upload">
        ${form.photoUrl ? `<img class="photo-preview" src="${escapeHTML(form.photoUrl)}" alt="待上传训练照片预览" />` : `${icon("camera")}<strong>添加真实训练照</strong><span>自动压缩到约 300–500KB</span>`}
        <input id="photo-input" type="file" accept="image/*" />
      </label>
      ${form.uploadStatus ? `<p class="upload-status">${escapeHTML(form.uploadStatus)}</p>` : ""}
    </section>
    <section class="form-section">
      <h2>训练感受 <span style="color:var(--dim);font-size:12px;font-weight:400">选填</span></h2>
      <textarea id="note-input" maxlength="300" placeholder="写一句真实感受，不写也可以">${escapeHTML(form.note)}</textarea>
    </section>
    <button class="primary-button" data-action="submit-checkin" ${form.submitting || state.connection !== "ready" ? "disabled" : ""}>${form.submitting ? "正在保存…" : "完成打卡"}</button>
    <p class="privacy-note">${icon("lock-simple")} 仅47群成员可见</p>
  </main>`;
}

function joinPage(error = "") {
  return `<main class="join-page">
    <h1 class="join-mark">嘎巴47</h1>
    <section class="join-copy"><h1>一起练<br />别一起躺</h1><p>属于47群的私人健身打卡局。</p></section>
    <form class="join-form" id="join-form">
      <label><span>群邀请码</span><input name="code" value="47GYM" autocomplete="off" autocapitalize="characters" /></label>
      <label><span>你的昵称</span><input name="name" placeholder="群友认得出的名字" maxlength="20" autocomplete="nickname" /></label>
      ${error ? `<p class="form-error">${escapeHTML(error)}</p>` : ""}
      <button class="primary-button" type="submit">加入健身局 ${icon("arrow-right")}</button>
      <p class="privacy-note">${icon("lock-simple")} 打卡只对47群成员可见</p>
    </form>
  </main>`;
}

function loadingPage() {
  return `<div class="app-shell"><div class="loading-page"><div><div class="loading-mark"></div><strong>等待嘎巴</strong></div></div></div>`;
}

function render() {
  if (!state.user) {
    app.innerHTML = joinPage();
    return;
  }
  if (state.loading && !state.checkins.length && !state.profiles.length) {
    app.innerHTML = loadingPage();
    return;
  }
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
}

async function connect() {
  state.loading = true;
  state.connection = "connecting";
  render();
  try {
    state.service = await createService();
    if (state.user) {
      await state.service.ensureProfile(state.user.name);
      state.user = { ...state.user, id: state.service.userId };
      writeJSON(USER_KEY, state.user);
      await loadData();
    }
    state.connection = "ready";
  } catch (error) {
    console.error("嘎巴47数据连接失败", error);
    state.service = null;
    state.connection = "error";
    state.checkins = [];
    state.profiles = [];
  } finally {
    state.loading = false;
    render();
  }
}

app.addEventListener("click", async (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    state.route = routeButton.dataset.route;
    window.scrollTo({ top: 0, behavior: "smooth" });
    render();
    return;
  }

  const typeButton = event.target.closest("[data-type]");
  if (typeButton) {
    state.checkinForm.type = typeButton.dataset.type;
    if (state.checkinForm.type !== "力量") state.checkinForm.parts = [];
    render();
    return;
  }

  const dateButton = event.target.closest("[data-date]");
  if (dateButton) {
    state.checkinForm.date = dateButton.dataset.date;
    render();
    return;
  }

  const partButton = event.target.closest("[data-part]");
  if (partButton) {
    const part = partButton.dataset.part;
    state.checkinForm.parts = state.checkinForm.parts.includes(part)
      ? state.checkinForm.parts.filter((item) => item !== part)
      : [...state.checkinForm.parts, part];
    render();
    return;
  }

  const durationButton = event.target.closest("[data-duration]");
  if (durationButton) {
    const delta = Number(durationButton.dataset.duration);
    state.checkinForm.duration = Math.min(600, Math.max(5, state.checkinForm.duration + delta));
    render();
    return;
  }

  const likeButton = event.target.closest("[data-like]");
  if (likeButton && state.service) {
    likeButton.disabled = true;
    try {
      await state.service.toggleLike(likeButton.dataset.like);
      await loadData();
      render();
    } catch (error) { showToast("点赞失败，请稍后重试"); }
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const action = actionButton.dataset.action;

  if (action === "retry") {
    await connect();
    if (state.connection === "ready") showToast("已经重新连上云端");
  }

  if (action === "logout") {
    localStorage.removeItem(USER_KEY);
    state.user = null;
    state.route = "home";
    state.checkins = [];
    state.profiles = [];
    render();
  }

  if (action === "submit-checkin" && state.service && !state.checkinForm.submitting) {
    state.checkinForm.submitting = true;
    const note = state.checkinForm.note.trim();
    const selectedDate = state.checkinForm.date;
    const [year, month, day] = selectedDate.split("-").map(Number);
    const now = new Date();
    const createdAt = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
    render();
    try {
      await state.service.createCheckin({ ...state.checkinForm, note, createdAt });
      if (state.checkinForm.photoUrl) URL.revokeObjectURL(state.checkinForm.photoUrl);
      state.checkinForm = { date: localDateKey(), type: "力量", parts: ["胸", "三头"], duration: 60, photo: null, photoUrl: "", uploadStatus: "", note: "", submitting: false };
      await loadData();
      state.route = "home";
      showToast(selectedDate === localDateKey() ? "打卡成功，今天没白过" : "补打卡成功，记录已经归位");
    } catch (error) {
      console.error(error);
      state.checkinForm.submitting = false;
      showToast("保存失败，请稍后再试");
    }
  }
});

app.addEventListener("submit", async (event) => {
  if (event.target.id !== "join-form") return;
  event.preventDefault();
  const data = new FormData(event.target);
  const code = String(data.get("code") || "").trim().toUpperCase();
  const name = String(data.get("name") || "").trim();
  if (code !== "47GYM") {
    app.innerHTML = joinPage("邀请码不对，再问问群友。");
    return;
  }
  if (!name) {
    app.innerHTML = joinPage("先写一个群友认得出的昵称。");
    return;
  }
  state.user = { id: `pending-${Date.now()}`, name };
  writeJSON(USER_KEY, state.user);
  await connect();
});

app.addEventListener("change", async (event) => {
  if (event.target.id !== "photo-input") return;
  const file = event.target.files?.[0];
  if (!file) return;
  state.checkinForm.uploadStatus = "正在压缩…";
  render();
  try {
    const compressed = await compressImage(file);
    if (state.checkinForm.photoUrl) URL.revokeObjectURL(state.checkinForm.photoUrl);
    state.checkinForm.photo = compressed;
    state.checkinForm.photoUrl = URL.createObjectURL(compressed);
    state.checkinForm.uploadStatus = `已压缩到 ${Math.round(compressed.size / 1024)}KB`;
  } catch (error) {
    state.checkinForm.photo = null;
    state.checkinForm.photoUrl = "";
    state.checkinForm.uploadStatus = error.message;
  }
  render();
});

app.addEventListener("input", (event) => {
  if (event.target.id === "note-input") state.checkinForm.note = event.target.value;
});

render();
if (state.user && !PREVIEW_MODE) connect();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
}
