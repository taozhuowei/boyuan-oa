# 博渊 OA 平台 — 开发路线图

> **唯一进度管理入口。** 完成一项立即打勾并提交。
>
> 优先级：`[P0]` 阻塞上线 / `[P1]` 上线必须 / `[P2]` 上线后迭代
>
> 状态：`[ ]` 未开始 / `[-]` 代码已写，待浏览器验收 / `[x]` 已完成（浏览器实测通过）
>
> 验收标准：**以真实浏览器可操作为准**，不接受仅代码存在、无法使用的功能。

---

## 当前阶段目标

**Phase A（当前）：补齐 Web 端所有功能，使系统可以真实上线测试**

Phase A 完成标准：所有角色登录后，菜单内的每一个页面均可正常使用，无 TODO 占位符，无死路由，核心业务链路可端到端跑通。

> **当前状态（2026-04-15）**：Phase A 所有代码已写完，后端新 JAR 已运行，API 集成测试全部通过（15/15）。
> UI 全部汉化完成，WorkbenchController 菜单已修正。剩余验收工作：需浏览器人工走查，通过后将 `[-]` 改为 `[x]`。
>
> **2026-04-15 补充核查**：逐文件核对后，A1/A2/A4 P0 页面全部实装；A5 两项（首次登录横幅、项目卡点击跳转）也已实装于 `app/h5/pages/index.vue`。发现 1 个新 gap 待讨论（见 A5 底部）：薪资构成扩展。

**Phase B（Phase A 完成后）：集成测试 + 生产部署验证**

**Phase C（Phase B 完成后）：微信小程序开发**

---

## Phase A — Web 端功能补齐

### A1 — 缺失页面（路由存在但页面不存在，点击必崩）

- [-] `[P0]` **个人信息页 `/me`**：展示当前登录用户的姓名、手机号、角色、部门
  > 验收：登录后点击右上角"个人信息"可正常进入，姓名/角色/手机号正确显示

- [-] `[P0]` **修改密码页 `/me/password`**：当前密码验证 + 新密码输入 + 确认，调用后端接口保存
  > 验收：输入错误旧密码有报错；修改成功后用新密码可正常登录

- [-] `[P0]` **表单中心 `/forms`**（PM/劳工菜单可见）：展示当前用户提交过的所有表单记录（含状态/类型/时间），支持查看审批历史
  > 验收：PM 账号侧边栏"表单中心"可进入，提交过的施工日志、工伤申报在列表中可见

- [-] `[P0]` **通讯录导入 `/directory`**（财务菜单可见）：CSV 粘贴 → 字段验证预览 → 确认导入，调用 `POST /import-preview` + `POST /import-apply`
  > 验收：粘贴 CSV 后可看到预览界面，确认后显示导入成功结果

### A2 — 占位符页面（文件存在但是 TODO placeholder，不可用）

- [-] `[P0]` **岗位管理页 `/positions`**：岗位列表（含岗位等级子列表）、新建/编辑/删除岗位、新建/编辑等级，调用 `/positions` CRUD 接口和 `/positions/{id}/levels` 接口；仅 CEO 可操作
  > 验收：CEO 账号可新建岗位并配置等级；新建员工时岗位下拉可选到此岗位

- [-] `[P0]` **角色管理页 `/role`**：展示系统内置角色列表及自定义角色；CEO 可新建自定义角色；调用 `/roles` 接口
  > 验收：CEO 账号可看到内置角色；可新建自定义角色并在员工创建时可选

- [-] `[P0]` **系统配置页 `/config`**：请假/加班计量单位（GET/POST /config/attendance-unit）、审批流配置展示；CEO 可修改
  > 验收：CEO 修改请假单位后前端重新加载显示新值；审批流配置页展示当前所有流定义

### A3 — 缺失后端接口

- [x] `[P0]` **后端 `POST /auth/change-password`**：需要当前密码验证（bcrypt compare），通过后更新密码哈希；JWT 不失效
  > 验收：旧密码错误返回 400；正确则返回 204；新密码立即生效
  > ✅ API 已验证：错误密码返回 400，正确返回 204（集成测试通过）

- [x] `[P1]` **后端 `GET /auth/me`**：返回当前登录用户的 employeeId、name、phone、roleCode、roleName、departmentName、employeeType、isDefaultPassword
  > 验收：携带有效 Token 调用返回正确用户信息；Token 无效返回 401
  > ✅ API 已验证：正确返回 ceo.demo 用户信息（集成测试通过）

- [x] `[P1]` **后端操作日志查询 `GET /operation-logs`**：支持分页、时间范围筛选；仅 CEO 可访问；按 actedAt 倒序
  > 验收：CEO Token 调用返回分页数据；finance Token 调用返回 403
  > ✅ API 已验证：CEO 返回 200 + 分页数据；finance 返回 403（集成测试通过）

### A4 — 操作日志查看页

- [-] `[P1]` **操作日志页面 `/operation-logs`**（CEO 菜单）：展示操作人、操作类型、目标类型、时间；支持按时间范围筛选；调用 `GET /operation-logs`
  > 验收：CEO 登录后侧边栏可见"操作日志"；列表可分页查看

- [x] `[P1]` **接入 `@OperationLogRecord` 注解到关键业务方法**：薪资结算（`PayrollEngine.settle`）、员工更新（`EmployeeController.updateEmployee`）、签名绑定（`SignatureController.bindSignature`）、审批操作（`ApprovalFlowService.advance`）
  > 验收：执行以上操作后，操作日志页出现对应记录
  > ✅ 已验证：PM 审批 → operation_log 写入2条记录（AOP 记录 + 业务记录）

### A5 — 功能完整性补充

- [-] `[P1]` **首次登录密码修改提醒**：用户密码为初始密码 `123456` 时，登录后工作台顶部展示醒目提示横幅（含"立即修改"按钮跳转 `/me/password`）
  > 验收：用新建员工账号（初始密码）登录，工作台出现提示；修改密码后提示消失

- [-] `[P1]` **工作台项目进度卡片可点击**：`activeProjectCount` 统计卡片点击跳转至 `/projects`
  > 验收：CEO 工作台点击"活跃项目"数字跳转到项目列表页

- [-] `[P2]` **考勤驳回后重新发起**：详情弹窗对 REJECTED 单展示驳回原因（取自审批历史最后一次 REJECT 的 comment）；"重新发起"按钮预填 leaveForm/overtimeForm 并切到对应 Tab
  > 验收：提交请假后被 PM 驳回，员工在记录中看到驳回原因和"重新发起"按钮

- [-] `[P2]` **薪资更正流程**：V6 迁移新增 `payroll_adjustment.slip_id/form_id/corrections_json/new_slip_id/applied`，PAYROLL_CORRECTION 表单类型 + CEO 单节点审批流。后端 `POST /payroll/slips/{id}/correction`（财务发起）+ `GET /payroll/corrections`（自动同步 form 状态：通过则 SUPERSEDED 原条 + version+1 新条）。前端工资条详情新增"发起更正"按钮 + "更正记录" Tab。
  > 验收：财务对已发布工资条发起更正，CEO 在 /todo 看到审批项；批准后下次访问"更正记录"自动应用，原条 SUPERSEDED + 新版本 PUBLISHED。

- [-] `[P0]` **薪资构成扩展（V5）**：实现 `净薪资 = 基本 + 岗位 + 绩效 + 加班 − 请假 + Σ固定补贴 + Σ临时补贴 ± 保险补贴/社保`。新增 `position_salary` 字段、`allowance_def`/`allowance_config` 三级覆盖（GLOBAL/POSITION/EMPLOYEE）、`payroll_bonus` 周期临时补贴、`payroll_bonus_approval_required` 配置开关（默认 false=直接生效+通知 CEO，true=走 CEO 审批流）。
  > 验收：① 岗位管理可设置"岗位工资/默认绩效"；② `/allowances` 页可创建补贴项并按全局/岗位/员工三级配置；③ `/payroll` 周期管理新增"临时补贴/奖金" Tab；④ `/config` 页可切换审批开关；⑤ 结算后工资条按 `payroll_item_def.display_order` 完整展示每一项。

---

## Phase B — 集成测试 & 生产部署验证

> **前置条件**：后端已重启加载新 JAR，浏览器走查 Phase A 所有页面通过。

### B1 — 联调冒烟测试

- [ ] `[P0]` **主链路 E2E 测试脚本**（扩展 `test/integration/api.test.ts`）：
  - 员工请假 → PM 审批通过 → 状态 APPROVED，申请人收到通知
  - 财务创建薪资周期 → 开窗 → 预检 → 结算 → 员工 PIN 确认
  - 劳工提交施工日志 → PM 批注审批通过
  - CEO 查看工作台摘要数据非空
  > 验收：`yarn test:integration`（或等效命令）全部通过，后端服务运行中

- [ ] `[P1]` **浏览器角色完整走查**（手动，各角色登录依次点遍所有菜单页面）：
  - CEO：全菜单无 404/空白/报错（含 /positions /role /config /operation-logs）
  - HR：员工管理、岗位管理、组织架构正常
  - Finance：薪资管理完整流程，通讯录导入可用
  - PM：项目、施工日志、工作项模板、待办审批、表单中心
  - Employee：考勤、工资条查看确认
  - Worker：施工日志、工伤申报、表单中心
  > 验收：6 个角色全部通关，无死链

- [x] `[P1]` **AutoTest 工具通用化**：`tools/autotest` 改为三栏可视化工作台，支持全盘目录树检索、项目级配置扫描、项目自动启动、右栏人工确认、AI 友好失败报告
  > 验收：`tools/autotest` 构建通过；`test/autotest/autotest.config.json` 已升级到通用配置协议；README 已同步更新

### B2 — 生产部署验证

- [ ] `[P0]` **Docker 构建测试**：在本地执行 `docker build -t boyuan-oa .`，镜像构建成功，`docker run` 后 `/actuator/health` 返回 `{"status":"UP"}`
  > 验收：镜像构建无报错；健康检查通过

- [ ] `[P1]` **PostgreSQL 迁移验证**：使用 PostgreSQL 启动后端（`-Dspring.profiles.active=prod`），Flyway V1+V2 迁移无报错，5个种子账号可登录
  > 验收：`docker compose up`（或等效）成功；ceo.demo 可登录

- [x] `[P1]` **前端生产构建**：`yarn build:h5` 无报错，`.output/` 目录生成
  > 验收：已验证，exit 0，构建时间 14.45s，无任何 error

- [ ] `[P2]` **版本号注入**：`git tag v1.0.0` → GitHub Actions release.yml 将版本号注入 JAR manifest + 前端 `VITE_APP_VERSION` 环境变量
  > 验收：`/actuator/info` 返回版本号；前端页脚/设置页显示版本

---

## Phase C — 微信小程序（Phase B 完成后启动）

> 启动条件：Phase B 全部完成，web+后端已在生产环境运行稳定。

### C1 — 前置清理

- [ ] `[P1]` 清理 `app/mp/src/pages.json`：仅保留6个入口（登录、工作台、待办、考勤、项目、忘记密码）
- [ ] `[P1]` 审查并清理 `app/mp/src/` 中残留的 `#ifdef H5` 条件编译块

### C2 — 核心页面

- [ ] `[P2]` 登录页：手机号/密码登录，token 写入 uni storage
- [ ] `[P2]` 工作台：动态菜单卡片（按角色），未读待办徽章
- [ ] `[P2]` 待办页：待审批列表，支持通过/驳回操作
- [ ] `[P2]` 考勤页：请假/加班申请入口，本月记录展示
- [ ] `[P3]` 项目页：项目列表，PM 查成员，劳工填施工日志
- [ ] `[P3]` 忘记密码：完整4步流程

### C3 — 验收测试

- [ ] `[P2]` TC-MP-01：各角色登录后菜单与权限一致
- [ ] `[P2]` TC-MP-02：提交请假后审批人待办出现，操作后状态同步
- [ ] `[P3]` TC-MP-03：施工日志（worker）可提交

---

## 已完成（Phase 0 历史记录）

M0 基础设施 / M1 身份认证 / M2 组织管理 / M3 审批流引擎 / M4 考勤模块 / M5 薪资模块（含签名/PDF/社保分叉） / M6 项目管理 / M8 施工&工伤 / M9 通知&工作台 / M10 数据生命周期 / M11 CI/CD+部署脚本+Dockerfile / M12 初始化向导

> 代码验证日期：2026-04-10。上述模块核心逻辑均已在代码中确认，非仅文档标记。
