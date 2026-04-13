# AutoTest 开发文档

## 快速开始

```bash
# 安装依赖
cd tools/autotest
npm install

# 开发模式（启动 Electron + Vue）
npm run electron:dev

# 构建生产版本
npm run electron:build
```

## 架构说明

### 项目结构
```
tools/autotest/
├── electron/           # Electron 主进程
│   ├── main.ts         # 主进程入口
│   └── preload.ts      # 预加载脚本
├── src/                # Vue 3 前端
│   ├── components/     # UI 组件
│   ├── stores/         # Pinia 状态管理
│   └── App.vue         # 主应用
├── runner/             # Playwright 执行引擎
│   ├── engine.ts       # 核心执行逻辑
│   ├── index.ts        # Runner 入口
│   ├── ipc.ts          # IPC 通信
│   ├── locator.ts      # 元素定位
│   ├── reporter.ts     # 报告生成
│   └── types.ts        # 类型定义
└── test/autotest/      # 测试用例
    ├── cases/          # 用例目录
    └── autotest.config.json
```

### 核忄功能

1. **Electron + Vue 3 UI**
   - 左侧用例树列表
   - 右上步骤详情
   - 右下 Console 日志
   - 底部确认栏（逐步模式）

2. **Playwright 执行引擎**
   - 通过 CDP 连接 Electron BrowserView
   - 支持逐步确认/全量自动两种模式
   - 自动截图和断言检查

3. **IPC 通信**
   - `start-runner`: 启动测试
   - `stop-runner`: 停止测试
   - `send-control`: 发送控制消息
   - `open-file-dialog`: 打开文件选择
   - `save-report-dialog`: 保存报告

## 配置文件

```json
{
  "name": "boyuan-oa",
  "base_url": "http://localhost:3000",
  "cases_dir": "./cases",
  "concurrency": 1,
  "step_timeout": 30000,
  "screenshot_on_step": true
}
```

## 编写测试用例

```typescript
// cases/auth/tc_auth_01_login_success.ts
import type { TestCase } from '../../../../tools/autotest/runner/types.js'

export default {
  id: 'TC-AUTH-01',
  title: '正确账号密码登录成功',
  module: '认证',
  priority: 'P0',
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
  ],
  expect: {
    result: 'pass',
    url: '/dashboard',
  },
} satisfies TestCase
```

## 快捷键

| 按键 | 功能 |
|------|------|
| 空格 | 暂停/继续 |
| F5 | 重启测试 |
| F10 | 单步执行 |
| Esc | 停止测试 |
| Ctrl+M | 切换执行模式 |
| Ctrl+R | 导出报告 |

## 开发注意事项

1. **Electron + Playwright 联动**
   - Electron BrowserView 启用了 CDP 调试
   - Playwright 通过 `connectOverCDP()` 连接
   - 实现了真正的单窗口内嵌浏览器

2. **事件流**
   - Runner 进程 → Electron 主进程 → Vue UI
   - 使用 IPC 通信确保实时更新

3. **报告生成**
   - 支持 HTML 格式导出
   - 含有统计数据和详细用例结果
