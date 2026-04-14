# AutoTest 工具重构 Brief

> 本文档是指派给 Kimi 执行的重构任务说明。严格按本文档实现，不允许随意发挥。

## 工作目录

`/home/tzw/projects/boyuan-oa/tools/autotest`

## 技术栈（保持）

- Electron 30 + Vue 3 + Pinia + Vite
- Playwright 通过 CDP 连接 Electron 内嵌 WebContentsView
- 运行时：tsx 加载 .ts

## 新界面结构（三栏 + 顶栏）

```
┌─────────────────────────────────────────────────────────────────────┐
│ TopBar  AutoTest · [state-pill] · [config path] · [mode-switch]     │  高度 40px
├───────────┬──────────────────────────────────────┬──────────────────┤
│           │  URL 工具栏  ← → ↻  [URL]            │                  │
│  目录树   │  高度 40px                            │   用例列表       │
│           ├──────────────────────────────────────┤                  │
│  左栏     │                                      │   右栏           │
│  260px    │   浏览器视图 (WebContentsView)        │   320px          │
│           │   高度 ~60%                          │                  │
│  文件夹   │                                      │   用例卡片       │
│  目录结构 │                                      │   状态边框色     │
│           ├──────────────────────────────────────┤                  │
│           │   Chromium DevTools                  │                  │
│           │   高度 ~40%（可拖拽调整）             │                  │
│           │                                      │                  │
│           │                                      │                  │
│           │                                      │                  │
├───────────┤                                      ├──────────────────┤
│ [扫描用例]│                                      │ 操作区            │
│  底部按钮 │                                      │ 自动 / 单步 / 通过 / 失败 │
└───────────┴──────────────────────────────────────┴──────────────────┘
```

## 设计语言

### 色彩（暗色工业/操作台风格，非 AI-slop 紫）

使用 CSS 变量：
```css
:root {
  --bg-0: #0B0D10;       /* 深底 */
  --bg-1: #15181D;       /* 面板 */
  --bg-2: #1C2027;       /* 卡片 */
  --line: #242830;       /* 分隔线 */
  --text-1: #E6EAF0;     /* 主文本 */
  --text-2: #8A94A6;     /* 次文本 */
  --text-3: #596273;     /* 弱 */
  --brand: #5EB8FF;      /* 品牌电蓝 */
  --pass: #5CE68D;       /* 通过 */
  --fail: #FF5E62;       /* 失败 */
  --pending: #FFB547;    /* 待确认 */
  --running: #5EB8FF;    /* 执行中（带呼吸动画） */
}
```

### 字体

- 等宽：`'JetBrains Mono', 'SF Mono', Consolas, monospace`
- Sans：`'Inter' → 改为 'IBM Plex Sans', -apple-system, sans-serif`（避免 Inter AI slop）
- 全局字号 13px / 标题 15px / 数字 14px mono

### 动效

- 状态切换 150ms ease-out
- 用例选中边框 200ms
- running 卡片 pulse（1.2s 呼吸）

## 功能细节（严格按用户要求）

### 1. 左栏 —— 文件系统目录树

- 扫描 base url（OA 项目根目录，默认 `/home/tzw/projects/boyuan-oa/test/autotest`）
- 展示为可展开的目录树（点击目录行展开/折叠）
- 选中行高亮（单选）；支持勾选框（多选目录一次扫描）
- **底部固定按钮** `[扫描用例]`，点击后：
  - 递归读取选中目录下所有 `.ts` 文件
  - 对每个文件导入 `default` export
  - 如果 default 是 TestCase 或 TestCase[]，收集到用例列表
  - 扫描结果展示到右栏
- 目录树组件：naive-ui `NTree` 或自写递归组件都可。图标用 `@vicons/ionicons5`。

**新增 IPC**：
- `scan-dir(path)` → 返回 `{ name, path, type:'file'|'dir', children?: [] }`
- `scan-cases(dirPaths[])` → fork runner 的 `--scan-only` 扫用例，返回 `TestCase[]`

### 2. 中栏 —— 浏览器 + DevTools

**上半部分（~60%）**：原有 WebContentsView，加**URL 工具栏**：
- ◀ 后退、▶ 前进、↻ 刷新 图标按钮
- URL 输入框（可编辑 + 回车跳转）
- 新增 IPC：`browser-back`、`browser-forward`、`browser-reload`、`browser-navigate(url)`

**下半部分（~40%）**：Chromium DevTools
- 使用 `browserView.webContents.openDevTools({ mode: 'detach' })` 不行（detach 开新窗口）
- 改用：调用 `browserView.webContents.debugger.attach('1.3')` 配合自行实现嵌入式 DevTools 面板
- **简化方案**：用 `webContents.openDevTools({ mode: 'bottom' })` 让 DevTools 自然嵌入 BrowserView 底部（Electron 支持 `right|bottom|undocked|detach`）
- 完整 DevTools 功能直接由 Chromium 提供，包括 Device Mode（手机/平板尺寸切换）、Console、Network

**布局**：浏览器区和 DevTools 区之间有一个 **可拖拽分割条**（水平），拖动改变高度比例。

### 3. 右栏 —— 用例列表 + 操作区

**上部用例列表**（flex-1，可滚动）：
- 每条用例渲染为卡片（高度 ~64px）
- 卡片字段：
  - 顶行：TC-XXX-NN + priority tag（P0 红 / P1 橙 / P2 灰）
  - 中行：**标题**（粗体 14px）
  - 底行：**详情** 灰色 12px（可 truncate，悬停显示 tooltip 或点击展开）
- **状态边框**（2px solid）：
  - `pending`：var(--line) （灰）
  - `running`：var(--running)（蓝，pulse 动画）
  - `pass`：var(--pass)（绿）
  - `fail`：var(--fail)（红）
- 点击选中：背景微亮 + 强边框（3px）
- 选中卡片的详情展开显示多行完整文本

**下部操作区**（固定高度 ~140px，底部固定）：
- 第 1 行：模式 toggle `[ 全自动 | 单步 ]`
- 第 2 行：执行按钮 `[▶ 执行下一个]` + `[⏸ 暂停]` + `[■ 停止]`
- 第 3 行（仅暂停时可点）：人工判定 `[✔ 通过]` `[✘ 失败]` `[↷ 跳过]` + 备注输入框
- 全自动模式：每执行完一条自动进入下一条，**仍在每条结束后暂停等待人工判定**
- 单步模式：每一步（不只每条）结束后暂停

### 4. 失败报告（AI 友好格式）

报告结构（JSON，每个失败 case 一条）：

```json
{
  "report_version": "1.0",
  "generated_at": "2026-04-14T18:30:00+08:00",
  "project": "boyuan-oa",
  "base_url": "http://localhost:3000",
  "total": 196,
  "pass": 170,
  "fail": 20,
  "skip": 6,
  "failures": [
    {
      "case_id": "TC-AUTH-09",
      "title": "错误密码登录失败",
      "description": "角色：CEO。路径：登录页 → ...",
      "module": "auth",
      "priority": "P0",
      "roles": ["ceo"],
      "fail_step": {
        "step_id": 6,
        "desc": "应出现错误提示",
        "action": "assert",
        "check": { "type": "element_visible", "locator": { "by": "catch", "value": "login-form-error-alert" } }
      },
      "action_path": [
        { "step_id": 1, "desc": "打开登录页", "result": "pass" },
        { "step_id": 2, "desc": "输入工号", "result": "pass" },
        { "step_id": 3, "desc": "输入错误密码", "result": "pass" },
        { "step_id": 4, "desc": "点击登录", "result": "pass" },
        { "step_id": 5, "desc": "应停留在 /login", "result": "pass" },
        { "step_id": 6, "desc": "应出现错误提示", "result": "fail" }
      ],
      "error": {
        "message": "Timeout 30000ms exceeded waiting for locator [data-catch='login-form-error-alert'] to be visible",
        "stack": "...",
        "playwright_expected": "locator visible",
        "playwright_actual": "locator not found"
      },
      "locator_hint": {
        "by": "catch",
        "value": "login-form-error-alert",
        "fallback_selectors": [
          "[data-catch='login-form-error-alert']",
          ".ant-alert-error",
          "text=/密码|凭证/"
        ],
        "likely_source_file": "app/h5/pages/login.vue",
        "searched_text": "errorMsg"
      },
      "screenshot_base64": "data:image/png;base64,...",
      "url_at_failure": "http://localhost:3000/login",
      "browser_console_tail": [
        { "level": "error", "ts": "...", "message": "..." }
      ],
      "network_last_requests": [
        { "method": "POST", "url": "/api/auth/login", "status": 200, "duration_ms": 123 }
      ],
      "human_note": "观察到错误提示出现后 1 秒就消失了",
      "reproduction_hint": "建议：1) 确认 app/h5/pages/login.vue 中 a-alert 未被条件隐藏；2) 确认 data-catch 已在该元素上；3) 检查 toast 是否覆盖该 alert"
    }
  ]
}
```

**配套 HTML 报告**：基于 JSON 渲染为人读格式，含截图折叠、错误堆栈折叠、下载 JSON 按钮。

**AI 优化**：报告文件里同时写入 **markdown 快捷摘要**，每个失败一段，便于直接粘贴给 AI：

```markdown
### FAIL TC-AUTH-09 — 错误密码登录失败 [P0 · auth]
**Role**: ceo
**Description**: 角色：CEO。路径：...
**Failed step**: #6 "应出现错误提示"
**Error**: Timeout 30000ms waiting for [data-catch='login-form-error-alert']
**Likely source**: app/h5/pages/login.vue
**Fallback selectors**: .ant-alert-error | text=/密码|凭证/
**Action path**: 1✓ → 2✓ → 3✓ → 4✓ → 5✓ → 6✗
**Screenshot**: ./screenshots/TC-AUTH-09.png
```

### 5. 用例列表元数据（已完成）

196 条用例已在 `test/autotest/cases/<module>/index.ts` 补齐，每条有 `title`（简要）和 `description`（角色·路径·期望三段式）。重构后右栏卡片字段直接读这两个字段。

### 6. 严格合规

- 所有文件保持原有命名与目录结构，除非本文档指明
- 不得引入未列出的新依赖（除非特别必要且本文档批准）
- 颜色、字体、间距、布局比例严格按本文档
- 对任何不明确项，停下来询问，不要自行决定

## 任务拆分（按顺序实施）

### T1. 主进程改造
- `electron/main.ts`：新增 IPC `scan-dir`、`scan-cases`、`browser-back`、`browser-forward`、`browser-reload`、`browser-navigate`、`devtools-toggle`
- DevTools：在创建 `WebContentsView` 后调用 `webContents.openDevTools({ mode: 'bottom' })`
- 调整布局：浏览器区 y=40 到 y=60%，DevTools 自动占下方

### T2. preload 扩展
- `electron/preload.ts`：暴露上述 IPC 对应方法

### T3. UI 布局重构
- `src/App.vue`：三栏 + 顶栏新布局，使用 CSS Grid 或 flex
- 替换现有组件结构，不再使用 `ControlBar + CaseTree + StepList + ConsoleLog + ConfirmBar` 的老布局

### T4. 新组件
- `src/components/TopBar.vue`：顶栏（项目名、config、state pill、模式）
- `src/components/DirectoryTree.vue`：左栏目录树 + 底部扫描按钮
- `src/components/BrowserToolbar.vue`：URL 工具栏
- `src/components/CaseCard.vue`：单个用例卡片
- `src/components/CaseList.vue`：右栏用例列表
- `src/components/ActionPanel.vue`：右栏底部操作区

### T5. 样式
- `src/style.css`：全局 CSS 变量、字体、暗色主题
- 每个组件使用 scoped CSS + 变量引用

### T6. 失败报告生成
- `runner/reporter.ts`：改为输出上述 JSON + HTML + markdown 摘要三份
- 收集 browser console / network requests（通过 CDP）

### T7. 联调
- 启动 `npm run electron:dev`，在 WSLg 下打开窗口
- 加载 `test/autotest/autotest.config.json`
- 扫描 → 196 条用例出现在右栏
- 选中一条，模式切到单步，执行，观察浏览器同步操作、DevTools 可切换设备尺寸、操作区按钮正确驱动

## 交付要求

- 所有 TypeScript 类型检查通过（`vue-tsc --noEmit`）
- `npm run electron:dev` 可启动，窗口显示完整新布局
- 目录树扫描功能可用，196 条用例能正确加载显示
- 浏览器区 URL 工具栏、DevTools 正常工作
- 一条简单用例（TC-AUTH-01）能完整执行，在单步模式下正确暂停
- 失败报告按规定 JSON 格式输出到 `test/autotest/reports/report_<timestamp>.json`

## 禁令

- 禁止引入 React、Angular 等其他框架
- 禁止改变项目使用的 naive-ui → 继续用
- 禁止擅自修改 runner/engine.ts 的执行逻辑（除非本文档明确要求）
- 禁止删除任何现有测试用例
- 禁止将 data-catch 规范用于样式选择器
