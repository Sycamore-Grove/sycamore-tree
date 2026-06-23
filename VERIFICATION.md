# 悬铃木林 · 副本 验证报告

生成时间：2026-06-23T13:15:09.453Z
工具：Node v24.15.0

## 文件清单

| 文件 | 行数 | 字节 |
|---|---|---|
| index.html | 147 | 11984 |
| styles/main.css | 343 | 31147 |
| scripts/main.js | 466 | 22306 |
| scripts/validate.js | 72 | 2847 |
| data/games.json | 75 | 2165 |
| README.md | 87 | 3262 |
| **合计** | **1190** | **73711** |

## JS 语法校验

- `node --check scripts/main.js` → **通过**
- `node --check scripts/validate.js` → **通过**

## 数据校验（validate.js 运行输出）

```
══ 悬铃木林 · 数据校验 ══
共 6 条记录

── 统计 ──
  分类: 策略(2), 解谜(2), 叙事(2)
  标签: 17 个
  状态: playable=2 draft=4 archived=0
  精选: 2

── 结果 ──
  错误: 0 · 警告: 0
  ✓ 数据合法
```

## 数据字段完整性

| # | id | title | category | status | tags数 | featured | url |
|---|---|---|---|---|---|---|---|
| 1 | everpeak | Everpeak | 策略 | playable | 3 | 是 | ../Everpeak/index.html |
| 2 | overlogic | Overlogic | 解谜 | playable | 3 | 是 | ../Overlogic/index.html |
| 3 | tide-anchor | Tide Anchor | 策略 | draft | 3 | 否 | — |
| 4 | moth-lantern | Moth Lantern | 解谜 | draft | 3 | 否 | — |
| 5 | nine-tails | Nine Tails | 叙事 | draft | 3 | 否 | — |
| 6 | woodwork | Woodwork | 叙事 | draft | 3 | 否 | — |

## HTML 关键 id 存在性

- 检查 17 个关键 id，17 个存在于 index.html → **通过**

## CSS 关键样式存在性

- 检查 15 个关键样式，15 个存在于 main.css → **通过**

## JS 关键函数/逻辑存在性

- 检查 16 个关键函数，16 个存在于 main.js → **通过**

## 已修复 Bug 确认

- `/` 快捷键条件已修正 → **是**
- recent 旧数据迁移逻辑已加 → **是**

## CSS 大括号平衡

- 开括号 272 / 闭括号 272 → **平衡**

## 汇总

- 文件：6 个，共 1190 行
- 数据：6 款游戏（2 可玩 / 4 墨稿）
- HTML id：17/17
- CSS 样式：15/15
- JS 函数：16/16
- Bug 修复：2/2
- CSS 平衡：是

**全部校验通过，副本为可用状态。**