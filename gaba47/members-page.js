(function () {
  const SUPABASE_URL = "https://jujvzrpqagjxeeafqlyo.supabase.co";
  const SUPABASE_KEY = "sb_publishable_eg6Dbh9a46pa14-yPqrFiQ_AQgER7J-";
  const SESSION_KEY = "gaba47-supabase-session-v1";
  let applying = false;
  let lastRun = 0;
  let cachedData = null;

  const readJSON = (key) => {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  };
  const escapeHTML = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const icon = (name) => `<i class="ph ph-${name}" aria-hidden="true"></i>`;
  const initials = (name = "47") => [...String(name).trim()].slice(0, 1).join("") || "47";
  const localDateKey = (value = new Date()) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const daysBetweenLocalDates = (fromKey, toKey = localDateKey()) => {
    const parse = (key) => {
      const [year, month, day] = String(key || "").split("-").map(Number);
      return year && month && day ? new Date(year, month - 1, day) : null;
    };
    const from = parse(fromKey);
    const to = parse(toKey);
    if (!from || !to) return null;
    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((to - from) / 86400000));
  };
  const parseMinutes = (item) => Number(item.duration || item.duration_minutes || (item.details?.match(/(\d+)\s*分钟/) || [])[1] || 0);
  const avatarMarkup = (member, className = "member-avatar") => {
    const name = member?.display_name || member?.name || "47";
    const url = member?.avatarUrl || member?.avatar_url_signed;
    return url ? `<span class="${className} has-image"><img src="${escapeHTML(url)}" alt="${escapeHTML(name)}的头像" /></span>` : `<span class="${className}" aria-label="${escapeHTML(name)}的头像">${escapeHTML(initials(name))}</span>`;
  };

  async function parseResponse(response) {
    const text = await response.text();
    if (!response.ok) throw new Error(text || `请求失败：${response.status}`);
    if (!text) return null;
    try { return JSON.parse(text); } catch { return text; }
  }

  async function api(path, options = {}) {
    const session = readJSON(SESSION_KEY);
    if (!session?.access_token) throw new Error("missing session");
    return parseResponse(await fetch(`${SUPABASE_URL}${path}`, {
      ...options,
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}`, ...(options.headers || {}) },
    }));
  }

  async function loadData() {
    if (cachedData && Date.now() - lastRun < 15000) return cachedData;
    const signedCache = new Map();
    const encodePath = (value) => value.split("/").map(encodeURIComponent).join("/");
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
    let profiles;
    try { profiles = await api("/rest/v1/profiles?select=id,display_name,avatar_url,created_at&order=created_at.asc"); }
    catch (error) { profiles = await api("/rest/v1/profiles?select=id,display_name,created_at&order=created_at.asc"); }
    profiles = await Promise.all((profiles || []).map(async (profile) => ({ ...profile, avatar_url_signed: await signPath(profile.avatar_url) })));
    const rawCheckins = await api("/rest/v1/checkins_feed?select=*&order=created_at.desc&limit=200");
    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
    const checkins = (rawCheckins || []).map((item) => {
      const profile = profileMap.get(item.user_id);
      return {
        id: item.id,
        userId: item.user_id,
        name: item.display_name,
        avatarUrl: profile?.avatar_url_signed || null,
        createdAt: item.created_at,
        duration: item.duration_minutes,
      };
    });
    cachedData = { profiles, checkins };
    lastRun = Date.now();
    return cachedData;
  }

  function memberStats(profiles, checkins) {
    const now = new Date();
    const todayKey = localDateKey(now);
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const map = new Map();
    for (const profile of profiles) {
      map.set(profile.id, { id: profile.id, name: profile.display_name, avatarUrl: profile.avatar_url_signed || null, weeklyCount: 0, monthlyCount: 0, monthlyMinutes: 0, totalMinutes: 0, streak: 0, dates: new Set(), lastCheckinAt: null, lastDateKey: "", trainedToday: false, daysSinceLast: null });
    }
    for (const item of checkins) {
      const id = item.userId || item.name;
      if (!map.has(id)) map.set(id, { id, name: item.name, avatarUrl: item.avatarUrl, weeklyCount: 0, monthlyCount: 0, monthlyMinutes: 0, totalMinutes: 0, streak: 0, dates: new Set(), lastCheckinAt: null, lastDateKey: "", trainedToday: false, daysSinceLast: null });
      const member = map.get(id);
      const created = new Date(item.createdAt);
      const minutes = parseMinutes(item);
      if (!Number.isNaN(created.getTime())) {
        if (created >= weekStart) member.weeklyCount += 1;
        if (created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()) {
          member.monthlyCount += 1;
          member.monthlyMinutes += minutes;
        }
        const dateKey = localDateKey(created);
        member.dates.add(dateKey);
        if (!member.lastCheckinAt || created > new Date(member.lastCheckinAt)) {
          member.lastCheckinAt = item.createdAt;
          member.lastDateKey = dateKey;
        }
      }
      member.totalMinutes += minutes;
    }
    for (const member of map.values()) {
      const cursor = new Date();
      cursor.setHours(0, 0, 0, 0);
      if (!member.dates.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
      while (member.dates.has(localDateKey(cursor))) { member.streak += 1; cursor.setDate(cursor.getDate() - 1); }
      member.trainedToday = member.dates.has(todayKey);
      member.daysSinceLast = member.lastDateKey ? daysBetweenLocalDates(member.lastDateKey, todayKey) : null;
    }
    return [...map.values()];
  }

  function memberStatusCard({ tone, iconName, title, countText, members, detail }) {
    return `<article class="status-card status-${tone}"><div class="status-card-head"><h3><span class="status-icon">${icon(iconName)}</span>${escapeHTML(title)}</h3><span>${escapeHTML(countText)}</span></div>${members.length ? `<div class="status-member-grid">${members.map((member) => `<button class="status-member" data-member-id="${escapeHTML(member.id)}" aria-label="查看${escapeHTML(member.name)}的最近训练记录">${avatarMarkup(member)}<span class="status-member-copy"><strong>${escapeHTML(member.name)}</strong><small>${escapeHTML(detail(member))}</small></span></button>`).join("")}</div>` : `<p class="status-empty">这一组暂时没人。</p>`}</article>`;
  }

  function renderMembersPage(main, members) {
    const online = members.filter((member) => member.trainedToday).sort((a, b) => new Date(b.lastCheckinAt || 0) - new Date(a.lastCheckinAt || 0) || a.name.localeCompare(b.name, "zh-CN"));
    const stable = members.filter((member) => !member.trainedToday && member.daysSinceLast >= 1 && member.daysSinceLast <= 3).sort((a, b) => a.daysSinceLast - b.daysSinceLast || new Date(b.lastCheckinAt || 0) - new Date(a.lastCheckinAt || 0) || a.name.localeCompare(b.name, "zh-CN"));
    const flat = members.filter((member) => !member.trainedToday && (member.daysSinceLast === null || member.daysSinceLast >= 4)).sort((a, b) => (a.daysSinceLast ?? 9999) - (b.daysSinceLast ?? 9999) || a.name.localeCompare(b.name, "zh-CN"));
    const attendanceRate = members.length ? Math.round((online.length / members.length) * 100) : 0;
    const remaining = Math.max(0, members.length - online.length);
    const statusText = remaining === 0 && members.length ? "今天全员出勤 ⚡" : `今天还剩 ${remaining} 个没动`;
    const header = main.querySelector(".app-header");
    main.innerHTML = "";
    if (header) main.append(header);
    main.insertAdjacentHTML("beforeend", `<section class="members-section"><h2 class="dot-heading">今日出勤板</h2><div class="attendance-card"><div class="attendance-metrics"><div><span>群友</span><strong>${members.length}<small>人</small></strong></div><div><span>今日已练</span><strong>${online.length}<small>人</small></strong></div><div><span>出勤率</span><strong>${attendanceRate}<small>%</small></strong></div></div><p>${icon("clock")} ${escapeHTML(statusText)}</p></div></section><section class="members-section"><h2 class="dot-heading">群友状态</h2><div class="status-stack">${memberStatusCard({ tone: "online", iconName: "lightning", title: "状态在线", countText: `${online.length} 人在线`, members: online, detail: (member) => member.streak > 0 ? `连续 ${member.streak} 天` : "今天练过" })}${memberStatusCard({ tone: "stable", iconName: "smiley", title: "尚且稳定", countText: `${stable.length} 人稳定`, members: stable, detail: (member) => member.daysSinceLast === 1 ? "昨天练过" : `${member.daysSinceLast}天前练过` })}${memberStatusCard({ tone: "flat", iconName: "skull", title: "疑似躺平", countText: `${flat.length} 人躺平`, members: flat, detail: (member) => member.daysSinceLast === null ? "还没练过" : `${member.daysSinceLast}天没练` })}</div><p class="member-help">${icon("hand-pointing")} 点击群友可查看最近训练记录</p></section>`);
    main.dataset.membersEnhanced = "1";
  }

  async function enhanceMembersPage() {
    if (applying) return;
    const main = document.querySelector(".page-members");
    if (!main || main.dataset.membersEnhanced === "1") return;
    applying = true;
    try {
      const data = await loadData();
      renderMembersPage(main, memberStats(data.profiles, data.checkins));
    } catch (error) {
      console.warn("群友页改版数据加载失败", error);
    } finally {
      applying = false;
    }
  }

  document.addEventListener("click", (event) => {
    const member = event.target.closest("[data-member-id]");
    if (!member) return;
    const shell = document.querySelector(".app-shell");
    if (!shell) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.role = "status";
    toast.textContent = "群友训练记录入口已保留";
    shell.append(toast);
    setTimeout(() => toast.remove(), 1800);
  });

  const observer = new MutationObserver(() => {
    window.clearTimeout(observer.timer);
    observer.timer = window.setTimeout(enhanceMembersPage, 30);
  });
  observer.observe(document.querySelector("#app"), { childList: true, subtree: true });
  window.addEventListener("focus", () => { cachedData = null; enhanceMembersPage(); });
  enhanceMembersPage();
})();
