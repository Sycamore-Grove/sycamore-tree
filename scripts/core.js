/* 悬铃木林 · 核心纯逻辑（无 DOM 依赖，可测试）
 * main.js 与 test/ 共用，确保行为一致
 */
const VALID_STATUS = ["playable", "draft", "archived"];
const RECENT_MAX = 6;

/** 数据清洗：去重、补字段、校验 status、排序 */
function sanitize(list) {
  const seen = new Set(), out = [];
  for (const g of list) {
    if (!g || typeof g !== "object") continue;
    const id = String(g.id || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id, title: String(g.title || id), desc: String(g.desc || ""),
      category: String(g.category || "未分类"),
      tags: Array.isArray(g.tags) ? g.tags.map(String) : [],
      cover: g.cover || null, url: g.url || "",
      featured: !!g.featured,
      status: VALID_STATUS.includes(g.status) ? g.status : "playable",
      sort: Number.isFinite(g.sort) ? g.sort : 999
    });
  }
  return out.sort((a, b) => a.sort - b.sort);
}

/** 过滤：archived 隔离 + 分类 + 标签 AND + 全文搜索 */
function filterGames(games, cat, tags, query) {
  const q = (query || "").trim().toLowerCase();
  const tagSet = tags instanceof Set ? tags : new Set(tags);
  return games.filter(g => {
    if (g.status === "archived") return false;
    if (cat !== "all" && g.category !== cat) return false;
    if (tagSet.size > 0 && ![...tagSet].every(t => g.tags.includes(t))) return false;
    if (!q) return true;
    return (g.title + " " + g.desc + " " + g.category + " " + g.tags.join(" ")).toLowerCase().includes(q);
  });
}

/** 排序：default(sort) / recent / fav / title */
function sortGames(list, mode, recentIds, favSet) {
  const arr = [...list];
  if (mode === "recent") {
    const order = {};
    (recentIds || []).forEach((id, i) => { order[id] = i; });
    arr.sort((a, b) => (order[a.id] ?? 999) - (order[b.id] ?? 999));
  } else if (mode === "fav") {
    arr.sort((a, b) => (favSet.has(b.id) ? 1 : 0) - (favSet.has(a.id) ? 1 : 0) || a.sort - b.sort);
  } else if (mode === "title") {
    arr.sort((a, b) => a.title.localeCompare(b.title, "zh"));
  } else {
    arr.sort((a, b) => a.sort - b.sort);
  }
  return arr;
}

/** 搜索高亮：在文本中标记匹配词，返回带 <mark> 的 HTML */
function highlight(text, query) {
  const q = (query || "").trim();
  if (!q) return esc(text);
  const sl = text.toLowerCase(), ql = q.toLowerCase();
  let out = "", i = 0;
  while (i < text.length) {
    const idx = sl.indexOf(ql, i);
    if (idx < 0) { out += esc(text.slice(i)); break; }
    out += esc(text.slice(i, idx)) + '<mark class="hl">' + esc(text.slice(idx, idx + q.length)) + '</mark>';
    i = idx + q.length;
  }
  return out || esc(text);
}

/** HTML 转义 */
function esc(s) {
  const d = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(s ?? "").replace(/[&<>"']/g, c => d[c]);
}

/** 相对时间：方才/分前/时前/日前 */
function relTime(ts, now) {
  const d = (now || Date.now()) - ts;
  if (d < 60000) return "方才";
  if (d < 3600000) return Math.floor(d / 60000) + " 分前";
  if (d < 86400000) return Math.floor(d / 3600000) + " 时前";
  return Math.floor(d / 86400000) + " 日前";
}

/** recent 入栈：去重、置顶、限长 */
function pushRecent(list, id, ts) {
  const arr = list.filter(r => (r.id || r) !== id);
  arr.unshift({ id, ts: ts || Date.now() });
  return arr.slice(0, RECENT_MAX);
}

module.exports = { sanitize, filterGames, sortGames, highlight, esc, relTime, pushRecent, VALID_STATUS, RECENT_MAX };
