/* 悬铃木林 · 单元测试套件
 * 用法: npx mocha test/*.test.js 或 npm test
 */
const assert = require('assert');
const { sanitize, filterGames, sortGames, highlight, esc, relTime, pushRecent, VALID_STATUS, RECENT_MAX } = require('../scripts/core.js');

const SAMPLE = [
  { id: 'a', title: '阿尔法', desc: '攀登', category: '策略', tags: ['山','攀登'], cover: 'a.png', url: 'a.html', featured: true, status: 'playable', sort: 10 },
  { id: 'b', title: 'Beta', desc: '逻辑', category: '解谜', tags: ['逻辑','几何'], cover: 'b.png', url: 'b.html', featured: true, status: 'playable', sort: 20 },
  { id: 'c', title: '潮锚', desc: '海', category: '策略', tags: ['海','慢'], cover: null, url: '', featured: false, status: 'draft', sort: 30 },
  { id: 'd', title: '蛾灯', desc: '夜路径', category: '解谜', tags: ['夜','慢'], cover: null, url: '', featured: false, status: 'draft', sort: 40 },
  { id: 'e', title: '狐', desc: '记忆', category: '叙事', tags: ['狐','慢'], cover: null, url: '', featured: false, status: 'draft', sort: 50 },
  { id: 'x', title: '归档', desc: '旧', category: '叙事', tags: ['旧'], status: 'archived', sort: 5 }
];

describe('sanitize()', () => {
  it('按 sort 升序', () => {
    const r = sanitize(SAMPLE);
    assert.strictEqual(r[0].id, 'x');
    assert.strictEqual(r[1].id, 'a');
  });
  it('archived 不被 sanitize 移除（由 filter 负责）', () => {
    const r = sanitize(SAMPLE);
    assert.strictEqual(r.length, 6);
  });
  it('去重 id', () => {
    const dup = [...SAMPLE, { id: 'a', title: 'dup', category: 'X' }];
    assert.strictEqual(sanitize(dup).length, 6);
  });
  it('缺字段补默认', () => {
    const r = sanitize([{ id: 'y' }]);
    assert.strictEqual(r[0].title, 'y');
    assert.strictEqual(r[0].category, '未分类');
    assert.deepStrictEqual(r[0].tags, []);
    assert.strictEqual(r[0].status, 'playable');
    assert.strictEqual(r[0].sort, 999);
  });
  it('非法 status 回退为 playable', () => {
    const r = sanitize([{ id: 'z', title: 'z', category: 'X', status: 'bogus' }]);
    assert.strictEqual(r[0].status, 'playable');
  });
  it('tags 非数组时归一为空数组', () => {
    const r = sanitize([{ id: 'w', title: 'w', category: 'X', tags: 'notarray' }]);
    assert.deepStrictEqual(r[0].tags, []);
  });
});

describe('filterGames()', () => {
  const g = sanitize(SAMPLE);
  it('all → 排除 archived', () => {
    assert.strictEqual(filterGames(g, 'all', new Set(), '').length, 5);
  });
  it('分类 策略 → 2', () => {
    assert.strictEqual(filterGames(g, '策略', new Set(), '').length, 2);
  });
  it('标签 AND: 慢 → 3', () => {
    assert.strictEqual(filterGames(g, 'all', new Set(['慢']), '').length, 3);
  });
  it('标签 AND: 慢+海 → 1 (潮锚)', () => {
    const f = filterGames(g, 'all', new Set(['慢','海']), '');
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].id, 'c');
  });
  it('搜索: 狐 → 1', () => {
    const f = filterGames(g, 'all', new Set(), '狐');
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].id, 'e');
  });
  it('搜索: 无匹配 → 0', () => {
    assert.strictEqual(filterGames(g, 'all', new Set(), 'zzz').length, 0);
  });
  it('分类+标签组合: 策略+慢 → 1', () => {
    assert.strictEqual(filterGames(g, '策略', new Set(['慢']), '').length, 1);
  });
});

describe('sortGames()', () => {
  const g = sanitize(SAMPLE).filter(x => x.status !== 'archived');
  it('default → sort 升序', () => {
    const r = sortGames(g, 'default');
    assert.strictEqual(r[0].id, 'a');
    assert.strictEqual(r[r.length-1].id, 'e');
  });
  it('recent → 按近期游玩顺序', () => {
    const r = sortGames(g, 'recent', ['e','a']);
    assert.strictEqual(r[0].id, 'e');
    assert.strictEqual(r[1].id, 'a');
  });
  it('fav → 留印在前', () => {
    const fav = new Set(['d']);
    const r = sortGames(g, 'fav', [], fav);
    assert.strictEqual(r[0].id, 'd');
  });
  it('title → localeCompare 中文', () => {
    const r = sortGames(g, 'title');
    assert.ok(r.some(x => x.id === 'a'));
  });
});

describe('highlight()', () => {
  it('匹配词加 <mark>', () => {
    const h = highlight('九尾之狐', '狐');
    assert.ok(h.includes('<mark class="hl">狐</mark>'));
  });
  it('无查询时原样转义', () => {
    assert.strictEqual(highlight('九尾', ''), '九尾');
  });
  it('无匹配时返回原文', () => {
    assert.strictEqual(highlight('九尾', 'zzz'), '九尾');
  });
  it('HTML 转义注入词不执行', () => {
    const h = highlight('正常<script>', '正常');
    assert.ok(!h.includes('<script>'));
    assert.ok(h.includes('&lt;script&gt;'));
  });
});

describe('relTime()', () => {
  const now = 1000000000000;
  it('< 1 分 → 方才', () => { assert.strictEqual(relTime(now - 30000, now), '方才'); });
  it('< 1 时 → N 分前', () => { assert.strictEqual(relTime(now - 120000, now), '2 分前'); });
  it('< 1 日 → N 时前', () => { assert.strictEqual(relTime(now - 7200000, now), '2 时前'); });
  it('≥ 1 日 → N 日前', () => { assert.strictEqual(relTime(now - 86400000 * 3, now), '3 日前'); });
});

describe('pushRecent()', () => {
  it('置顶新项', () => {
    const r = pushRecent([{id:'a',ts:1}], 'b', 2);
    assert.strictEqual(r[0].id, 'b');
  });
  it('去重已有项', () => {
    const r = pushRecent([{id:'a',ts:1},{id:'b',ts:2}], 'a', 3);
    assert.strictEqual(r.length, 2);
    assert.strictEqual(r[0].id, 'a');
  });
  it('限长 RECENT_MAX', () => {
    let r = [];
    for (let i = 0; i < 10; i++) r = pushRecent(r, 'g'+i, i);
    assert.strictEqual(r.length, RECENT_MAX);
  });
});

describe('esc()', () => {
  it('转义特殊字符', () => {
    assert.strictEqual(esc('<a>"b"&\'c'), '&lt;a&gt;&quot;b&quot;&amp;&#39;c');
  });
  it('null/undefined 安全', () => {
    assert.strictEqual(esc(null), '');
    assert.strictEqual(esc(undefined), '');
  });
});
