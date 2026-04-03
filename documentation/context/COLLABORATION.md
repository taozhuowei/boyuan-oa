# AI 协作规范 — Claude × Kimi

> **阅读对象**：参与本项目的所有 AI（Claude、Kimi Code 或其他）。  
> 每次新会话开始前，先读本文件 → 再读 `CONTEXT.md` → 再读 `tech/TODO.md`。

---

## 1. 角色分工

### Claude（架构师 + 项目经理）

**负责：**
- 阅读文档、扫描代码，理解当前状态和下一步目标
- 做架构决策：API 契约、数据结构、组件边界、跨页面复用方案
- 拆解任务，为 Kimi 撰写精准的**任务简报（Brief）**
- 审查 Kimi 的输出：类型检查、截图验收、设计规范符合度
- 发现问题后给 Kimi 写**修正指令**，直到通过
- 提交代码（git commit）
- 更新 `CONTEXT.md`、`TODO.md` 进度

**不负责：**
- 直接写大段页面/组件代码（委托 Kimi）
- 写重复性样板代码

---

### Kimi（实现工程师）

**负责：**
- 严格按照 Brief 写代码，不擅自扩展或简化需求
- 遵循现有代码风格（参见第 4 节规范）
- 完整输出指定文件内容并写入磁盘
- 遇到 Brief 描述不清时，先按最合理理解实现，在输出末尾注明假设

**不负责：**
- 做架构决策
- 选技术方案
- 修改 Brief 之外的文件（除非 Brief 明确说可以）

---

## 2. 标准工作流

```
Claude 读文档/代码
    ↓
Claude 输出 Brief（见第 3 节格式）
    ↓
Kimi 读 Brief + 指定参考文件 → 写代码
    ↓
Claude 审查：vue-tsc 类型检查 + 截图验收
    ↓
通过 → Claude commit      失败 → Claude 写修正 Brief → Kimi 修改
```

---

## 3. Brief 格式（Claude → Kimi）

Claude 每次给 Kimi 的任务简报必须包含以下结构：

```markdown
## 任务：[任务名称]

### 目标
[1-3句话说明要实现什么，为什么]

### 必读参考文件
- `路径/文件.vue` — [读哪个部分，理解什么]
- `路径/文件.ts`  — [读哪个部分]

### 具体要求
1. [精确的实现要求，含文件路径、函数名、数据结构]
2. ...

### 禁止事项
- [明确不能做的事]

### 验收标准
- [ ] [可以客观判断的通过条件]
```

---

## 4. 代码规范速查（Kimi 必须遵守）

### 前端

| 项目 | 规范 |
|---|---|
| 框架 | uni-app Vue 3 `<script setup lang="ts">` |
| 页面包裹 | 必须用 `<AppShell title="页面名">` |
| 图标 | 只用 `@ant-design/icons-vue` Outlined 系列，`markRaw()` 包裹，`/* #ifdef H5 */` 内 import |
| 颜色 | 只用 CSS 变量（`var(--primary)` 等），禁止硬编码颜色 |
| 滚动 | 页面容器 `height:100%; overflow-y:auto`，shell-main 不滚动 |
| 工具栏 | 操作按钮永远在内容上方的 `.toolbar` 中，不在内容下方 |
| AntD 组件 | 通过 `useComponent()` 解构，`<component :is="Button">` 调用 |
| 条件编译 | 图标 const 只写 `/* #ifdef H5 */` 块，不写 `/* #ifndef H5 */` 对应 null 块（vue-tsc 会误判重复声明） |
| 样式 | scoped SCSS，用设计 token 变量，参考 `.kimi-redesign.md` 中的通用样式模板 |

### 设计 Token 速查

```
--primary: #003466       --on-primary: #ffffff
--secondary: #115cb9     --surface: #f9f9fe
--surface-lowest: #fff   --surface-low: #f3f3f9
--surface-high: #e8e8ed  --on-surface: #1a1c20
--on-surface-variant: #424750  --outline: #737781
--error: #ba1a1a         --success: #2e7d32  --warning: #ed6c02
--radius-sm:8px  --radius-md:12px  --radius-lg:16px
--shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)
```

### AppShell 导入

```ts
import AppShell from '../../layouts/AppShell.vue'
```

---

## 5. 验收流程（Claude 执行）

```bash
# 1. 类型检查
node_modules/.bin/vue-tsc --noEmit --skipLibCheck

# 2. 启动 dev server（如未运行）
node_modules/.bin/uni   # 运行在 http://localhost:4173

# 3. 截图验收
node scripts/screenshot_pages.cjs
# 查看 /tmp/oa_*.png
```

截图验收标准：
- TopBar + LeftNav 完整显示
- 无渐变大色块
- 工具栏在内容上方
- 页面不整体滚动（content-card 内部滚动）
- 数据正确渲染（mock 数据可见）

---

## 6. 当前阶段与待办

> 详细任务列表见 `tech/TODO.md`

| 阶段 | 状态 | 说明 |
|---|---|---|
| Phase 0 工程基础 | ⏳ 待开始 | 补全 DB schema 30张表，backend 真实启动 |
| Phase 1 前端Shell | ✅ 完成 | 7个页面 UI 重构完成（2026-04-03） |
| Phase 2 身份认证 | ⏳ 待开始 | 真实登录接口，JWT，员工/角色管理接入 |

**下一个 Brief 应该是**：Phase 0 — 补全 `app/backend/src/main/resources/db/schema.sql`

---

## 7. 常见错误与避坑

| 错误 | 原因 | 正确做法 |
|---|---|---|
| TS2451 重复声明 | `#ifdef` + `#ifndef` 各写一遍 const | 只写 H5 块，MP 端图标不存在就不渲染（有 `v-if` 保护） |
| 页面整体滚动 | shell-main 有 `overflow-y:auto` 或 padding | shell-main 用 `overflow:hidden; min-height:0`，padding 在页面容器自己声明 |
| 截图全是登录页 | `page.goto()` 触发整页刷新，清空 Pinia 状态 | 登录后用 `page.evaluate(() => uni.navigateTo(...))` |
| 组件不渲染 | AntD 图标未用 `markRaw()` | 所有图标 const 都要 `markRaw(IconComponent)` |
| 横向内容溢出不可滚 | flex 子项 `min-width` 默认为 `auto` | 需要横向滚动的容器加 `min-width: 0` |
