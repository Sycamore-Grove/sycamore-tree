# Sycamore Grove · 悬铃木林

以「典雅精致」为格调的网页游戏平台。林间疏影，叶落无声。

## 格调

- 暖灰底 + 纸张噪点 + 悬铃木叶徽记
- Playfair Display（西文衬线）+ Noto Serif SC（中文衬线）+ Inter（无衬线）
- 主色金棕 `#8a7245` · 辅色林绿 `#6b8a6e` · 暮色胶片质感的占位渐变
- 深色模式「月下卷」自动跟随系统，可手动切换并记忆

## 结构

```
Sycamore-Grove - 副本/
├── index.html          # 平台首页
├── styles/main.css     # 设计系统（含分类占位渐变变量）
├── scripts/
│   ├── main.js         # 数据驱动渲染 + 交互
│   └── validate.js     # 数据校验脚本（node 独立运行）
├── assets/
│   ├── favicon.svg     # 悬铃木叶徽记
│   ├── cover_everpeak.png
│   └── cover_overlogic.png
└── data/games.json     # 游戏数据源
```

## 功能

| 区 | 说明 |
|---|---|
| 林间（Hero） | 三层柔光晕染 + 序列入场动画 |
| 藏阁（Library） | 精选区「林中精选」+ 分类筛选 + 标签 AND 筛选 + 4 模式排序 + 结果计数 |
| 最近游玩 | 6 条上限，相对时间「方才/分前/时前/日前」，每 60s 自动刷新，可单条移除 |
| 卡片 | 按分类出占位渐变（策略=暖金、解谜=青绿、叙事=暮紫）+ 叶子水印；草稿显「墨稿中」徽章 |
| 弹窗 | 封面占位 + 标签行 + 翻章导航（‹ › + ←→键）+ 收藏 + 焦点陷阱 + Esc 关闭 |
| 内嵌播放器 | 全屏沉浸，重载/全屏/返回，加载态叶子旋转 |
| 深色模式 | 月下卷，进度条换金→月白渐变 |
| 可达性 | `/` 聚焦搜索 · Tab 焦点陷阱 · Esc 关闭 · 翻章键盘 · 回顶 |

## 数据字段

```json
{
  "id": "everpeak",          // 必填，唯一
  "title": "Everpeak",       // 必填
  "desc": "在永恒的山峦间…", // 简介
  "category": "策略",        // 必填，分类
  "tags": ["攀登", "回合"],  // 标签数组，用于 AND 筛选
  "cover": "assets/x.png",   // 封面路径，null 则出占位渐变
  "url": "../x/index.html",  // 游戏入口，空则按钮禁用
  "featured": true,          // 是否进精选区
  "status": "playable",      // playable / draft / archived
  "sort": 10                 // 默认排序键，越小越靠前
}
```

**status 语义**：
- `playable` — 可玩，必须有 `url`
- `draft` — 墨稿中，按钮禁用，显徽章
- `archived` — 归档，从列表自动隐藏

## 添加游戏

1. 编辑 `data/games.json`，按上述字段追加一条
2. 跑校验：`node scripts/validate.js`（检查 id 重复 / 必填 / status 合法 / url 与 status 一致）
3. 预览：`npx serve .`（fetch 需 HTTP）

## 本地预览

```bat
npx serve .
```

随后浏览器访问输出的本地地址。

## 设计原则

- **克制**：无霓虹、无抖动、无多余装饰；动效服务于内容
- **占位即设计**：无封面游戏出分类渐变 + 叶子水印，网格不显空
- **数据自洽**：sanitize 在运行时校验，validate.js 在编辑后自检
- **可达性**：键盘可达，焦点可见，深色对比达标

---

叶落无声，光影有序 · Sycamore Grove · MMXXVI
