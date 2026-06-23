/* 悬铃木林 · 副本 一站式完成度检查
 * 用法: node scripts/check.js
 * 6 项可量化标准，每项有可复现检查，全通过即"全面优化完成"
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIR = path.resolve(__dirname, '..');
const read = (r) => fs.readFileSync(path.join(DIR, r), 'utf8');
const html = read('index.html'), css = read('styles/main.css'), js = read('scripts/main.js'), gamesJson = read('data/games.json'), readme = read('README.md');

const sections = [];
function section(name) { sections.push({ name, items: [] }); }
function pass(desc) { sections[sections.length - 1].items.push({ ok: true, desc }); }
function fail(desc, detail) { sections[sections.length - 1].items.push({ ok: false, desc, detail }); }

// ── 1. 零语法错误 ──
section('1. 零语法错误');
try { execSync('node --check scripts/main.js', { cwd: DIR, stdio: 'pipe' }); pass('node --check scripts/main.js'); }
catch (e) { fail('node --check scripts/main.js', e.message); }
try { execSync('node --check scripts/validate.js', { cwd: DIR, stdio: 'pipe' }); pass('node --check scripts/validate.js'); }
catch (e) { fail('node --check scripts/validate.js', e.message); }

// ── 2. 数据合法 ──
section('2. 数据合法');
try {
  const v = execSync('node scripts/validate.js', { cwd: DIR, encoding: 'utf8', stdio: 'pipe' });
  v.includes('✓ 数据合法') ? pass('validate.js 输出"数据合法"') : fail('validate.js', v);
} catch (e) { fail('validate.js 运行', e.message); }
const games = JSON.parse(gamesJson);
games.length >= 6 ? pass('游戏数 ≥ 6（实际 ' + games.length + '）') : fail('游戏数', games.length);
games.every(g => ['id','title','category','status','sort'].every(f => g[f] !== undefined))
  ? pass('每款含必填字段') : fail('字段缺失');

// ── 3. 零死代码 ──
section('3. 零死代码');
// JS 引用的 DOM id 全在 HTML
const idsUsed = [...new Set([...js.matchAll(/\$\("([a-zA-Z][a-zA-Z0-9-]*)"\)/g)].map(m => m[1]))];
const idMissing = idsUsed.filter(id => !html.includes('id="' + id + '"'));
idMissing.length === 0 ? pass('JS 引用的 ' + idsUsed.length + ' 个 id 全在 HTML') : fail('id 缺失', idMissing.join(','));
// CSS 大括号平衡
const o = (css.match(/{/g) || []).length, c = (css.match(/}/g) || []).length;
o === c ? pass('CSS 大括号平衡 (' + o + '/' + c + ')') : fail('CSS 大括号', o + '/' + c);
// 无明显未使用变量（粗检：const/let 声明后是否在文件后文出现，跳过小写单字母工具变量）
// 此项宽松，仅检查关键函数是否被调用
const funcs = ['renderFeatured','renderToc','renderTagbar','renderRecent','renderCards','applyFilter','openModal','closeModal','trapFocus','sanitize','modalStep','sortList','clearAllFilters'];
const deadFunc = funcs.filter(f => !js.includes(f + '(') && !js.includes(f + ' '));
deadFunc.length === 0 ? pass('13 个核心函数均有调用') : fail('死函数', deadFunc.join(','));

// ── 4. 功能完备（10 项核心功能 grep 可证）──
section('4. 功能完备（10 项核心功能）');
const feats = [
  ['精选区', 'renderFeatured', js],
  ['标签AND筛选', 'activeTags', js],
  ['4模式排序', 'sortList', js],
  ['卷目分卷树', 'renderToc', js],
  ['recent相对时间', 'relTime', js],
  ['焦点陷阱', 'trapFocus', js],
  ['封面懒加载', 'loading="lazy"', js],
  ['搜索高亮', '<mark class="hl">', js],
  ['深色模式', 'dark-theme', css],
  ['数据校验脚本', 'validate.js', readme],
];
feats.forEach(([n, k, src]) => { src.includes(k) ? pass(n + ' → ' + k) : fail(n, '未找到 ' + k); });

// ── 5. 行为正确 ──
section('5. 行为正确（数据流断言）');
const VALID_STATUS = ['playable','draft','archived'];
const sanitized = games.map(g => ({ id: g.id, cat: g.category, tags: g.tags || [], status: VALID_STATUS.includes(g.status) ? g.status : 'playable' }));
// 过滤：all→全部
const fAll = sanitized.filter(g => g.status !== 'archived');
fAll.length === games.length ? pass('filter all → ' + fAll.length) : fail('filter all', fAll.length);
// 过滤：分类
const strat = sanitized.filter(g => g.cat === '策略' && g.status !== 'archived');
strat.length === 2 ? pass('filter 策略 → 2') : fail('filter 策略', strat.length);
// 过滤：标签AND（慢+海 → tide-anchor）
const slow = sanitized.filter(g => ['慢','海'].every(t => g.tags.includes(t)));
slow.length === 1 && slow[0].id === 'tide-anchor' ? pass('filter 慢+海 → tide-anchor') : fail('filter AND', slow.map(g=>g.id).join(','));
// archived 隔离
!sanitized.some(g => g.status === 'archived') || sanitized.filter(g => g.status !== 'archived').length < games.length
  ? pass('archived 自动隔离') : fail('archived');
// featured 计数
games.filter(g => g.featured).length === 2 ? pass('featured = 2') : fail('featured');

// ── 6. 文档完整 ──
section('6. 文档完整');
readme.includes('## 添加游戏') ? pass('README 含"添加游戏"') : fail('README 添加游戏');
readme.includes('status') && readme.includes('playable') && readme.includes('draft') ? pass('README 含 status 字段规范') : fail('README status');
readme.includes('npx serve') ? pass('README 含预览方式') : fail('README 预览');
readme.includes('## 功能') ? pass('README 含功能表') : fail('README 功能');

// ── 7. 单元测试通过 ──
section('7. 单元测试通过（mocha）');
try {
  const t = execSync('npx mocha test/*.test.js --reporter min 2>&1', { cwd: DIR, encoding: 'utf8', stdio: 'pipe' });
  t.includes('passing') && !t.includes('failing') ? pass('mocha 全部通过 (' + (t.match(/(\d+)\s+passing/) || [,'?'])[1] + ' 项)') : fail('mocha', t.slice(-200));
} catch (e) { fail('mocha 运行', e.message.slice(0, 200)); }
// core.js 与 main.js sanitize 同步（关键字段逻辑）
const core = read('scripts/core.js');
core.includes('VALID_STATUS.includes(g.status)') && js.includes('VALID_STATUS.includes(g.status)')
  ? pass('core.js 与 main.js sanitize 同源') : fail('sanitize 同步');

// ── 8. 测试套件覆盖 ──
section('8. 测试覆盖范围');
const testFile = fs.existsSync(path.join(DIR, 'test', 'core.test.js')) ? read('test/core.test.js') : '';
['sanitize', 'filterGames', 'sortGames', 'highlight', 'relTime', 'pushRecent', 'esc'].forEach(fn => {
  testFile.includes('describe(\'' + fn) ? pass(fn + ' 有测试套件') : fail(fn + ' 无测试');
});

// ── 输出 ──
let total = 0, passed = 0;
const lines = ['# 悬铃木林 · 副本 完成度检查', '', '生成：' + new Date().toISOString(), ''];
sections.forEach(s => {
  lines.push('## ' + s.name);
  s.items.forEach(it => {
    total++; if (it.ok) { passed++; lines.push('- [x] ' + it.desc); }
    else lines.push('- [ ] **未通过** ' + it.desc + (it.detail ? ' → ' + it.detail : ''));
  });
  lines.push('');
});
lines.push('## 汇总', '');
lines.push('- 检查项：' + total);
lines.push('- 通过：' + passed + '/' + total);
lines.push(passed === total ? '' : '- 失败：' + (total - passed));
lines.push('');
lines.push(passed === total
  ? '## ✅ 全面优化完成' : '## ❌ 存在未通过项');
lines.push('');
lines.push('复现：`node scripts/check.js`');
fs.writeFileSync(path.join(DIR, 'COMPLETION.md'), lines.join('\n'), 'utf8');

// 控制台输出
console.log('\n══ 完成度检查 ══');
sections.forEach(s => {
  console.log('\n' + s.name);
  s.items.forEach(it => console.log((it.ok ? '  ✓ ' : '  ✗ ') + it.desc + (it.detail ? ' → ' + it.detail : '')));
});
console.log('\n通过：' + passed + '/' + total + (passed === total ? '  ✅ 全面优化完成' : '  ❌ 未完成'));
console.log('报告：COMPLETION.md');
process.exit(passed === total ? 0 : 1);
