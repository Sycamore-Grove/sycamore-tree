<div align="center">

<br/>

```
  ╭───────────────────────────────╮
  │   🍂  Sycamore Grove  🍂     │
  │       悬  铃  木  林          │
  ╰───────────────────────────────╯
```

**典雅精致的网页游戏平台**

*叶落无声，光影有序*

<br/>

[![HTML5](https://img.shields.io/badge/HTML5-pure-8a7245?style=flat-square&logo=html5&logoColor=white&labelColor=2a2520)](./index.html)
[![CSS3](https://img.shields.io/badge/CSS3-vanilla-6b8a6e?style=flat-square&logo=css3&logoColor=white&labelColor=2a2520)](./styles/main.css)
[![JavaScript](https://img.shields.io/badge/JS-ES2020-c5ad7d?style=flat-square&logo=javascript&logoColor=black&labelColor=2a2520)](./scripts/main.js)
[![Games](https://img.shields.io/badge/games-6-8a7245?style=flat-square&labelColor=2a2520)](./data/games.json)

</div>

---

## 一览

Sycamore Grove（悬铃木林）是一方以**典雅格调**为调性的静态网页游戏平台。无框架、无构建工具，纯 HTML + CSS + JS 驱动；以暖灰纸感、衬线排版、克制动效，为独立游戏提供一个安静而精致的陈列之所。

> 林间疏影，叶落无声。一方静谧的游戏之所。

---

## 设计系统

### 调色盘

| 角色 | 浅色 | 深色 | 用途 |
|------|------|------|------|
| 主色·金棕 | `#8a7245` | `#c5ad7d` | 强调、按钮、进度条 |
| 辅色·林绿 | `#6b8a6e` | `#8fa692` | 辅助渐变、hover 衬底 |
| 底色 | `#faf8f3` | `#0c0f12` | 页面底色 |
| 卡片底 | `#ffffff` | `#13171b` | 卡片背景 |
| 文字 | `#2a2520` | `#e6e1da` | 主文字 |

### 字体

| 场景 | 字体 |
|------|------|
| 西文标题 | Playfair Display（衬线·斜体） |
| 中文正文 | Noto Serif SC（衬线） |
| 界面元素 | Inter（无衬线） |
| 代码/数字 | ui-monospace |

### 分类占位渐变

游戏无封面时，按分类自动填充渐变背景，网格不显空。

| 分类 | 色调 |
|------|------|
| 策略 | 暖金褐 `#3a3528 → #5e5240` |
| 解谜 | 青绿 `#2d3a35 → #4a5e54` |
| 叙事 | 暮紫 `#3a2d3a → #5e4a5e` |

---

## 功能总览

```
Sycamore Grove
│
├─ 🌲 林间（Hero）
│   ├── 三层柔光晕染，drift 动画无限循环
│   └── 序列入场动画（fadeUp，0.1s 步长）
│
├─ 📚 藏阁（Library）
│   ├── 林中精选  ── featured 游戏大图展示
│   ├── 分类筛选  ── 按 category 单选
│   ├── 标签筛选  ── tags AND 多选
│   ├── 结果计数  ── 共 N 作
│   ├── 四种排序  ── 默认 / 近游 / 留印 / 题名
│   └── 卷目索引  ── 可折叠分卷目录
│
├─ 🕐 最近游玩
│   ├── 6 条上限，相对时间（方才 / 分前 / 时前 / 日前）
│   ├── 60s 自动刷新时间戳
│   └── 单条移除
│
├─ 🃏 游戏卡片
│   ├── 封面图 + 叶子水印占位渐变
│   ├── 搜索关键词高亮
│   ├── 「墨稿中」徽章（draft 状态）
│   └── 收藏标记 ♥
│
├─ 🪟 详情弹窗
│   ├── 封面 / 分类 / 标签 / 简介
│   ├── 翻章导航（‹ › + ← → 键盘）
│   ├── 收藏切换（♥ 动画）
│   ├── 焦点陷阱 + Esc 关闭
│   └── 「进入游戏」/ 「尚在林中」按钮
│
├─ 🎮 内嵌播放器
│   ├── 全屏沉浸，叶子旋转加载态
│   └── 重载 / 全屏 / 返回林间
│
└─ 🌙 深色模式「月下卷」
    ├── 跟随系统 prefers-color-scheme
    └── 手动切换并 localStorage 记忆
```

---

## 数据结构

游戏数据集中在 [`data/games.json`](./data/games.json)，每条记录结构如下：

```jsonc
{
  "id": "everpeak",           // 必填，全局唯一，用作存储键
  "title": "Everpeak",        // 必填，显示名称
  "desc": "在永恒的山峦间…",  // 简介，用于搜索与弹窗
  "category": "策略",         // 必填（策略 / 解谜 / 叙事）
  "tags": ["攀登", "回合"],  // 标签数组，支持 AND 多选筛选
  "cover": "assets/x.png",   // 封面路径；null 时输出占位渐变
  "url": "../Everpeak/index.html", // 游戏入口；空字符串则禁用
  "featured": true,           // true → 进入「林中精选」大图区
  "status": "playable",       // 见下表
  "sort": 10                  // 默认排序键，值越小越靠前
}
```

### `status` 语义

| 值 | 含义 | 按钮状态 | 列表可见 |
|----|------|----------|----------|
| `playable` | 可游玩，须有 `url` | **进入游戏** ✅ | ✅ |
| `draft` | 开发中，显「墨稿中」徽章 | 尚在林中（禁用） | ✅ |
| `archived` | 归档 | — | ❌ 自动隐藏 |

---

## 项目结构

```
sycamore-tree/
├── index.html              # 平台主页（单页）
├── styles/
│   └── main.css            # 设计系统（CSS 变量 + 全部组件）
├── scripts/
│   ├── main.js             # 数据驱动渲染 + 交互逻辑
│   ├── core.js             # 工具函数
│   ├── check.js            # 运行时检查
│   └── validate.js         # 数据校验（Node 独立运行）
├── assets/
│   ├── favicon.svg         # 悬铃木叶徽记
│   ├── cover_everpeak.png
│   └── cover_overlogic.png
└── data/
    └── games.json          # 游戏数据源（唯一数据入口）
```

---

## 添加游戏

```bash
# 1. 在 data/games.json 末尾追加新游戏对象

# 2. 校验（检查 id 重复 / 必填 / status / url 一致性）
node scripts/validate.js

# 3. 本地预览（fetch 需要 HTTP 环境）
npx serve .
```

> **注意**：必须在 HTTP 服务下运行，不支持直接双击 `index.html`。

---

## 可达性快捷键

| 按键 | 作用 |
|------|------|
| `/` | 聚焦搜索框 |
| `Esc` | 关闭弹窗 / 退出播放器 |
| `← →` | 弹窗中翻章（上一作 / 下一作） |
| `Tab / Shift+Tab` | 弹窗焦点陷阱循环 |

---

## 设计原则

| 原则 | 说明 |
|------|------|
| **克制** | 无霓虹、无抖动、无多余装饰；动效只服务于内容 |
| **占位即设计** | 无封面游戏输出分类渐变 + 叶子水印，网格永不显空 |
| **数据自洽** | `sanitize()` 运行时校验，`validate.js` 编辑后自检 |
| **可达性优先** | 键盘可达、焦点可见、深色对比达 WCAG AA |

---

<div align="center">

<br/>

*叶落无声，光影有序*

**Sycamore Grove · WJH**

</div>
