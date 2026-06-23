/* ═══ 悬铃木林 · Sycamore Grove ═══ */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };
  const FAV_KEY = "sg-fav", RECENT_KEY = "sg-recent", THEME_KEY = "sg-theme", SOUND_KEY = "sg-sound";
  const RECENT_MAX = 6, RECENT_REFRESH_MS = 60000;
  const VALID_STATUS = ["playable", "draft", "archived"];

  let games = [], filtered = [], featured = [];
  let activeCat = "all", activeTags = new Set(), searchQuery = "", sortMode = "default";
  let searchTimer = null, recentTimer = null;
  let currentModalIdx = -1, lastFocused = null;
  let audioCtx = null;

  /* ── 音效 ── */
  function ensureAudio() { if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; } } return audioCtx; }
  function tone(freq, dur, type = "sine", vol = 0.04) {
    const ctx = ensureAudio(); if (!ctx) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function clickSfx() { tone(680, 0.06, "sine", 0.03); }

  /* ── 存储 ── */
  function loadArr(k) { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) { return []; } }
  function saveArr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  let favs = loadArr(FAV_KEY);
  let recent = loadArr(RECENT_KEY).map(r => typeof r === "object" && r ? { id: String(r.id || ""), ts: Number(r.ts) || 0 } : { id: String(r || ""), ts: 0 }).filter(r => r.id);
  let soundEnabled = loadArr(SOUND_KEY).includes(1);

  function isFav(id) { return favs.includes(id); }
  function toggleFav(id) { if (isFav(id)) favs = favs.filter(x => x !== id); else favs.push(id); saveArr(FAV_KEY, favs); }
  function pushRecent(id) {
    recent = recent.filter(x => typeof x === "object" ? x.id !== id : x !== id);
    recent.unshift({ id, ts: Date.now() });
    recent = recent.slice(0, RECENT_MAX);
    saveRecent();
  }
  function removeRecent(id) { recent = recent.filter(r => (r.id || r) !== id); saveRecent(); }
  function saveRecent() { saveArr(RECENT_KEY, recent); }
  function recentId(r) { return typeof r === "object" ? r.id : r; }
  function recentTs(r) { return typeof r === "object" ? r.ts : 0; }

  function relTime(ts) {
    const d = Date.now() - ts;
    if (d < 60000) return "方才";
    if (d < 3600000) return Math.floor(d / 60000) + " 分前";
    if (d < 86400000) return Math.floor(d / 3600000) + " 时前";
    return Math.floor(d / 86400000) + " 日前";
  }

  /* ── 主题 ── */
  function applyTheme(dark) {
    document.documentElement.classList.toggle("dark-theme", dark);
    document.body.classList.toggle("dark-theme", dark);
    $("theme-toggle").querySelector(".icon-moon").style.display = dark ? "none" : "";
    $("theme-toggle").querySelector(".icon-sun").style.display = dark ? "" : "none";
  }
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(dark);
  }

  /* ── 占位叶子 SVG ── */
  const LEAF_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="11.5" r="9" opacity="0.18"/><path d="M12 21.5V5"/><path d="M12 16.5c-3.5 0-6-2.5-6-5.5s2.5-4.5 6-4.5"/><path d="M12 16.5c3.5 0 6-2.5 6-5.5s-2.5-4.5-6-4.5"/></svg>';

  /* ── sanitize ── */
  function sanitize(list) {
    const seen = new Set(), out = [];
    for (const g of list) {
      if (!g || typeof g !== "object") continue;
      const id = String(g.id || "").trim();
      if (!id || seen.has(id)) { console.warn("[sanitize] 跳过:", g); continue; }
      seen.add(id);
      out.push({
        id, title: String(g.title || id), desc: String(g.desc || ""),
        category: String(g.category || "未分类"), tags: Array.isArray(g.tags) ? g.tags.map(String) : [],
        cover: g.cover || null, url: g.url || "",
        featured: !!g.featured, status: VALID_STATUS.includes(g.status) ? g.status : "playable",
        sort: Number.isFinite(g.sort) ? g.sort : 999
      });
    }
    return out.sort((a, b) => a.sort - b.sort);
  }

  /* ── 渲染：精选区（藏阁顶部，独立于筛选） ── */
  function renderFeatured() {
    featured = games.filter(g => g.featured && g.status !== "archived");
    const lib = $("library");
    let sec = lib.querySelector(".featured");
    if (!featured.length) { if (sec) sec.remove(); return; }
    if (!sec) {
      sec = document.createElement("div");
      sec.className = "featured";
      sec.innerHTML = '<div class="featured__title">林中精选</div><div class="featured__grid"></div>';
      lib.insertBefore(sec, $("recent").parentElement.querySelector(".filters"));
    }
    const grid = sec.querySelector(".featured__grid");
    grid.innerHTML = featured.map(g => {
      const bg = g.cover ? `style="background-image:url('${esc(g.cover)}')"` : 'class="is-placeholder"';
      const ph = g.cover ? "" : `<div class="featured-card__ph">${LEAF_SVG}</div>`;
      const draft = g.status === "draft" ? '<span class="card__draft-badge">墨稿中</span>' : "";
      return `<div class="featured-card" data-id="${esc(g.id)}" data-cat="${esc(g.category)}">${draft}<div class="featured-card__bg" ${bg}></div>${ph}<div class="featured-card__overlay"></div><div class="featured-card__text"><span class="featured-card__tag">${esc(g.category)}</span><h3 class="featured-card__title">${esc(g.title)}</h3><p class="featured-card__desc">${esc(g.desc)}</p></div></div>`;
    }).join("");
    grid.querySelectorAll(".featured-card").forEach(el => {
      el.addEventListener("click", () => { const g = games.find(x => x.id === el.dataset.id); if (g) openModal(g); });
    });
  }

  /* ── 渲染：筛选条 ── */
  function renderFilters() {
    const cats = ["all", ...new Set(games.map(g => g.category))];
    const counts = {};
    games.forEach(g => counts[g.category] = (counts[g.category] || 0) + 1);
    const wrap = $("filters");
    wrap.innerHTML = cats.map(c => {
      const label = c === "all" ? "全部" : esc(c);
      const n = c === "all" ? games.length : counts[c];
      const cls = c === activeCat ? "filter is-active" : "filter";
      return `<button class="${cls}" data-cat="${esc(c)}">${label}<span class="filter__n">${n}</span></button>`;
    }).join("");
    wrap.querySelectorAll(".filter").forEach(b => b.addEventListener("click", () => {
      activeCat = b.dataset.cat; renderFilters(); applyFilter();
    }));
  }

  /* ── 渲染：标签栏（AND 筛选） ── */
  function renderTagbar() {
    const pool = activeCat === "all" ? games : games.filter(g => g.category === activeCat);
    const tagCounts = {};
    pool.forEach(g => g.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1));
    const tags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]).slice(0, 12);
    const bar = $("tagbar");
    if (!tags.length) { bar.hidden = true; bar.innerHTML = ""; return; }
    bar.hidden = false;
    bar.innerHTML = `<span class="tagbar__label">标签</span>` + tags.map(t => {
      const cls = activeTags.has(t) ? "tagchip is-active" : "tagchip";
      return `<button class="${cls}" data-tag="${esc(t)}">${esc(t)}<span class="filter__n">${tagCounts[t]}</span></button>`;
    }).join("");
    bar.querySelectorAll(".tagchip").forEach(b => b.addEventListener("click", () => {
      const t = b.dataset.tag;
      if (activeTags.has(t)) activeTags.delete(t); else activeTags.add(t);
      renderTagbar(); applyFilter();
    }));
  }

  /* ── 渲染：最近游玩 ── */
  function renderRecent() {
    const sec = $("recent"), grid = $("recent-grid");
    if (!recent.length) { sec.hidden = true; grid.innerHTML = ""; return; }
    sec.hidden = false;
    grid.innerHTML = recent.map(r => {
      const id = recentId(r), ts = recentTs(r);
      const g = games.find(x => x.id === id);
      if (!g) return "";
      const imgPart = g.cover
        ? `<div class="recent-card__img" style="background-image:url('${esc(g.cover)}')"></div>`
        : `<div class="recent-card__img is-empty"><svg viewBox="0 0 24 24"><path d="M12 21.5V5M12 16.5c-3.5 0-6-2.5-6-5.5s2.5-4.5 6-4.5M12 16.5c3.5 0 6-2.5 6-5.5s-2.5-4.5-6-4.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></div>`;
      return `<a class="recent-card" data-id="${esc(g.id)}">${imgPart}<div class="recent-card__text"><h4>${esc(g.title)}</h4><span>${esc(g.category)} · ${ts ? relTime(ts) : ""}</span></div><button class="recent-card__rm" aria-label="移除" data-rm="${esc(g.id)}">✕</button></a>`;
    }).join("");
    grid.querySelectorAll(".recent-card").forEach(el => {
      el.addEventListener("click", e => {
        if (e.target.dataset.rm) { e.preventDefault(); removeRecent(e.target.dataset.rm); renderRecent(); return; }
        const g = games.find(x => x.id === el.dataset.id);
        if (g) openModal(g);
      });
    });
  }

  /* ── 排序 ── */
  function sortList(list) {
    const arr = [...list];
    if (sortMode === "recent") {
      const order = {};
      recent.forEach((r, i) => { order[recentId(r)] = i; });
      arr.sort((a, b) => (order[a.id] ?? 999) - (order[b.id] ?? 999));
    } else if (sortMode === "fav") {
      arr.sort((a, b) => (isFav(b.id) ? 1 : 0) - (isFav(a.id) ? 1 : 0) || a.sort - b.sort);
    } else if (sortMode === "title") {
      arr.sort((a, b) => a.title.localeCompare(b.title, "zh"));
    } else {
      arr.sort((a, b) => a.sort - b.sort);
    }
    return arr;
  }

  /* ── 渲染：卡片 ── */
  function renderCards() {
    const grid = $("game-grid"), empty = $("empty-state");
    $("result-count").textContent = `共 ${filtered.length} 作`;
    if (!filtered.length) {
      grid.innerHTML = "";
      empty.classList.add("is-visible");
      const q = searchQuery.trim();
      const hasFilter = activeCat !== "all" || activeTags.size > 0;
      $("empty-msg").textContent = q ? `未寻得含「${q}」之作` : "无匹配的游戏";
      $("empty-clear").hidden = !(q || hasFilter);
      return;
    }
    empty.classList.remove("is-visible");
    const q = searchQuery.trim();
    const hi = (s) => {
      if (!q) return esc(s);
      const esc_s = esc(s), qi = q.toLowerCase(), si = s.toLowerCase();
      let out = "", i = 0;
      while (i < s.length) {
        const idx = si.indexOf(qi, i);
        if (idx < 0) { out += esc_s.slice(esc(s.slice(0,i)).length); break; }
        out += esc(s.slice(i, idx)) + '<mark class="hl">' + esc(s.slice(idx, idx + q.length)) + '</mark>';
        i = idx + q.length;
      }
      return out || esc_s;
    };
    grid.innerHTML = filtered.map((g, i) => {
      const bg = g.cover
        ? `<img class="card__img" src="${esc(g.cover)}" alt="${esc(g.title)}" loading="lazy" decoding="async" />`
        : `<div class="card__bg is-placeholder"></div><div class="card__ph-icon">${LEAF_SVG}</div>`;
      const draft = g.status === "draft" ? '<span class="card__draft-badge">墨稿中</span>' : "";
      const favMark = isFav(g.id) ? `<div class="card__fav-mark is-visible"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></div>` : "";
      return `<a class="card reveal" data-id="${esc(g.id)}" data-cat="${esc(g.category)}" style="animation-delay:${Math.min(i, 8) * 0.05}s">${favMark}${draft}${bg}<div class="card__overlay"></div><div class="card__text"><span class="card__tag">${esc(g.category)}</span><h3 class="card__title">${hi(g.title)}</h3><p class="card__desc">${hi(g.desc)}</p></div></a>`;
    }).join("");
    grid.querySelectorAll(".card").forEach(el => {
      el.addEventListener("click", () => { const g = games.find(x => x.id === el.dataset.id); if (g) openModal(g); });
    });
    setupReveal();
  }

  /* ── 过滤主流程 ── */
  function applyFilter() {
    const q = searchQuery.trim().toLowerCase();
    filtered = sortList(games.filter(g => {
      if (g.status === "archived") return false;
      if (activeCat !== "all" && g.category !== activeCat) return false;
      if (activeTags.size > 0 && ![...activeTags].every(t => g.tags.includes(t))) return false;
      if (!q) return true;
      return (g.title + " " + g.desc + " " + g.category + " " + g.tags.join(" ")).toLowerCase().includes(q);
    }));
    renderCards();
  }

  /* ── 弹窗 + 焦点陷阱 ── */
  function openModal(g) {
    currentModalIdx = filtered.findIndex(x => x.id === g.id);
    lastFocused = document.activeElement;
    const m = $("modal");
    const cover = $("modal-cover");
    if (g.cover) {
      cover.classList.remove("is-placeholder");
      cover.style.backgroundImage = `url('${g.cover}')`;
      cover.innerHTML = "";
    } else {
      cover.classList.add("is-placeholder");
      cover.style.backgroundImage = "";
      cover.innerHTML = LEAF_SVG;
    }
    $("modal-tag").textContent = g.category;
    $("modal-tags").innerHTML = g.tags.map(t => `<span class="mtag">${esc(t)}</span>`).join("");
    $("modal-title").textContent = g.title;
    $("modal-desc").textContent = g.desc;
    const idx = $("modal-idx");
    if (idx) idx.textContent = `第 ${currentModalIdx + 1} 作 · 共 ${filtered.length} 作`;
    const btn = $("modal-btn");
    if (g.url && g.status === "playable") { btn.disabled = false; btn.textContent = "进入游戏"; }
    else if (g.status === "draft") { btn.disabled = true; btn.textContent = "尚在林中"; }
    else { btn.disabled = true; btn.textContent = "暂不可入"; }
    $("modal-fav").classList.toggle("is-fav", isFav(g.id));
    const nav = document.querySelector(".modal__nav");
    nav.querySelector('[data-dir="prev"]').disabled = currentModalIdx <= 0;
    nav.querySelector('[data-dir="next"]').disabled = currentModalIdx >= filtered.length - 1;
    m.hidden = false;
    document.body.style.overflow = "hidden";
    $("modal-fav").focus();
  }
  function closeModal() {
    $("modal").hidden = true;
    currentModalIdx = -1;
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }
  function modalStep(dir) {
    const ni = currentModalIdx + dir;
    if (ni < 0 || ni >= filtered.length) return;
    openModal(filtered[ni]);
  }
  function trapFocus(e) {
    if ($("modal").hidden) return;
    const panel = document.querySelector(".modal__panel");
    const f = panel.querySelectorAll('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.key === "Tab") {
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  /* ── 游戏播放器 ── */
  function playGame(g) {
    if (!g.url || g.status !== "playable") { openModal(g); return; }
    pushRecent(g.id); renderRecent();
    $("game-player-title").textContent = g.title;
    const frame = $("game-player-iframe"), loading = $("game-player-loading");
    loading.classList.remove("is-hidden");
    frame.src = g.url;
    frame.onload = () => loading.classList.add("is-hidden");
    $("game-player").classList.add("is-open");
    $("game-player").setAttribute("aria-hidden", "false");
    closeModal();
  }
  function closeGame() {
    const p = $("game-player");
    p.classList.remove("is-open");
    p.setAttribute("aria-hidden", "true");
    $("game-player-iframe").src = "";
  }

  /* ── Reveal ── */
  function setupReveal() {
    const els = document.querySelectorAll(".reveal:not(.is-revealed)");
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-revealed"); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    els.forEach(el => io.observe(el));
  }

  /* ── 滚动 ── */
  let lastScroll = 0;
  function onScroll() {
    const y = window.scrollY, doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    $("progress").style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    $("to-top").classList.toggle("is-visible", y > 400);
    const nav = $("nav");
    if (y > lastScroll && y > 200) nav.classList.add("is-hidden");
    else nav.classList.remove("is-hidden");
    lastScroll = y;
    let cur = "home";
    for (const id of ["home", "library", "about"]) {
      const el = $(id); if (el && el.getBoundingClientRect().top <= 120) cur = id;
    }
    document.querySelectorAll(".nav__links a").forEach(a => {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + cur);
    });
  }

  /* ── 渲染：卷目（分卷索引） ── */
  function renderToc() {
    const toc = $("toc");
    const cats = [...new Set(games.map(g => g.category))];
    if (!cats.length) { toc.hidden = true; return; }
    const catEn = { "策略": "Strategy", "解谜": "Puzzle", "叙事": "Narrative" };
    toc.innerHTML = cats.map(c => {
      const list = games.filter(g => g.category === c && g.status !== "archived");
      if (!list.length) return "";
      const items = list.map(g => {
        const draft = g.status === "draft" ? '<span class="toc__item-draft">墨稿</span>' : "";
        return `<a class="toc__item" data-id="${esc(g.id)}"><span class="toc__item-id">${esc(g.id)}</span><span class="toc__item-name">${esc(g.title)}</span>${draft}</a>`;
      }).join("");
      return `<div class="toc__sec" data-cat="${esc(c)}"><div class="toc__sec-head"><span class="toc__sec-name">${esc(c)}</span><span class="toc__sec-en">${esc(catEn[c] || "")}</span><span class="toc__sec-count">${list.length} 作</span><span class="toc__sec-arrow">▾</span></div><div class="toc__sec-items">${items}</div></div>`;
    }).join("");
    toc.querySelectorAll(".toc__sec-head").forEach(h => {
      h.addEventListener("click", () => h.parentElement.classList.toggle("is-collapsed"));
    });
    toc.querySelectorAll(".toc__item").forEach(el => {
      el.addEventListener("click", e => {
        e.preventDefault();
        const g = games.find(x => x.id === el.dataset.id);
        if (g) openModal(g);
      });
    });
  }

  /* ── 清空筛选 ── */
  function clearAllFilters() {
    searchQuery = ""; activeCat = "all"; activeTags.clear();
    $("search").value = "";
    renderFilters(); renderTagbar(); applyFilter();
  }

  /* ── 事件 ── */
  function setupEvents() {
    $("theme-toggle").addEventListener("click", () => {
      const dark = !document.documentElement.classList.contains("dark-theme");
      applyTheme(dark);
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
      if (soundEnabled) clickSfx();
    });
    const search = $("search");
    search.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { searchQuery = search.value; applyFilter(); }, 180);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== search && $("modal").hidden && !$("game-player").classList.contains("is-open")) {
        e.preventDefault(); search.focus();
      }
      if (e.key === "Escape") {
        if (!$("modal").hidden) closeModal();
        else if ($("game-player").classList.contains("is-open")) closeGame();
      }
      if (!$("modal").hidden) {
        if (e.key === "ArrowLeft") modalStep(-1);
        if (e.key === "ArrowRight") modalStep(1);
        trapFocus(e);
      }
    });
    $("modal-close").addEventListener("click", closeModal);
    $("modal-x").addEventListener("click", closeModal);
    $("modal-fav").addEventListener("click", () => {
      if (currentModalIdx < 0) return;
      const g = filtered[currentModalIdx];
      toggleFav(g.id);
      $("modal-fav").classList.toggle("is-fav", isFav(g.id));
      renderCards();
      if (soundEnabled) clickSfx();
    });
    $("modal-btn").addEventListener("click", () => {
      if (currentModalIdx < 0) return;
      const g = filtered[currentModalIdx];
      if (g.url && g.status === "playable") playGame(g);
    });
    document.querySelector(".modal__nav").addEventListener("click", e => {
      const dir = e.target.closest("button")?.dataset.dir;
      if (dir === "next") modalStep(1);
      else if (dir === "prev") modalStep(-1);
    });
    $("game-player-close").addEventListener("click", closeGame);
    $("game-player-reload").addEventListener("click", () => {
      const f = $("game-player-iframe"); f.src = f.src;
      $("game-player-loading").classList.remove("is-hidden");
    });
    $("game-player-fullscreen").addEventListener("click", () => {
      const f = $("game-player-iframe");
      if (f.requestFullscreen) f.requestFullscreen().catch(() => {});
    });
    $("to-top").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    $("empty-clear").addEventListener("click", clearAllFilters);
    $("sort-select").addEventListener("change", e => { sortMode = e.target.value; applyFilter(); });
    $("toc-toggle").addEventListener("click", () => {
      const btn = $("toc-toggle"), toc = $("toc");
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      btn.textContent = open ? "卷目 ▾" : "卷目 ▴";
      toc.hidden = open;
    });
    window.addEventListener("scroll", () => requestAnimationFrame(onScroll), { passive: true });
    // recent 定时刷新相对时间
    recentTimer = setInterval(renderRecent, RECENT_REFRESH_MS);
  }

  /* ── 初始化 ── */
  async function init() {
    initTheme();
    try {
      const res = await fetch("data/games.json");
      const raw = await res.json();
      games = sanitize(Array.isArray(raw) ? raw : []);
    } catch (e) {
      $("game-grid").innerHTML = "<p style='grid-column:1/-1;text-align:center;color:var(--fg-3);padding:40px'>数据加载失败</p>";
      return;
    }
    filtered = games;
    renderFeatured();
    renderFilters();
    renderTagbar();
    renderToc();
    renderRecent();
    renderCards();
    setupEvents();
    setupReveal();
    onScroll();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
