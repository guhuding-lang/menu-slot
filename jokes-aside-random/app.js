
const reels = [...document.querySelectorAll(".reel-window")];
const spinButton = document.getElementById("spinButton");
const handleButton = document.getElementById("handleButton");
const specialButton = document.getElementById("specialButton");
const historyButton = document.getElementById("historyButton");
const statusText = document.getElementById("statusText");
const episodeDisplay = document.getElementById("episodeDisplay");
const modal = document.getElementById("resultModal");
const closeModal = document.getElementById("closeModal");
const againButton = document.getElementById("againButton");
const historyDrawer = document.getElementById("historyDrawer");
const closeDrawer = document.getElementById("closeDrawer");
const historyList = document.getElementById("historyList");
const toast = document.getElementById("toast");

const HISTORY_KEY = "jokes-aside-random-history-v1";
let isSpinning = false;
let lastEpisode = null;
let currentItem = null;
let audioContext = null;

function buildReels() {
  reels.forEach((windowEl) => {
    const strip = windowEl.querySelector(".reel-strip");
    const values = [];
    for (let cycle = 0; cycle < 10; cycle++) {
      for (let digit = 0; digit <= 9; digit++) values.push(digit);
    }
    strip.innerHTML = values.map(n => `<div class="digit">${n}</div>`).join("");
    strip.dataset.index = "1";
    requestAnimationFrame(() => setReelPosition(windowEl, 1, false));
  });
}

function digitHeight(windowEl) {
  return windowEl.clientHeight / 3;
}

function setReelPosition(windowEl, index, animate, duration = 1300) {
  const strip = windowEl.querySelector(".reel-strip");
  windowEl.classList.toggle("spinning", animate);
  strip.style.transitionDuration = animate ? `${duration}ms` : "0ms";
  strip.style.transform = `translateY(${-index * digitHeight(windowEl)}px)`;
  strip.dataset.index = String(index);
}

function playTick(frequency = 340, duration = .045, volume = .025) {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = "square";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
    osc.connect(gain).connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch (_) {}
}

function playWin() {
  [523, 659, 784, 1047].forEach((f, i) => {
    setTimeout(() => playTick(f, .12, .045), i * 90);
  });
}

function chooseEpisode() {
  let item;
  do {
    item = EPISODES[Math.floor(Math.random() * EPISODES.length)];
  } while (EPISODES.length > 1 && item.episode === lastEpisode);
  lastEpisode = item.episode;
  return item;
}

function padEpisode(number) {
  return String(number).padStart(3, "0");
}

async function spin(item = chooseEpisode(), isSpecial = false) {
  if (isSpinning) return;
  isSpinning = true;
  currentItem = item;
  spinButton.disabled = true;
  spinButton.classList.add("pressed");
  handleButton.classList.remove("pull");
  void handleButton.offsetWidth;
  handleButton.classList.add("pull");
  statusText.textContent = "正在寻找笑声…";
  episodeDisplay.textContent = "EP.---";

  const targetText = isSpecial ? "777" : padEpisode(item.episode);
  const targetDigits = targetText.split("").map(Number);
  const durations = [1250, 1550, 1860];

  reels.forEach((windowEl, i) => {
    const current = Number(windowEl.querySelector(".reel-strip").dataset.index || 1);
    const currentDigit = current % 10;
    const deltaToTarget = (targetDigits[i] - currentDigit + 10) % 10;
    const loops = 60 + i * 10;
    const targetIndex = current + loops + deltaToTarget;
    setReelPosition(windowEl, targetIndex, true, durations[i]);

    let tickCount = 0;
    const tickTimer = setInterval(() => {
      playTick(220 + i * 45, .025, .014);
      tickCount++;
      if (tickCount > 13 + i * 3) clearInterval(tickTimer);
    }, 70 + i * 16);
  });

  await new Promise(resolve => setTimeout(resolve, durations[2] + 120));

  reels.forEach((windowEl, i) => {
    const safeIndex = 41 + targetDigits[i];
    setReelPosition(windowEl, safeIndex, false);
  });

  statusText.textContent = isSpecial ? "彩蛋节目出现" : "抽取成功";
  episodeDisplay.textContent = isSpecial ? "SPECIAL" : `EP.${targetText}`;
  spinButton.classList.remove("pressed");
  spinButton.disabled = false;
  isSpinning = false;

  if (!isSpecial) saveHistory(item);
  playWin();
  createConfetti();
  showResult(item, isSpecial);
}

function showResult(item, isSpecial = false) {
  document.getElementById("resultLabel").textContent = isSpecial ? "特别节目" : "第";
  document.getElementById("resultEpisode").textContent = isSpecial ? "彩蛋" : padEpisode(item.episode);
  document.querySelector(".result-number small:last-child").textContent = isSpecial ? "" : "期";
  document.getElementById("resultTitle").textContent = item.title;
  document.getElementById("resultHosts").textContent = `主播：${item.hosts || "未标注"}`;
  document.getElementById("resultDate").textContent = item.date || "—";
  document.getElementById("resultDuration").textContent = item.duration || "—";
  document.getElementById("resultPlays").textContent = formatPlays(item.plays);
  const link = document.getElementById("listenLink");
  link.href = item.url || "#";
  link.style.display = item.url ? "grid" : "none";
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  closeModal.focus();
}

function hideResult() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  spinButton.focus();
}

function formatPlays(value) {
  const n = Number(value || 0);
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1)}万`;
  return n.toLocaleString("zh-CN");
}

function saveHistory(item) {
  const current = getHistory().filter(e => e.episode !== item.episode);
  current.unshift({
    episode: item.episode,
    title: item.title,
    hosts: item.hosts,
    duration: item.duration,
    plays: item.plays,
    date: item.date,
    url: item.url
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(current.slice(0, 10)));
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch (_) { return []; }
}

function renderHistory() {
  const list = getHistory();
  if (!list.length) {
    historyList.innerHTML = `<div class="history-empty">还没有抽取记录。<br>拉动一次摇杆试试。</div>`;
    return;
  }
  historyList.innerHTML = list.map(item => `
    <button class="history-item" type="button" data-episode="${item.episode}">
      <span class="history-ep">${padEpisode(item.episode)}</span>
      <span class="history-title">${escapeHtml(item.title)}</span>
    </button>
  `).join("");
  historyList.querySelectorAll(".history-item").forEach(button => {
    button.addEventListener("click", () => {
      const ep = Number(button.dataset.episode);
      const item = EPISODES.find(e => e.episode === ep);
      closeHistory();
      if (item) showResult(item, false);
    });
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openHistory() {
  renderHistory();
  historyDrawer.classList.add("open");
  historyDrawer.setAttribute("aria-hidden", "false");
  closeDrawer.focus();
}

function closeHistory() {
  historyDrawer.classList.remove("open");
  historyDrawer.setAttribute("aria-hidden", "true");
}

function chooseSpecial() {
  if (!SPECIALS.length) {
    showToast("暂时没有彩蛋节目");
    return;
  }
  spin(SPECIALS[Math.floor(Math.random() * SPECIALS.length)], true);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function createConfetti() {
  const colors = ["#f0b94f", "#fff0b0", "#a96527", "#c94b2b", "#f7d987"];
  for (let i = 0; i < 32; i++) {
    const piece = document.createElement("i");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.setProperty("--duration", `${1.7 + Math.random() * 1.4}s`);
    piece.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
    piece.style.transform = `rotate(${Math.random() * 180}deg)`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 3400);
  }
}

function recalcReels() {
  reels.forEach(windowEl => {
    const index = Number(windowEl.querySelector(".reel-strip").dataset.index || 1);
    setReelPosition(windowEl, index, false);
  });
}

spinButton.addEventListener("click", () => spin());
handleButton.addEventListener("click", () => spin());
specialButton.addEventListener("click", chooseSpecial);
historyButton.addEventListener("click", openHistory);
closeModal.addEventListener("click", hideResult);
againButton.addEventListener("click", () => {
  hideResult();
  setTimeout(() => spin(), 160);
});
closeDrawer.addEventListener("click", closeHistory);
modal.addEventListener("click", event => {
  if (event.target === modal) hideResult();
});
historyDrawer.addEventListener("click", event => {
  if (event.target === historyDrawer) closeHistory();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (modal.classList.contains("open")) hideResult();
    if (historyDrawer.classList.contains("open")) closeHistory();
  }
  if ((event.key === " " || event.key === "Enter") &&
      !modal.classList.contains("open") &&
      !historyDrawer.classList.contains("open") &&
      document.activeElement === document.body) {
    event.preventDefault();
    spin();
  }
});
window.addEventListener("resize", recalcReels);

buildReels();