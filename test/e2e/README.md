# 全链路 E2E 测试设计

基于 DESIGN.md 按角色视角设计的全链路测试用例。  
框架待选型（候选：Playwright），用例尚未落地实现，本文档作为后续实现依据。

## 测试原则

- 每条用例验证**数据库最终状态**，不仅依赖页面反馈
- 每个测试文件执行前调用 `POST /api/test/reset` 重置业务数据（保留账号 / 配置 / 预置数据）
- 测试账号来自 `server/src/main/resources/db/data.sql`（dev profile）

## 测试账号

| 账号 | 密码 | 角色 | 用途 |
| --- | --- | --- | --- |
| `ceo.demo` | 123456 | ceo | CEO 主线测试 |
| `hr.demo` | 123456 | hr | HR 主线测试 |
| `finance.demo` | 123456 | finance | 薪资结算测试 |
| `pm.demo` | 123456 | project_manager | 审批 / PM 主线 |
| `employee.demo` | 123456 | employee | 普通员工主线 |
| `worker.demo` | 123456 | worker | 劳工主线（小程序端） |

---

## E2E-01 员工主线（employee.demo）

**前置**：dev profile 已启动，业务数据已重置。

| # | 操作角色 | 操作步骤 | 期望结果 | DB 断言 | 特殊说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | employee | 使用 `employee.demo / 123456` 登录 | 进入工作台；可见"请假""加班"入口；无施工日志、工伤入口 | `sys_user.last_login_at` 更新 | 首次登录应出现密码修改提醒横幅 |
| 2 | employee | 提交请假申请（年假 3 天） | 提交成功；列表显示"待审批" | `form_record.status = PENDING`；`leave_application` 新增 | 需选择请假类型和日期范围 |
| 3 | employee | 查看工资条列表 | 仅显示本人工资单；状态"待确认" | `payroll_slip.employee_id = 本人 id` | **前置**：需已完成结算的周期；重置后无工资条时此步骤应跳过或由 fixture 预置工资条数据 |
| 4 | employee | 完成电子签名绑定 | 绑定成功；工作台签名状态变为"已绑定" | `employee_signature` 新增记录 | 签名画布须至少划线一次方可提交 |
| 5 | employee | 确认工资条 | 签名并确认；存证 PDF 生成；状态变"已确认" | `payroll_confirmation` 新增；PDF 文件落盘 | 需先完成步骤 4，否则按钮不可点 |
| 6 | employee | 忘记密码（手机验证码重置） | 4 步流程完成；新密码可登录；旧密码登录返回 401 | `sys_user.password_hash` 已更新 | 60 秒内重复发送验证码应返回 429 |
| 7 | employee | 修改绑定手机号 | 3 步弹窗完成；个人档案脱敏显示新号码 | `sys_user.phone` 已更新 | 新手机号若已被其他账号绑定应返回 409 |

---

## E2E-02 劳工主线（worker.demo）

**前置**：dev profile 已启动；E2E-01 中 employee 已提交请假单（可复用同一 reset 后执行）。

| # | 操作角色 | 操作步骤 | 期望结果 | DB 断言 | 特殊说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | worker | 登录小程序（或 H5 Worker 端） | 工作台可见"施工日志""工伤申报"入口；无薪资管理入口 | — | 劳工角色权限隔离验证 |
| 2 | worker | 提交施工日志（选择项目 / 填写天气与工作内容） | 提交成功；列表出现新记录；状态"待审批" | `construction_log` 新增 | **前置**：需先由 pm 在项目人员管理中为 worker.demo 分配「工长」第二角色（DESIGN.md §8.3：仅持有工长角色的劳工可见 LOG 入口）；分配步骤见 E2E-04 第 6 行 |
| 3 | worker | 发起工伤申报 | 表单无"补偿金额"字段；提交成功；状态"待初审" | `injury_claim` 新增；`form_record.status = PENDING` | 金额由财务事后录入，提交时含 amount 字段应被忽略 |
| 4 | worker | 查看待办列表 | 无审批权限；待办为空或无"审批"Tab | — | 权限边界验证 |
| 5 | worker | 查看并确认工资条 | 签名并确认；状态"已确认" | `payroll_confirmation` 新增；PDF 落盘 | 需先有已结算的工资条数据 |

---

## E2E-03 部门经理主线（dept_manager.demo）

**前置**：员工已提交请假单（PENDING）。

| # | 操作角色 | 操作步骤 | 期望结果 | DB 断言 | 特殊说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | dept_manager | 查看待办 | 显示本部门员工提交的 PENDING 单据 | — | 只能看到自己部门的单据 |
| 2 | dept_manager | 审批通过请假申请 | 状态变"已通过"（默认审批链末端为 CEO 通知）；待办消失 | `form_record.status = APPROVED`；CEO 收到通知 | 审批链默认：员工 → 部门经理 → CEO（通知） |
| 3 | dept_manager | 驳回加班补申报 | 状态变"已驳回"；申请人可在原记录上修改重提 | `form_record.status = REJECTED` | 驳回须填写驳回意见 |
| 4 | dept_manager | 重提被驳回的申请（以员工身份重提） | 修改后重提；从第一审批节点重新流转 | `form_record` 记录修改前版本保留；状态重置为 PENDING | 跨角色操作：需切换至 employee 账号 |

---

## E2E-04 项目经理主线（pm.demo）

**前置**：劳工已提交工伤申报（PENDING）；施工日志已提交（PENDING）。

| # | 操作角色 | 操作步骤 | 期望结果 | DB 断言 | 特殊说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | pm | 查看待办 | 显示劳工提交的 PENDING 单据 | — | — |
| 2 | pm | 审批通过施工日志 | 日志归档；状态"已通过" | `construction_log.status = APPROVED` | — |
| 3 | pm | 驳回劳工请假申请 | 状态"已驳回"；劳工可重提 | `form_record.status = REJECTED` | — |
| 4 | pm | **PM 本人发起工伤申报（关键路径）** | 自己发起的申报中，初审节点自动 SKIPPED（PM 即初审人），直接进入财务审批节点 | 第一审批节点 `approval_step.status = SKIPPED`；第二节点 `status = PENDING` | 审批引擎 skipCondition：提交人 == 当前节点审批人时自动跳过 |
| 5 | pm | 查看项目进度看板 | 显示里程碑、完成率、最新施工日志 | — | — |
| 6 | pm | 为劳工分配"工长"第二角色 | 操作成功；CEO 收到通知；该劳工可提交施工日志 | `employee_role` 或 `project_member.second_role` 更新 | 分配无需审批；CEO 仅收通知 |

---

## E2E-05 财务主线（finance.demo）

**前置**：薪资周期窗口期开放；员工数据完整；工伤申报已归档。

| # | 操作角色 | 操作步骤 | 期望结果 | DB 断言 | 特殊说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | finance | 查看薪资周期窗口期状态 | 显示当前周期剩余窗口期时间；各员工数据完整状态 | `payroll_cycle.window_status = OPEN` | — |
| 2 | finance | 预结算检查（发起结算前） | 2 项强制检查全通过（无 PENDING_REVIEW 异议单）；"发起结算"按钮激活 | — | 存在未解决异议单时检查应失败，按钮不可点 |
| 3 | finance | 执行正式结算 | 周期锁定；全员工资条状态变"待确认" | `payroll_cycle.locked = true`；`payroll_slip` 批量生成 | 结算不可逆；需二次确认弹窗 |
| 4 | finance | 录入工伤理赔金额 | 对已归档工伤记录录入补偿金额；可关联至当前薪资周期 | `injury_claim.compensation_amount` 更新 | 仅财务可录入金额 |
| 5 | finance | 发起薪资更正（申请解锁） | 提交 CEO 审批解锁申请；状态"待 CEO 审批" | `approval_record.status = PENDING`（等待 CEO）| 更正原因必填 |
| 6 | finance | 重新结算（CEO 审批解锁后） | 版本号递增（v1 → v2）；旧版本保留并标记"已作废" | `payroll_slip.version = 2`；旧版本 `status = SUPERSEDED` | 需先完成 E2E-05 步骤 5 → E2E-06 步骤 7 再返回执行 |

---

## E2E-06 CEO 主线（ceo.demo）

**前置**：各角色已提交待审批单据；薪资更正申请已提交（来自 E2E-05 步骤 5）。

| # | 操作角色 | 操作步骤 | 期望结果 | DB 断言 | 特殊说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | ceo | 查看全局待办 | 显示所有"通知"类单据；无需审批操作（默认配置下 CEO 仅通知） | — | 审批链末端配置为 CEO 需审批时，此处显示"待审批" |
| 2 | ceo | 查看并管理操作日志 | 分页展示全系统操作日志；可按操作人 / 时间筛选 | — | finance 角色访问此页应返回 403 |
| 3 | ceo | 配置自定义角色权限 | 新增角色并分配权限码；对应账号重新登录后权限即时生效 | `sys_role` + `sys_permission` 新增记录 | 权限级别：查看 / 修改 / 增删 / 审批 |
| 4 | ceo | 修改审批流配置（为请假审批链加入总经理节点） | 配置保存成功；后续提交的请假单流转节点包含总经理 | `approval_flow_config` 更新 | 修改不影响已流转中的单据 |
| 5 | ceo | 上传工资确认协议 | 文件上传成功；预览正常；版本号递增 | `salary_confirmation_agreement` 新增版本 | — |
| 6 | ceo | 查看数据保留到期提醒 | 显示 30 天内到期的数据保留提醒列表 | `retention_reminder` 有记录 | — |
| 7 | ceo | 执行"导出后删除"保留策略 | 异步导出任务创建；任务完成后数据可下载 | `export_backup_task.status = PENDING → DONE` | 下载链接 72 小时有效 |
| 8 | ceo | 审批薪资更正解锁申请 | 批准后周期解锁；财务可重新结算 | `payroll_cycle.locked = false` | 此操作 CEO 必须亲自操作，不可委托 |
| 9 | ceo | 停用某员工账号 | 账号停用；该员工无法登录 | `sys_user.status = DISABLED` | 停用需 CEO 亲自操作；停用前弹窗二次确认 |

---

## E2E-07 HR 主线（hr.demo）

**前置**：dev profile 已启动；业务数据已重置。

| # | 操作角色 | 操作步骤 | 期望结果 | DB 断言 | 特殊说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | hr | 创建部门 | 部门出现在组织树 | `department` 新增 | — |
| 2 | hr | 创建岗位 + 等级 | 岗位等级可在人员创建时选择 | `position` + `position_level` 新增 | 需先创建部门 |
| 3 | hr | 创建新员工 | 系统自动生成员工编号；初始密码 123456；员工可登录 | `sys_user` + `employee` 新增 | 手机号唯一，重复应提示 409 |
| 4 | hr | 配置组织架构树（拖拽） | 汇报关系保存成功；循环汇报时系统拒绝 | 对应 `employee.supervisor_id` 更新 | CEO 节点固定在顶层，不可拖动 |
| 5 | hr | 修改员工基础信息（手机号） | 修改成功；该员工下次登录信息更新 | `sys_user.phone` 更新 | 操作日志自动记录此次修改 |
| 6 | hr | 配置假期类型与配额 | 新假期类型对全员生效 | `leave_type` 新增 | — |

---

## E2E-08 初始化向导（首次部署）

**前置**：全新空库启动，未完成任何初始化步骤。

| # | 操作角色 | 操作步骤 | 期望结果 | DB 断言 | 特殊说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | deployer | 首次访问系统 | 自动重定向到初始化向导，无法跳过前置步骤 | — | — |
| 2 | deployer | Step 1：填写 CEO 账号信息（姓名 / 手机 / 密码≥8位） | 账号创建成功；展示一次性 32 位恢复码 | `sys_user`（role=ceo）新增 | 恢复码仅显示一次，刷新后消失 |
| 3 | deployer | Step 2：创建 HR 账号 | 账号创建成功；初始密码 123456 | `sys_user`（role=hr）新增 | 步骤不可跳过 |
| 4 | deployer | 关闭浏览器后重新访问 | 从 Step 1 重新开始；已填数据不保留 | — | 向导进行中途会话失效即重置 |
| 5 | deployer | 完成全部步骤（含可选步骤跳过） | 进入系统正式运营状态；deployer 账号失效 | `sys_config.wizard_done = true` | 向导完成后不可重入；deployer 账号当场失效 |
| 6 | ceo | 用 CEO 账号登录 | 成功进入 CEO 工作台 | — | deployer 账号此时无法登录 |
| 7 | ceo | 再次尝试访问向导 URL | 重定向到 CEO 工作台（向导不可重入） | — | — |

---

## 边界与异常路径

### BC-01 认证安全

| 场景 | 操作角色 | 输入 | 期望结果 |
| --- | --- | --- | --- |
| JWT 过期 | 任意 | 使用过期 Token 请求任意接口 | 401；前端自动跳转登录页 |
| 重置 Token 超时 | employee | 超过 10 分钟后调用 `/auth/reset-password` | 401 |
| 60 秒内重复发送验证码 | employee | 发送后立即再次发送 | 429 Too Many Requests |
| 新手机号已被绑定 | employee | `PUT /employees/me/phone` 使用已被其他账号绑定的号码 | 409 Conflict |
| 重用已消费的 identityToken | employee | 复用已消费的 identityToken 再次请求 | 401 |

### BC-02 薪资边界
> 以下用例属于 HTTP 接口契约验证，无需浏览器执行，已移至 `test/integration/README.md` 边界用例章节。

### BC-03 数据保留
> 以下用例属于应用层 / 定时任务行为验证，无需浏览器执行，已移至 `test/integration/README.md` 边界用例章节。

### BC-04 表单输入校验
> 以下用例属于 HTTP 400/422 参数校验，无需浏览器执行，已移至 `test/integration/README.md` 边界用例章节。

---

## 自动化实现规划（待落地）

### 工具选型

| 层级 | 工具 | 理由 |
| --- | --- | --- |
| E2E（H5） | Playwright | 支持 Chromium / Firefox / WebKit；原生 API 请求拦截；支持并行执行 |
| E2E（小程序） | 微信开发者工具 CLI + Playwright | 小程序端暂缓，Phase C 启动后落地 |
| DB 断言 | 直接调用 REST API（`GET /api/xxx`）验证最终状态 | 避免测试直连 DB，与生产架构一致 |

### 目录结构（规划）

```
test/e2e/
├── README.md              # 本文档
├── playwright.config.ts   # Playwright 配置
├── fixtures/
│   └── reset.ts           # POST /api/test/reset 封装
├── pages/                 # Page Object 模式
│   ├── LoginPage.ts
│   ├── AttendancePage.ts
│   ├── PayrollPage.ts
│   └── ...
└── specs/                 # 测试用例（按角色）
    ├── employee.spec.ts
    ├── worker.spec.ts
    ├── pm.spec.ts
    ├── ceo.spec.ts
    ├── finance.spec.ts
    └── hr.spec.ts
```

### Page Object 规则

- 所有页面交互封装为 `Page Object` 类，spec 文件不直接写 CSS 选择器
- 使用 `data-testid` 属性定位元素，禁止依赖 class / id
- `fixtures/reset.ts` 使用 `base.extend` 声明为 auto fixture，每个 spec 前自动调用

### 流水线触发时机

| 触发时机 | 执行范围 |
| --- | --- |
| 每次 push | 后端单元 + 集成测试；前端单元 + 类型检查 |
| 每日构建 | E2E 冒烟（核心主线：E2E-01 + E2E-05 + E2E-06 步骤 8）|
| 发版前 | E2E 全量（所有主线 + 所有边界用例）|
