# AutoTest - 可视化浏览器自动化测试工具

面向 Web 应用的通用桌面端端到端（E2E）自动化测试工具。基于 Electron + Vue 3 构建，通过 Playwright 驱动 Chromium 浏览器，采用单窗口内嵌布局设计，无需 AI 依赖，适用于任何 Web 项目的自动化测试。

---

## 架构概览

AutoTest 采用单窗口内嵌式设计：

| 区域 | 技术栈 | 功能描述 |
|------|--------|----------|
| 左侧浏览区 | Electron WebContentsView | 内嵌的 Chromium 浏览器，实时展示操作过程 |
| 右侧控制台 | Vue 3 + Electron 渲染进程 | 用例树、步骤详情、操作控制、Console 日志 |

**通信机制**：
```
Playwright <--> Electron Main (BrowserView) <--> Vue UI (IPC)
```

---

## 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 20 | Playwright + Electron 运行时依赖 |
| Playwright | 随 npm install 安装 | Chromium 浏览器自动安装 |
| Electron | ^30 | 内嵌浏览器和桌面框架 |

---

## 快速开始

```bash
cd tools/autotest
npm install
npx playwright install chromium
npm run dev
```

启动后会打开单个窗口：左侧为浏览器区域，右侧为控制面板。

---

## 使用方式

1. **启动工具**：运行 `npm run tauri:dev`，双窗口自动并排显示
2. **加载配置**：点击控制面板上的「加载配置」按钮，选择目标项目的 `autotest.config.json` 文件
3. **选择模式**：
   - 「逐用例确认模式」（默认）：每执行完一个用例后暂停，等待人工确认
   - 「全量运行模式」：连续执行所有用例，不暂停
4. **开始运行**：点击「运行全部」，观察左侧浏览器自动执行
5. **人工确认**：逐用例模式下，每个用例执行完成后在右侧面板点击 **通过 / 失败 / 跳过**，可附加备注
6. **查看报告**：所有用例执行完成后，HTML 报告自动生成在 `reports/` 目录

---

## 两种执行模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| 逐用例确认模式 (case-confirm) | 自动执行单个用例的所有步骤，执行完毕后暂停等待人工 PASS/FAIL/SKIP 确认，确认后继续下一个用例 | 需要人工验证结果的复杂业务场景，默认模式 |
| 全量运行模式 (full-auto) | 连续执行所有用例不暂停，根据断言自动判定结果，生成报告后人工审阅 | 回归测试、冒烟测试、CI 集成 |

切换方式：在控制面板勾选「全量运行」开关，或通过快捷键 `Ctrl+M` 切换。

---

## 元素定位策略（无 AI）

AutoTest 采用 Playwright 内置的定位策略，按优先级排序：

| 优先级 | 策略 | 方法 | 说明 |
|--------|------|------|------|
| 1 | role | `getByRole()` | **首选**，基于 ARIA role 和可访问名称，语义化、稳定、符合无障碍标准 |
| 2 | label | `getByLabel()` | 通过关联的 label 文本定位表单元素 |
| 3 | text | `getByText()` | 通过可见文本内容定位 |
| 4 | placeholder | `getByPlaceholder()` | 通过 placeholder 属性定位输入框 |
| 5 | testid | `getByTestId()` | 通过 `data-testid` 属性定位，适合测试专用标记 |
| 6 | css | CSS 选择器 | 最后的备选方案，脆弱，尽量避免 |

**推荐原则**：优先使用 role 和 label，它们与 DOM 结构解耦，界面重构时更稳定。

---

## 接入新项目（通用）

任何 Web 项目均可按以下步骤接入 AutoTest：

### 1. 创建配置文件

在目标项目测试目录下创建 `test/autotest/autotest.config.json`：

```json
{
  "name": "My Project",
  "base_url": "http://localhost:3000",
  "cases_dir": "./cases",
  "concurrency": 1,
  "step_timeout": 30000,
  "screenshot_on_step": true
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| name | string | 是 | - | 项目名称，用于报告标题 |
| base_url | string | 是 | - | 被测应用的基础 URL |
| cases_dir | string | 是 | - | 用例文件存放目录（相对配置文件的目录） |
| concurrency | number | 否 | 1 | 并发执行数 |
| step_timeout | number | 否 | 30000 | 单步超时（毫秒） |
| screenshot_on_step | boolean | 否 | true | 每步是否自动截图 |

### 2. 创建用例目录结构

```
test/autotest/
├── autotest.config.json
├── cases/
│   ├── auth/
│   │   ├── index.ts
│   │   ├── tc_auth_01_login_success.ts
│   │   └── tc_auth_02_wrong_password.ts
│   └── dashboard/
│       ├── index.ts
│       └── tc_dash_01_view_stats.ts
└── reports/          # 报告自动生成
```

### 3. 启动 AutoTest 并加载配置

```bash
cd tools/autotest
npm run tauri:dev
```

在控制面板点击「加载配置」，选择项目的 `autotest.config.json` 即可。

---

## 编写测试用例

### 用例文件格式 (TestCase)

每个用例是一个导出 `TestCase` 对象的 TypeScript 文件：

```typescript
// test/autotest/cases/auth/tc_auth_01_login_success.ts
import type { TestCase } from '../../../../../tools/autotest/runner/types.js'

export default {
  id: 'TC-AUTH-01',
  title: '正确账号密码登录成功',
  module: '认证',
  priority: 'P0',
  tags: ['smoke', 'auth'],

  // 登录凭据
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },

  steps: [
    {
      id: 1,
      desc: '打开登录页',
      action: 'navigate',
      to: '/login',
    },
    {
      id: 2,
      desc: '输入用户名',
      action: 'fill',
      locator: { by: 'label', value: '用户名', exact: true },
      value: '{{credentials.username}}',
    },
    {
      id: 3,
      desc: '输入密码',
      action: 'fill',
      locator: { by: 'label', value: '密码', exact: true },
      value: '{{credentials.password}}',
    },
    {
      id: 4,
      desc: '点击登录按钮',
      action: 'click',
      locator: { by: 'role', role: 'button', name: '登录', exact: true },
    },
    {
      id: 5,
      desc: '验证跳转到工作台',
      action: 'assert',
      check: { type: 'url_contains', value: '/dashboard' },
    },
    {
      id: 6,
      desc: '验证页面显示欢迎信息',
      action: 'assert',
      check: { type: 'text_visible', value: '欢迎' },
    },
  ],

  expect: {
    result: 'pass',
    url: '/dashboard',
  },
} satisfies TestCase
```

**TestCase 字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 用例唯一标识（如 TC-AUTH-01） |
| title | string | 是 | 用例标题 |
| module | string | 是 | 所属模块 |
| priority | 'P0' \| 'P1' \| 'P2' | 是 | 优先级，P0 为最高 |
| tags | string[] | 否 | 标签数组，用于筛选 |
| credentials | object | 否 | 登录凭据，username 和 password |
| steps | TestStep[] | 是 | 测试步骤数组 |
| expect | object | 是 | 期望结果，包含 result 和 url |

---

### 操作类型（action）

| 操作 | 说明 | 必填字段 |
|------|------|----------|
| `navigate` | 跳转 URL（支持相对路径，基于 base_url） | `to: string` |
| `click` | 点击元素 | `locator: LocatorDef` |
| `fill` | 在输入框中填充文本 | `locator: LocatorDef`, `value: string` |
| `select` | 从下拉框选择选项 | `locator: LocatorDef`, `value: string` |
| `check` | 勾选复选框 | `locator: LocatorDef` |
| `uncheck` | 取消勾选复选框 | `locator: LocatorDef` |
| `wait` | 等待指定毫秒数 | `ms: number` |
| `wait_for` | 等待元素可见 | `locator: LocatorDef` |
| `assert` | 断言检查 | `check: AssertCheck` |
| `screenshot` | 截图并附加到报告 | `label?: string`（可选） |
| `api_call` | 发送 HTTP 请求（绕过 UI） | `method: string`, `endpoint: string`, `body?: object` |
| `parallel` | 并行执行多组步骤（并发测试） | `contexts: TestStep[][]` |
| `rapid` | 快速重复执行某步骤（压力测试） | `repeat: number`, `interval: number`, `step: TestStep` |

---

### 断言类型（assert type）

| 类型 | 验证内容 |
|------|----------|
| `url_contains` | 当前 URL 包含指定字符串 |
| `url_equals` | 当前 URL 完全匹配 |
| `text_visible` | 页面可见文本包含指定内容 |
| `text_absent` | 页面不包含指定文本 |
| `element_visible` | 指定定位器的元素可见 |
| `element_hidden` | 指定定位器的元素不可见 |
| `toast_contains` | 出现包含指定文本的 Toast 提示（5 秒等待） |
| `http_status` | 最近一次 API 响应状态码匹配 |
| `title_contains` | 页面标题包含指定字符串 |

---

### Locator 示例

```typescript
// 1. role - 最推荐，语义化
{ by: 'role', role: 'button', name: '提交', exact: true }
{ by: 'role', role: 'textbox', name: '邮箱' }
{ by: 'role', role: 'link', name: '忘记密码' }

// 2. label - 表单元素
{ by: 'label', value: '用户名', exact: true }
{ by: 'label', value: '搜索', exact: false }

// 3. text - 可见文本
{ by: 'text', value: '欢迎使用', exact: false }
{ by: 'text', value: '确认删除', exact: true }

// 4. placeholder - 占位符
{ by: 'placeholder', value: '请输入手机号' }

// 5. testid - 测试专用标识
{ by: 'testid', value: 'user-menu-trigger' }
{ by: 'testid', value: 'submit-btn' }

// 6. css - 最后的备选
{ by: 'css', value: '.header .nav-item:first-child' }
{ by: 'css', value: '[data-testid="modal"] button.primary' }
```

---

### 用例文件组织

**目录命名**：`cases/<module>/tc_<module>_<nn>_<description>.ts`

**示例**：
```
cases/
├── auth/
│   ├── index.ts                    # 导出本模块所有用例
│   ├── tc_auth_01_login_success.ts
│   ├── tc_auth_02_wrong_password.ts
│   └── tc_auth_03_logout.ts
├── dashboard/
│   ├── index.ts
│   ├── tc_dash_01_view_stats.ts
│   └── tc_dash_02_search_order.ts
└── order/
    ├── index.ts
    └── tc_order_01_create_order.ts
```

**模块索引文件** (`cases/<module>/index.ts`)：

```typescript
import tc01 from './tc_auth_01_login_success.js'
import tc02 from './tc_auth_02_wrong_password.js'
import tc03 from './tc_auth_03_logout.js'

export default [tc01, tc02, tc03]
```

---

### 覆盖范围要求

完整测试用例应覆盖以下场景：

| 类型 | 说明 | 示例 |
|------|------|------|
| 正向操作 | 标准业务流程，预期成功 | 正确登录、正常下单 |
| 异常操作 | 错误输入、边界条件 | 密码错误、必填项为空 |
| 并发操作 | 使用 `parallel` action | 多用户同时登录、并发下单 |
| 快速操作 | 使用 `rapid` action | 快速重复提交、按钮连点 |

---

## 测试报告

报告自动生成在配置文件中 `cases_dir` 同级目录的 `reports/` 文件夹下：

| 文件 | 说明 |
|------|------|
| `report_<timestamp>.html` | 交互式 HTML 报告，可在浏览器中查看 |
| `report_<timestamp>.json` | 机器可读 JSON 格式，供 CI 集成 |

**报告内容包括**：
- 测试环境信息（项目名、基础 URL、运行时间、总耗时）
- 汇总统计（总数、通过、失败、跳过）
- 用例详情表格（编号、标题、优先级、状态、步骤数、耗时）
- 每个步骤的执行状态、截图、错误信息、人工备注
- 可点击查看大图截图

---

## 键盘快捷键

| 按键 | 操作 |
|------|------|
| `空格` | 暂停 / 继续 |
| `F5` | 重启当前套件 |
| `F10` | 单步执行（逐步骤调试模式） |
| `Esc` | 停止运行 |
| `Ctrl+M` | 切换执行模式（逐用例确认 / 全量运行） |
| `Ctrl+R` | 导出报告 |

---

## 目录结构

```
tools/autotest/
├── electron/                  # Electron 主进程
│   ├── main.ts               # 主进程入口，窗口管理
│   ├── preload.ts            # 预加载脚本（IPC 安全桥接）
│   └── browser-view.ts       # BrowserView 管理器
├── src/                       # Vue 3 前端（控制面板 UI）
│   ├── components/
│   │   ├── CaseTree.vue      # 用例树形列表
│   │   ├── StepList.vue      # 步骤详情列表
│   │   ├── ControlBar.vue    # 控制按钮栏
│   │   ├── ConfirmBar.vue    # 人工确认按钮
│   │   ├── ConsolePanel.vue  # 浏览器 Console 面板
│   │   └── ConsoleLog.vue    # 系统日志面板
│   ├── stores/
│   │   ├── runner.ts       # Pinia：运行状态管理
│   │   └── results.ts      # Pinia：用例结果管理
│   ├── App.vue               # 主布局
│   ├── main.ts               # Vue 入口
│   └── style.css             # 全局样式
├── runner/                    # Node.js Playwright 引擎
│   ├── index.ts              # 运行器入口
│   ├── engine.ts             # 核心：用例加载、步骤执行
│   ├── locator.ts            # 元素定位策略实现
│   ├── ipc.ts                # IPC 通信桥接
│   ├── reporter.ts           # HTML/JSON 报告生成
│   └── types.ts              # TypeScript 类型定义
├── package.json             # Node.js 依赖配置
├── tsconfig.json            # TypeScript 配置
├── vite.config.ts           # Vite 构建配置
└── README.md                # 本文档
```
