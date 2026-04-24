# D-M01 认证模块 自动化走查报告

- 日期：2026-04-24
- 执行者：Claude (通过 agent-browser + 视觉识别)
- 方法：真实 Chrome + CDP 驱动，每个关键状态截图 + 图像阅读
- 总场景数：8（登录 / 忘记密码 / 修改密码 / 登录失败+captcha / 退出登录 / 侧边栏聚类 / 侧边栏折叠 / DevToolbar 一键填入）

## 汇总

**发现 8 个问题，修复 6 个，撤销 2 个（非 bug）**

- Issue #1（中）: DevToolbar 一键填入按钮抢焦点导致填入目标丢失 — **修复**
- Issue #2（低）: `/dev/reset` 未清 `system_config.company_name` — **修复**
- Issue #3（中）: DevToolbar 面板过高，viewport 小时底部被截 — **修复**
- Issue #4（-）: CEO "初始密码警告" 实际是种子默认表现 — **撤销**
- Issue #5（低）: Logo "E2E 测试企业 2OA工作台" 字符粘连 — **修复**
- Issue #6（低）: 侧边栏组标题在深蓝底上对比度低 — **修复**
- Issue #7（高）: 侧边栏折叠态组标题仍显示 — **修复**
- Issue #8（-）: "重复 toast" 实际是 AntD 全局悬浮 — **撤销**

## 详细发现与修复

### Issue #1 — DevToolbar 一键填入按钮抢焦点（已修复）

**现象**：在忘记密码页点击邮箱输入框聚焦后，点 DevToolbar 里的 "CEO" 邮箱按钮，`document.activeElement` 变成了按钮本身，`fillAccountEmail` 的分支未命中目标输入框，导致仅把邮箱填进 DevToolbar 自己的 codeEmail 输入框，原输入框没填。

**截图**：`screenshots/04-one-click-fill-ceo.png`（修复前）→ `screenshots/05-one-click-fill-after-fix.png`（修复后）

**修复**：`@mousedown="rememberFocusThenPrevent"` 在按钮 mousedown 时 `preventDefault()` 阻止按钮抢焦点，并提前缓存 `document.activeElement`；`click` 处理从缓存里取 target 填入。

**验证**：修复后点 CEO 按钮 → 邮箱正确进入忘记密码页的邮箱输入框。

### Issue #2 — `/dev/reset` 未清 system_config（已修复）

**现象**：初次进入登录页看到企业名"E2E 测试企业 2"（上次 CEO 恢复码测试向导写入），`/dev/reset` 后仍存在。

**截图**：`screenshots/01-login-initial.png`

**修复**：`DevController#resetForE2E` 末尾追加 `DELETE FROM system_config WHERE config_key = 'company_name'`；/setup/status 会回退到 null，前端显示默认"博渊"。

**验证**：修复后 /api/setup/status 返回 `companyName: null`，登录页显示"博渊"。

### Issue #3 — DevToolbar 面板过高（已修复）

**现象**：DevToolbar 展开时面板从顶部延伸到底部超出 viewport，小窗口下顶部"开发工具"标题 + 系统设置按钮被截。

**截图**：`screenshots/03-devtoolbar-open.png`

**修复**：`.dev-panel` 加 `max-height: calc(100vh - 40px)`，`.panel-content` 加 `overflow-y: auto` + 细滚动条样式。

**验证**：`screenshots/16-devtoolbar-scrollable.png` 面板完整可见，内容区可滚动。

### Issue #4 — CEO 初始密码警告（撤销，非 bug）

**现象**：CEO 登录后 /workbench 显示黄色警告"当前密码为初始密码（123456），请立即修改以确保账户安全"。

**复查**：DB 中 ceo.demo 的 `is_default_password=TRUE`，这是所有 demo 种子账号的默认值，警告是**设计正确行为**。如果用户改过密码，字段会变 FALSE，警告消失。

### Issue #5 — Logo 字符粘连（已修复）

**现象**：左上角 logo 显示 "E2E 测试企业 2OA工作台"，企业名与"OA"、"工作台"之间没有空格。

**截图**：`screenshots/06-workbench-ceo-sidebar-expanded.png`

**修复**：`default.vue` 模板字符串重写为 `{{ companyName ? companyName + ' OA 工作台' : '博渊 OA 工作台' }}`，空格一致。

**验证**：`screenshots/14-after-fixes-expanded.png` 显示"博渊 OA 工作台"。

### Issue #6 — 侧边栏组标题对比度低（已修复）

**现象**：组标题"工作"、"项目"、"人事"在深蓝底（#001529）上用 rgba(255,255,255,0.55) 灰字几乎看不清。

**修复**：color rgba 从 0.55 提到 0.78，加 `font-weight: 600` + `letter-spacing: 1px`。

**验证**：组标题更醒目，但仍是次级视觉层级。

### Issue #7 — 侧边栏折叠态组标题未隐藏（已修复）

**现象**：折叠态（80px 宽）下组标题"工作/项目/人事"小字还在，与图标挤在一起。预期：折叠时只剩图标。

**截图**：`screenshots/07-sidebar-collapsed.png`

**修复**：加 `:deep(.ant-layout-sider-collapsed .ant-menu-item-group-title) { display: none }`；AntD 默认不在折叠态隐藏 MenuItemGroup title，需自己覆盖。

**验证**：`screenshots/15-after-fixes-collapsed.png` 折叠态只剩图标，图标纯净排列。

### Issue #8 — "重复 toast"（撤销，非 bug）

**现象**：修改密码发送验证码后在顶栏和主内容区域同时看到"验证码已发送至绑定邮箱"文字。

**复查**：主内容里的是页面固定文字"验证码已发送至绑定邮箱"（步骤描述，永久显示），顶部悬浮的是 AntD `message.success()` 全局 toast。两者来源不同，非重复。

## 回归验证

- `mvn test`: 1315 tests green
- `yarn workspace oa-h5 test`: 35 tests green
- `yarn workspace oa-h5 lint`: 0 errors, 0 warnings
- `D-M01 Playwright E2E`: 29/29 green

## 输出物

- `screenshots/01-login-initial.png` ~ `16-devtoolbar-scrollable.png`（16 张）
- `report.md`（本文件）

## 使用方法（再次走查）

本目录 (`test/tools/manual-walkthrough/`) 是自动化走查工具集合。复现走查：

```bash
# 前置：后端 :8080 + 前端 :5868 都在跑，邮箱已配（provision_all_accounts.ts）
# 基于 agent-browser + dogfood 技能
agent-browser --session oa-auth-dogfood open http://localhost:5868/login
agent-browser --session oa-auth-dogfood snapshot -i
agent-browser --session oa-auth-dogfood screenshot /tmp/x.png
# 依次截图各场景，用 Read 工具查看 PNG
```

关键依赖：
- `agent-browser` CLI（全局 npm 安装，见 `~/.claude/skills/agent-browser/SKILL.md`）
- 后端 `/api/dev/*` 端点（reset / reset-rate-limit / restore-employee-demo / test-emails）
- 前端 DevToolbar（`app/h5/components/customized/DevToolbar.vue`）

## 结论

AUTH 模块 UI 层无阻塞问题。6 个 P2~P3 体验问题全部修完，2 个 Issue 经复查撤销。所有回归测试绿。D-M01 Stage 4 已做完 Claude 自主走查验收，等待用户浏览器最终确认。
