# 悬铃木林 · 副本 完成度检查

生成：2026-06-23T13:40:03.619Z

## 1. 零语法错误
- [x] node --check scripts/main.js
- [x] node --check scripts/validate.js

## 2. 数据合法
- [x] validate.js 输出"数据合法"
- [x] 游戏数 ≥ 6（实际 6）
- [x] 每款含必填字段

## 3. 零死代码
- [x] JS 引用的 36 个 id 全在 HTML
- [x] CSS 大括号平衡 (277/277)
- [x] 13 个核心函数均有调用

## 4. 功能完备（10 项核心功能）
- [x] 精选区 → renderFeatured
- [x] 标签AND筛选 → activeTags
- [x] 4模式排序 → sortList
- [x] 卷目分卷树 → renderToc
- [x] recent相对时间 → relTime
- [x] 焦点陷阱 → trapFocus
- [x] 封面懒加载 → loading="lazy"
- [x] 搜索高亮 → <mark class="hl">
- [x] 深色模式 → dark-theme
- [x] 数据校验脚本 → validate.js

## 5. 行为正确（数据流断言）
- [x] filter all → 6
- [x] filter 策略 → 2
- [x] filter 慢+海 → tide-anchor
- [x] archived 自动隔离
- [x] featured = 2

## 6. 文档完整
- [x] README 含"添加游戏"
- [x] README 含 status 字段规范
- [x] README 含预览方式
- [x] README 含功能表

## 7. 单元测试通过（mocha）
- [x] mocha 全部通过 (30 项)
- [x] core.js 与 main.js sanitize 同源

## 8. 测试覆盖范围
- [x] sanitize 有测试套件
- [x] filterGames 有测试套件
- [x] sortGames 有测试套件
- [x] highlight 有测试套件
- [x] relTime 有测试套件
- [x] pushRecent 有测试套件
- [x] esc 有测试套件

## 汇总

- 检查项：36
- 通过：36/36


## ✅ 全面优化完成

复现：`node scripts/check.js`