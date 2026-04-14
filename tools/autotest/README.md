# AutoTest

面向通用 Web 项目的桌面端可视化自动测试工具。技术栈为 `Electron + Vue 3 + Playwright`，核心目标是把“项目选择、项目启动、浏览器预览、人工确认、失败报告”放进同一个工作台。

## 当前实现

AutoTest 采用三栏布局：

- 左栏：全盘目录树（过滤隐藏文件和系统目录），顶部提供搜索框、搜索按钮、确认选择按钮
- 中栏：真实 Chromium 预览区，顶部为浏览器工具栏，支持后退、前进、刷新、强制刷新、地址栏跳转、DevTools 开关
- 右栏：测试用例列表，当前用例自动滚动到中部；底部提供开始测试、停止、重置，以及“自动测试”配置

执行语义：

- 每条用例执行完成后都必须人工确认
- `自动测试 = 是`：确认当前用例后自动进入下一条
- `自动测试 = 否`：确认当前用例后，需要手动点击“继续测试”
- 失败用例会采集截图、当前 URL、页面标题、定位器、控制台尾部、网络请求尾部和人工备注

报告输出：

- `JSON`：AI 友好结构化报告
- `HTML`：人读版报告
- `Markdown`：可直接粘贴给 AI 的摘要

## 启动

```bash
cd tools/autotest
npm install
npx playwright install chromium
npm run electron:dev
```

构建：

```bash
cd tools/autotest
npm run build
npx vite build --mode electron
```

## 使用流程

1. 启动 AutoTest。
2. 在左栏目录树中定位目标项目目录。
3. 如目录层级较深，可先用搜索框按文件名或目录名搜索。
4. 选中项目目录后点击“确认选择”。
5. 工具会递归查找 `autotest.config.json`，读取配置，扫描用例，并按配置自动启动项目。
6. 中栏浏览器自动加载预览地址，右栏显示用例列表。
7. 点击“开始测试”开始执行；每条用例结束后在当前卡片上点“通过 / 不通过”。
8. 测试结束后，报告输出到配置中的 `report.output_dir`。

## 配置协议

配置文件名默认是 `autotest.config.json`。建议放在：

- `<project>/autotest.config.json`
- `<project>/test/autotest/autotest.config.json`
- `<project>/tests/autotest/autotest.config.json`

推荐结构：

```json
{
  "schema_version": "2.0",
  "name": "my-web-project",
  "project_root": "../..",
  "preview": {
    "base_url": "http://127.0.0.1:3000",
    "entry_url": "http://127.0.0.1:3000/login",
    "healthcheck_url": "http://127.0.0.1:3000/login"
  },
  "cases": {
    "root_dir": "./cases",
    "include": ["**/*.ts"],
    "exclude": ["**/_*.ts", "**/*.d.ts", "**/dist/**"]
  },
  "execution": {
    "concurrency": 1,
    "step_timeout": 30000,
    "screenshot_on_step": true,
    "auto_advance": true
  },
  "report": {
    "output_dir": "./reports",
    "formats": ["json", "html", "markdown"]
  },
  "launch": {
    "commands": [
      {
        "name": "frontend",
        "command": "pnpm dev",
        "cwd": ".",
        "ready": {
          "type": "http",
          "url": "http://127.0.0.1:3000",
          "timeout_ms": 120000,
          "interval_ms": 1000
        }
      }
    ]
  }
}
```

### 字段说明

| 字段 | 必填 | 说明 |
|---|---|---|
| `schema_version` | 否 | 配置协议版本，当前为 `2.0` |
| `name` | 是 | 项目名称 |
| `project_root` | 否 | 项目根目录，相对配置文件解析 |
| `preview.base_url` | 是 | 被测站点的基准地址，`navigate` 等相对路径基于它拼接 |
| `preview.entry_url` | 否 | 选中项目后浏览器默认打开的地址 |
| `preview.healthcheck_url` | 否 | 启动检测地址；`launch.commands` 的 http 就绪检测通常也指向这里 |
| `cases.root_dir` | 是 | 用例根目录 |
| `cases.include` | 否 | 用例文件 glob，社区通用风格 |
| `cases.exclude` | 否 | 排除 glob |
| `execution.concurrency` | 否 | 预留字段，当前实现固定顺序执行 |
| `execution.step_timeout` | 否 | 单步超时 |
| `execution.screenshot_on_step` | 否 | 每步后是否截图 |
| `execution.auto_advance` | 否 | 默认是否自动进入下一条 |
| `report.output_dir` | 否 | 报告输出目录 |
| `report.formats` | 否 | 输出格式，当前支持 `json/html/markdown` |
| `launch.commands` | 否 | 项目启动命令列表，按顺序执行 |
| `launch.commands[].name` | 是 | 进程名称，用于日志和生命周期管理 |
| `launch.commands[].command` | 是 | 启动命令 |
| `launch.commands[].cwd` | 否 | 命令工作目录，相对 `project_root` |
| `launch.commands[].ready` | 否 | 就绪检测，支持 `http` 和 `tcp` |
| `launch.commands[].ready.type` | 否 | `http` 或 `tcp` |
| `launch.commands[].ready.url` | 否 | `http` 检测地址 |
| `launch.commands[].ready.port` | 否 | `tcp` 检测端口 |
| `launch.commands[].ready.timeout_ms` | 否 | 最大等待时长 |
| `launch.commands[].ready.interval_ms` | 否 | 轮询间隔 |

## 兼容旧配置

旧格式仍兼容：

```json
{
  "name": "legacy-project",
  "base_url": "http://localhost:3000",
  "cases_dir": "./cases",
  "concurrency": 1,
  "step_timeout": 30000,
  "screenshot_on_step": true
}
```

运行时会自动映射到新协议：

- `base_url` → `preview.base_url`
- `cases_dir` → `cases.root_dir`
- `concurrency / step_timeout / screenshot_on_step` → `execution.*`

## 其他项目如何接入

最少需要做三件事：

1. 在项目内放置 `autotest.config.json`。
2. 在 `cases.root_dir` 下提供可被 AutoTest 导入的 TypeScript 用例文件。
3. 确保 `launch.commands` 能把项目启动起来，或者至少保证 `preview.base_url` 已经可访问。

推荐接入方式：

1. 明确项目根目录。
2. 明确前端预览地址和健康检查地址。
3. 明确测试用例目录，并用 `include / exclude` 控制扫描范围。
4. 如果是单服务项目，只配一个前端命令。
5. 如果是前后端联动项目，按顺序配置多个命令，并分别配置 `ready`。

## 用例格式

每个用例文件默认导出一个 `TestCase` 或 `TestCase[]`。如果 `cases.root_dir` 下存在根级 `index.ts`，工具优先导入这个聚合入口。

示例：

```ts
import type { TestCase } from '../../../../tools/autotest/runner/types.js'

export default {
  id: 'TC-AUTH-01',
  title: '正确账号密码登录成功',
  description: '角色：CEO。路径：登录页 → 输入账号密码 → 点击登录。期望：进入工作台。',
  module: 'auth',
  priority: 'P0',
  steps: [
    { id: 1, desc: '打开登录页', action: 'navigate', to: '/login' },
    {
      id: 2,
      desc: '点击登录按钮',
      action: 'click',
      locator: { by: 'role', role: 'button', name: '登录', exact: true }
    }
  ],
  expect: { result: 'pass' }
} satisfies TestCase
```

## 当前限制

- 目录树当前按 Unix 风格全盘扫描优化，Windows 驱动器枚举尚未单独适配
- `execution.concurrency` 目前保留但未启用，当前仍为串行执行
- 搜索为文件系统扫描，项目很多时首次搜索会比纯项目内搜索更慢
- 报告当前聚焦失败上下文，不会导出完整 HAR

## OA 示例

博渊 OA 的配置文件位于：

- [`test/autotest/autotest.config.json`](/home/tzw/projects/boyuan-oa/test/autotest/autotest.config.json)

这个配置展示了多进程启动的典型写法：

- `backend`：`yarn dev:backend`
- `frontend`：`yarn dev:h5`
- 用例目录：`test/autotest/cases`
- 报告目录：`test/autotest/reports`
