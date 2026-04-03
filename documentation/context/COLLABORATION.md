# AI 协作规范 — Claude × Kimi

> **阅读对象**：参与本项目的所有 AI（Claude、Kimi Code 或其他）。  
> 每次新会话开始前，先读本文件 → 再读 `CONTEXT.md` → 再读 `tech/TODO.md`。  
> **核心目标：最小化总 token 消耗**，方法是减少往返轮次，而不是减少单次输出量。

---

## 1. 角色分工

### Claude（规划 + 抽象 + 指挥 + 验收）

**负责：**
- 读文档/扫代码，理解当前状态，识别下一步
- 架构决策：API 契约、数据结构、组件边界、模式选择
- 将任务拆解为 Kimi 可直接执行的 Brief（见第 3 节）
- 验收 Kimi 的输出（类型检查结果判读、截图视觉判断）
- 连续失败 ≥ 2 次时直接介入修复，并更新避坑手册（第 7 节）
- 更新 `CONTEXT.md`、`TODO.md` 进度状态

**不负责（委托 Kimi）：**
- 写页面、组件、SQL、测试等具体代码
- 所有**明确且非平凡**的命令：多步 git 操作、需要参数拼接的命令、批量操作
- 运行类型检查、截图脚本等需要回传结果的命令
- 一切批量重复操作（多文件修改、格式化、数据填充等）

> **判断标准**：命令本身极其简单（单条、无歧义、2 秒内完成）时 Claude 直接执行；涉及多步、需要思考参数、或需要回传结果时交给 Kimi。

---

### Kimi（执行工程师）

**负责一切明确的、批量的、可验证的操作：**
- 按 Brief 编写完整代码并写入磁盘
- 执行所有终端命令：`git add`、`git commit`、`vue-tsc`、`node scripts/...` 等
- 运行验收脚本并将结果反馈给 Claude
- Brief 有歧义时，按最合理理解实现，在输出末尾注明假设，**不停下来反复确认**

**绝对不做：**
- 自己决定架构或技术方案
- 修改 Brief 范围之外的文件（除非 Brief 明确允许）
- 因为"不确定"而只输出部分代码

---

## 2. 标准工作流

```
Claude 读文档/代码 → 决策 → 输出 Brief
         ↓
Kimi 执行 Brief：写代码 + 运行命令 + 反馈结果
         ↓
Claude 判断验收结果
    通过 ──→ Claude 更新 TODO/CONTEXT，进入下一个 Brief
    失败 ──→ Claude 写精确修正 Brief → Kimi 修改（最多 2 轮）
              连续 2 次失败 → Claude 直接介入修复 → 更新第 7 节避坑
```

**原则：每个 Brief 对应一个可验收的最小工作单元，不堆砌多个无关任务。**

---

## 3. Brief 格式（Claude → Kimi）

每个 Brief 必须能让 Kimi 在不追问的情况下直接执行，结构如下：

````markdown
## 任务：[任务名]（Phase X — 模块名）

### 背景
[1-2 句话：为什么要做这个，它在整个开发链路中的位置]

### 必读参考文件（执行前必须先读）
- `路径/文件` — 重点看 [具体函数/章节/行号]，理解 [什么模式]

### 执行步骤（按顺序）
1. [精确描述：操作什么文件，写什么内容，调用什么函数，遵循什么格式]
2. 运行命令：`具体命令`，预期输出：`预期结果`
3. ...

### 禁止事项
- [具体的、容易犯的错误]

### 完成后执行
```bash
# 验收命令（Kimi 执行并将输出反馈给 Claude）
git add 具体文件
git commit -m "type: description\n\nCo-Authored-By: Kimi <noreply@moonshot.ai>"
```

### 验收标准（Kimi 自检）
- [ ] [可通过命令输出或肉眼判断的条件]
````

---

## 4. Claude 与 Kimi 的沟通原则

### 减少轮次的核心手段

1. **Brief 包含反例**：与其描述"应该怎么做"，还要加"不要这样做 + 原因"
2. **给出文件行号**：不说"参考登录页"，说"参考 `src/pages/login/index.vue` 第 15-36 行的 input 写法"
3. **明确边界文件**：列出"只能改这些文件：[list]"，防止 Kimi 改了不该改的
4. **命令即验收**：把验收命令写进 Brief，让 Kimi 自己运行并回传结果，Claude 只需判断输出

### 修正 Brief 原则

- 不重述问题，直接给出正确做法
- 指向具体行号或错误信息片段
- 如果是已知的坑（第 7 节），直接引用："见避坑手册 — TS2451 重复声明"

### Claude 直接介入的条件

同一问题 Kimi 连续修改 2 次仍未通过，Claude 直接修复代码，然后：
1. 将根因写入第 7 节避坑手册
2. 后续同类任务的 Brief 中引用该条目

---

## 5. 执行者判断规则

| 场景 | 执行者 | 原因 |
|---|---|---|
| 写 50 行以上代码 | Kimi | 大量输出 |
| git add + commit（多文件） | Kimi | 多步 + 需要斟酌 message |
| 单条 `git status` | Claude 直接 | 极其简单 |
| 运行 `vue-tsc` 并判断结果 | Kimi 运行，Claude 判断 | 命令简单但结果需要回传 |
| 修改 1-2 行 bug fix | Claude 直接 | 介入成本低于写 Brief |
| 重写整个文件 | Kimi | 大量输出 |
| 批量替换字符串 | Kimi | 重复操作 |
| 安装依赖 / 跑测试 | Kimi | 需要回传输出 |

**核心原则**：写 Brief 本身有成本。如果直接做比写 Brief 快，就直接做。

---

## 6. Kimi 执行的标准 git 提交

```bash
git add <明确列出的文件，不用 git add -A>
git commit -m "$(cat <<'EOF'
type: description

Co-Authored-By: Kimi <noreply@moonshot.ai>
EOF
)"
```

commit type 规范：`feat` 新功能 / `fix` Bug / `refactor` 重构 / `docs` 文档 / `chore` 工具依赖 / `cleanup` 清理死代码

---

## 7. 代码规范速查（Kimi 必须遵守）

### 前端

| 项目 | 规范 |
|---|---|
| 框架 | uni-app Vue 3 `<script setup lang="ts">` |
| 页面包裹 | 必须用 `<AppShell title="页面名">`，import 路径 `../../layouts/AppShell.vue` |
| 图标 | 只用 `@ant-design/icons-vue` Outlined 系列，`markRaw()` 包裹，`/* #ifdef H5 */` 内 import，**不写** `#ifndef H5` 对应 null 块 |
| 颜色 | 只用 CSS 变量（`var(--primary)` 等），禁止硬编码颜色值 |
| 滚动 | shell-main `overflow:hidden; min-height:0`；页面容器 `height:100%; overflow-y:auto; padding:24px; box-sizing:border-box` |
| 工具栏 | 操作按钮永远在 `.toolbar` 中（内容上方），禁止放在内容下方 |
| AntD 组件 | 通过 `useComponent()` 解构，`<component :is="Button" v-if="Button">` 调用 |
| 样式 | scoped SCSS，token 变量优先 |

### 设计 Token 速查

```
--primary:#003466  --secondary:#115cb9  --surface:#f9f9fe
--surface-lowest:#fff  --surface-low:#f3f3f9  --surface-high:#e8e8ed
--on-surface:#1a1c20  --on-surface-variant:#424750  --outline:#737781
--error:#ba1a1a  --success:#2e7d32  --warning:#ed6c02
--radius-sm:8px  --radius-md:12px  --radius-lg:16px
--shadow:0 1px 3px rgba(0,0,0,0.08),0 4px 12px rgba(0,0,0,0.05)
```

---

## 8. 验收流程

**由 Kimi 执行、将结果反馈给 Claude：**

```bash
# 前端类型检查（在 app/frontend 目录）
node_modules/.bin/vue-tsc --noEmit --skipLibCheck
# 期望：无任何输出（零错误）

# 启动 dev server（如未运行，后台启动）
node_modules/.bin/uni &
sleep 8

# 截图验收（登录账号 ceo.demo / 123456）
node scripts/screenshot_pages.cjs
# 截图保存在 /tmp/oa_*.png，反馈给 Claude 查看
```

**Claude 视觉验收标准：**
- TopBar（众维建筑 logo + 模块名 + 用户信息）完整显示
- LeftNav 可见，当前页高亮
- 无渐变大色块；工具栏在内容上方；页面不整体滚动
- mock 数据正常渲染（不是空白或报错）

---

## 9. 当前阶段与待办

> 详细任务列表见 `tech/TODO.md`

| 阶段 | 状态 | 说明 |
|---|---|---|
| Phase 1 前端 Shell | ✅ 完成 | 7个页面 UI 重构（2026-04-03） |
| Phase 0 工程基础 | ⏳ 待开始 | 补全 DB schema 30张表，backend 真实启动 |
| Phase 2 身份认证 | ⏳ 待开始 | 真实登录接口，JWT，员工/角色管理接入 |

**下一个 Brief**：Phase 0 — 补全 `app/backend/src/main/resources/db/schema.sql`（30张业务表 DDL）

---

## 10. 避坑手册（持续更新）

| # | 错误现象 | 根因 | 正确做法 |
|---|---|---|---|
| 1 | TS2451 重复声明 icon 变量 | `vue-tsc` 不处理 `#ifdef`，H5+MP 两块都可见 | 图标 const 只写 `#ifdef H5` 块，`v-if="iconXxx"` 保护渲染 |
| 2 | 页面整体滚动，无法固定视口 | `shell-main` 设了 `overflow-y:auto` 或 `padding` | `shell-main` 用 `overflow:hidden; min-height:0`，padding 在页面容器自己声明 |
| 3 | 截图全部跳回登录页 | `page.goto()` 整页刷新清空 Pinia 内存状态 | 登录后用 `page.evaluate(() => uni.navigateTo({url:'...'}))`，不触发刷新 |
| 4 | AntD 图标组件控制台警告/不渲染 | 未用 `markRaw()`，Vue 对 reactive icon 对象深度代理 | 所有图标 const：`const icon = markRaw(SomeOutlined)` |
| 5 | 横向内容溢出但无法滚动 | flex 子项 `min-width` 默认 `auto`，撑破容器 | 需要横向滚动的 flex 子项加 `min-width: 0` |
| 6 | uni-app `allMenus` 数组语法错误 | `vue-tsc` 将 `#ifdef`/`#ifndef` 两段拼接，末项缺逗号 | H5 最后一项和 MP 第一项之间必须有逗号 |
