/* 悬铃木林 · 数据校验脚本
 * 用法: node scripts/validate.js
 * 检查: JSON 合法性 / id 重复 / 必填字段 / status 取值 / url 与 status 一致
 * 输出: 错误数 + 警告数 + 分类/标签统计
 */
const fs = require('fs');
const path = require('path');

const DATA = path.resolve(__dirname, '..', 'data', 'games.json');
const REQUIRED = ['id', 'title', 'category'];
const VALID_STATUS = ['playable', 'draft', 'archived'];

let errors = 0, warnings = 0;
const logE = (m) => { console.error('  ✗ ' + m); errors++; };
const logW = (m) => { console.warn('  ⚠ ' + m); warnings++; };

if (!fs.existsSync(DATA)) { console.error('找不到 data/games.json'); process.exit(1); }

let raw;
try { raw = JSON.parse(fs.readFileSync(DATA, 'utf8')); }
catch (e) { console.error('JSON 解析失败: ' + e.message); process.exit(1); }

if (!Array.isArray(raw)) { console.error('games.json 顶层应为数组'); process.exit(1); }

console.log('\n══ 悬铃木林 · 数据校验 ══');
console.log('共 ' + raw.length + ' 条记录\n');

const ids = new Set();
const cats = {}, tagSet = new Set();
let playable = 0, draft = 0, archived = 0, featured = 0;

raw.forEach((g, i) => {
  const ctx = '#' + (g && g.id ? g.id : 'idx=' + i);
  if (!g || typeof g !== 'object') { logE(ctx + ' 非对象'); return; }
  // 必填
  REQUIRED.forEach(k => {
    if (!g[k] || typeof g[k] !== 'string') logE(ctx + ' 缺字段 ' + k);
  });
  // id 重复
  if (g.id) {
    if (ids.has(g.id)) logE('id 重复: ' + g.id);
    ids.add(g.id);
  }
  // status
  const st = g.status || 'playable';
  if (!VALID_STATUS.includes(st)) logE(ctx + ' status 非法: ' + st);
  if (st === 'playable' && !g.url) logW(ctx + ' status=playable 但无 url');
  if (st === 'draft' && g.url) logW(ctx + ' status=draft 却有 url');
  // tags
  if (g.tags && !Array.isArray(g.tags)) logE(ctx + ' tags 应为数组');
  // sort
  if (g.sort !== undefined && !Number.isFinite(g.sort)) logE(ctx + ' sort 非数字');
  // 统计
  if (g.category) cats[g.category] = (cats[g.category] || 0) + 1;
  if (Array.isArray(g.tags)) g.tags.forEach(t => tagSet.add(t));
  if (st === 'playable') playable++;
  else if (st === 'draft') draft++;
  else if (st === 'archived') archived++;
  if (g.featured) featured++;
});

console.log('── 统计 ──');
console.log('  分类: ' + Object.entries(cats).map(([k, v]) => k + '(' + v + ')').join(', '));
console.log('  标签: ' + tagSet.size + ' 个');
console.log('  状态: playable=' + playable + ' draft=' + draft + ' archived=' + archived);
console.log('  精选: ' + featured);
console.log('\n── 结果 ──');
console.log('  错误: ' + errors + ' · 警告: ' + warnings);
console.log(errors === 0 ? '  ✓ 数据合法' : '  ✗ 存在错误，请修正');
console.log('');
process.exit(errors === 0 ? 0 : 1);
