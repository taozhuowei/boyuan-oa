# E2E 测试用例设计

> 本文档为 E2E 层专项测试用例，主测试策略见 [TEST_DESIGN.md](../TEST_DESIGN.md)。  
> 最后全量审查日期：**2026-04-17**（对照 DESIGN.md 和当前 spec 文件逐条核实）。

---

## 测试原则

- 每条用例验证**数据库最终状态**，不仅依赖页面反馈（通过 REST API 查询验证）
- 每个 spec 文件执行前调用 `POST /api/dev/reset` 重置业务数据（保留账号 / 配置 / 参照数据）
- 测试账号来自 [local/seed-data.sql](../../local/seed-data.sql)（dev profile，本地手动执行一次）
- 所有元素定位使用 `data-testid` 属性，禁止依赖 CSS class / id
- **禁止**在断言中仅判断元素存在，必须验证内容（status 文本、记录数量、金额数值）

## 实现状态说明

| 符号 | 含义 |
|------|------|
| ✅ | spec 文件已有实现 |
| ⚠️ | 已实现但有已知缺陷（见备注） |
| ❌ | 设计有，spec 文件无实现 |

## 流水线触发时机

| 触发时机 | 执行范围 |
| --- | --- |
| 每次 push | 后端单元 + 集成测试；前端单元 + 类型检查 |
| 每日构建 | E2E 冒烟（核心主线：E2E-01-1 + E2E-05-3 + E2E-06-2 + E2E-09 完整审批流）|
| 发版前 | E2E 全量（所有主线 + BC-01 边界用例）|

---

## E2E-01 员工主线（employee.demo）

**前置**：dev profile 已启动，业务数据已重置。

| # | 操作角色 | 操作步骤 | 期望结果 | DB 断言 | 状态 | 特殊说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | employee | 使用 `employee.demo / 123456` 登录 | 进入工作台；可见"请假""加班"入口；无施工日志、工伤入口 | `sys_user.last_login_at` 更新 | ✅ | 首次登录应出现密码修改提醒横幅 |
| 2 | employee | 提交请假申请（年假 3 天） | 提交成功；列表显示"待审批" | `form_record.status = PENDING`；`leave_application` 新增 | ✅ | 需选择请假类型和日期范围 |
| 3 | employee | 查看工资条列表 | 仅显示本人工资单；状态"待确认" | `payroll_slip.employee_id = 本人 id` | ❌ | **前置**：需已完成结算的周期；由 fixture 预置数据 |
| 4 | employee | 完成电子签名绑定 | 绑定成功；工作台签名状态变为"已绑定" | `employee_signature` 新增记录 | ✅ | 签名画布须至少划线一次方可提交 |
| 5 | employee | 确认工资条 | 签名并确认；存证 PDF 生成；状态变"已确认" | `payroll_confirmation` 新增；PDF 文件落盘 | ❌ | 需先完成步骤 4，否则按钮不可点 |
| 6 | employee | 忘记密码（手机验证码重置） | 4 步流程完成；新密码可登录；旧密码登录返回 401 | `sys_user.password_hash` 已更新 | ❌ | 60 秒内重复发送验证码应返回 429（属集成测试层验证） |
| 7 | employee | 修改绑定手机号 | 3 步弹窗完成；个人档案脱敏显示新号码 | `sys_user.phone` 已更新 | ❌ | 新手机号若已被其他账号绑定应返回 409（属集成测试层验证） |

---

## E2E-02 劳工主线（worker.demo）

**前置**：dev profile 已启动；E2E-01 中 employee 已提交请假单（可复用同一 reset 后执行）。

| # | 操作角色 | 操作步骤 | 期望结果 | DB 断言 | 状态 | 特殊说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | worker | 使用 `worker.demo / 123456` 登录 H5 | 工作台可见"工伤申报"入口；无薪资管理入口；无施工日志入口 | — | ✅ | 劳工角色权限隔离验证；LOG 入口需 FOREMAN 第二角色 |
| 2 | worker | 提交施工日志（选择项目 / 填写天气与工作内容） | 提交成功；列表出现新记录；状态"待审批" | `construction_log` 新增 | ❌ | **前置**：pm 须先为 worker.demo 分配工长角色（E2E-04 步骤 6）|
| 3 | worker | 发起工伤申报（含受伤时间/医生诊断/事故经过三个独立字段） | 表单无"补偿金额"字段；提交成功；状态"待初审" | `injury_claim` 新增；`form_record.status = PENDING` | ⚠️ | 当前 spec 缺三字段验证（BUG-A4 修复后需同步更新断言）|
| 4 | worker | 查看待办列表 | 无审批权限；待办为空或无"审批"Tab | — | ✅ | 权限边界验证 |
| 5 | worker | 查看并确认工资条 | 签名并确认；状态"已确认" | `payroll_confirmation` 新增；PDF 落盘 | ❌ | 需先有已结算的工资条数据 |

---

## E2E-03 部门经理主线（dept_manager.demo）

**前置**：employee 已提交请假单（PENDING）。

> ⚠️ **已知 spec 缺陷**：`e2e_03_dept_manager.spec.ts` 中三个测试均使用 `employee` 账号而非 `dept_manager.demo`，导致整个套件无效。修复时须将 `loginAs(context, 'employee')` 改为 `loginAs(context, 'dept_manager')`，并确认 dept_manager.demo 账号在 seed data 中存在。

| # | 操作角色 | 操作步骤 | 期望结果 | DB 断言 | 状态 | 特殊说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | dept_manager | 查看待办 | 显示本部门员工提交的 PENDING 单据 | — | ⚠️（角色错误）| 只能看到自己部门的单据，跨部门不可见 |
| 2 | dept_manager | 审批通过请假申请 | 状态变"已通过"；待办消失；CEO 收到通知 | `form_record.status = APPROVED`；CEO notification 新增 | ⚠️（角色错误）| 审批链：员工 → 部门经理 → CEO（通知）|
| 3 | dept_manager | 驳回加班补申报（填驳回意见） | 状态变"已驳回"；驳回意见可读 | `form_record.status = REJECTED` | ⚠️（角色错误）| 驳回须填写驳回意见，不填则拦截 |
| 4 | dept_manager / employee | 跨角色：员工查看驳回原因 → 修改后重提 → dept_manager 重新审批 | 重提后从第一节点重新流转 | `form_record` 新版保留历史；重提后 status=PENDING | ❌ | 跨角色操作，需切换账号 |

---

## E2E-04 项目经理主线（pm.demo）

**前置**：劳工已提交工伤申报（PENDING）；施工日志已提交（PENDING）。

| # | 操作角色 | 操作步骤 | 期望结果 | DB 断言 | 状态 | 特殊说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | pm | 查看待办 | 显示劳工提交的 PENDING 单据 | — | ❌ | — |
| 2 | pm | 审批通过施工日志 | 日志归档；状态"已通过" | `construction_log.status = APPROVED` | ❌ | — |
| 3 | pm | 驳回劳工请假申请 | 状态"已驳回"；劳工可重提 | `form_record.status = REJECTED` | ❌ | — |
| 4 | pm | PM 本人发起工伤申报 | 初审节点自动 SKIPPED；直接进入财务审批节点 | 第一节点 `status = SKIPPED`；第二节点 `status = PENDING` | ✅ | 审批引擎跳过条件：提交人 == 当前审批人 |
| 5 | pm | 查看项目进度看板 | 显示里程碑、完成率、最新施工日志 | — | ✅ | — |
| 6 | pm | 为 worker.demo 分配"工长"第二角色 | 操作成功；CEO 收到通知；该劳工可提交施工日志 | `second_role_assignment` 新增；notification 新增 | ⚠️ | 当前 spec 用数字 ID 输入，A5 修复后须改为员工搜索下拉 |

---

## E2E-05 财务主线（finance.demo）

**前置**：薪资周期窗口期开放；员工数据完整；工伤申报已归档。

| # | 操作角色 | 操作步骤 | 期望结果 | DB 断言 | 状态 | 特殊说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | finance | 查看薪资周期窗口期状态 | 显示当前周期剩余窗口期时间；各员工数据完整状态 | `payroll_cycle.window_status = OPEN` | ✅ | — |
| 2 | finance | 预结算检查（发起结算前） | 2 项强制检查全通过；"发起结算"按钮激活 | — | ❌ | 存在未解决异议单时检查应失败，按钮不可点 |
| 3 | finance | 执行正式结算 | 周期锁定；全员工资条状态变"待确认" | `payroll_cycle.locked = true`；`payroll_slip` 批量生成 | ⚠️ | 当前 spec 未验证 SETTLED 状态文本，需加断言 |
| 4 | finance | 录入工伤理赔金额 | 对已归档工伤记录录入补偿金额 | `injury_claim.compensation_amount` 更新 | ✅ | 仅财务可录入金额 |
| 5 | finance | 发起薪资更正（申请解锁） | 提交 CEO 审批解锁申请；状态"待 CEO 审批" | `approval_record.status = PENDING` | ✅ | 更正原因必填 |
| 6 | finance | 重新结算（CEO 审批解锁后） | 版本号递增（v1 → v2）；旧版本标记"已作废" | `payroll_slip.version = 2`；旧版本 `status = SUPERSEDED` | ❌ | 需先 E2E-06 步骤 8 完成后执行 |

---

## E2E-06 CEO 主线（ceo.demo）

**前置**：各角色已提交待审批单据；薪资更正申请已提交（来自 E2E-05 步骤 5）。

| # | 操作角色 | 操作步骤 | 期望结果 | DB 断言 | 状态 | 特殊说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | ceo | 查看全局待办 | 显示所有通知类单据；待办角标数量正确 | — | ❌ | 审批链末端配置为 CEO 需审批时，此处显示"待审批" |
| 2 | ceo | 查看并管理操作日志 | 分页展示全系统操作日志；finance 角色访问被拒 | — | ✅ | — |
| 3 | ceo | 配置自定义角色权限 | 新增角色并分配权限码；对应账号重新登录后权限即时生效 | `sys_role` + `sys_permission` 新增 | ❌ | 权限级别：查看 / 修改 / 增删 / 审批 |
| 4 | ceo | 修改审批流配置（为请假审批链加入总经理节点） | 配置保存成功；后续请假单流转包含总经理节点 | `approval_flow_config` 更新 | ❌ | 修改不影响已流转中的单据 |
| 5 | ceo | 上传工资确认协议 | 文件上传成功；预览正常；版本号递增 | `salary_confirmation_agreement` 新增版本 | ❌ | — |
| 6 | ceo | 查看数据保留到期提醒 | 显示 30 天内到期的数据保留提醒列表 | `retention_reminder` 有记录 | ❌ | — |
| 7 | ceo | 执行"导出后删除"保留策略 | 异步导出任务创建；任务完成后数据可下载 | `export_backup_task.status = PENDING → DONE` | ❌ | 下载链接 72 小时有效 |
| 8 | ceo | 审批薪资更正解锁申请 | 批准后周期解锁；财务可重新结算 | `payroll_cycle.locked = false` | ✅ | CEO 必须亲自操作，不可委托 |
| 9 | ceo | 停用某员工账号 | 账号停用；该员工无法登录 | `sys_user.status = DISABLED` | ✅ | 停用前弹窗二次确认 |

---

## E2E-07 HR 主线（hr.demo）

**前置**：dev profile 已启动；业务数据已重置。

> 注：步骤 1 当前 spec 使用 CEO 账号创建部门（因 HR 界面中部门创建可能需 CEO 权限），后续需对照代码确认。

| # | 操作角色 | 操作步骤 | 期望结果 | DB 断言 | 状态 | 特殊说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | hr（或 ceo） | 创建部门 | 部门出现在组织树 | `department` 新增 | ✅ | 当前 spec 用 CEO，需确认是否 HR 可操作 |
| 2 | hr | 创建岗位 + 等级 | 岗位等级可在人员创建时选择 | `position` + `position_level` 新增 | ❌ | 需先创建部门 |
| 3 | hr | 创建新员工（含性别/部门/岗位/等级/直系领导/主角色全部字段）| 系统自动生成员工编号；初始密码 123456 | `sys_user` + `employee` 新增 | ⚠️ | 当前 spec 缺性别等字段（A2 修复后须补全）；手机号唯一性测 409 |
| 4 | hr | 配置组织架构树（拖拽汇报关系）| 汇报关系保存成功；循环汇报时系统拒绝 | `employee.supervisor_id` 更新 | ❌ | CEO 节点固定顶层不可拖动 |
| 5 | hr | 修改员工手机号 | 修改成功；操作日志自动记录 | `sys_user.phone` 更新 | ✅ | — |
| 6 | hr | 配置假期类型与配额（新增"调休假"，3天，不扣款）| 新假期类型全员生效；员工请假下拉可见"调休假" | `leave_type` 新增 | ❌ | 需 A1 `/leave-types` 修复后测试 |

---

## E2E-08 初始化向导（首次部署）

**前置**：全新空库启动，未完成任何初始化步骤（`system_config.initialized = false`）。

| # | 操作角色 | 操作步骤 | 期望结果 | DB 断言 | 状态 | 特殊说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | deployer | 首次访问系统 | 自动重定向到初始化向导，无法跳过前置步骤 | — | ✅ | — |
| 2 | deployer | Step 1：填写 CEO 账号信息（姓名 / 手机 / 密码≥8位） | 账号创建成功；展示一次性 32 位恢复码 | `sys_user`（role=ceo）新增 | ⚠️ | 当前 spec 只验证恢复码显示，未验证刷新后消失 |
| 3 | deployer | Step 2：创建 HR 账号 | 账号创建成功；初始密码 123456 | `sys_user`（role=hr）新增 | ❌ | 步骤不可跳过 |
| 4 | deployer | 关闭浏览器后重新访问 | 从 Step 1 重新开始；已填数据不保留 | — | ✅ | 向导进行中途会话失效即重置 |
| 5 | deployer | 完成全部步骤（含可选步骤跳过） | 进入系统正式运营状态 | `system_config.wizard_done = true` | ❌ | 向导完成后不可重入；deployer 账号当场失效 |
| 6 | ceo | 用 CEO 账号登录 | 成功进入 CEO 工作台 | — | ❌ | deployer 账号此时无法登录 |
| 7 | ceo | 再次尝试访问向导 URL | 重定向到 CEO 工作台（向导不可重入） | — | ✅ | — |

---

## E2E-09 跨角色完整请假审批流（核心优先级，当前完全未实现）

**目的**：验证从提交到审批通过/驳回的完整状态转换链路。这是当前测试体系最大的缺口。  
**目标文件**：[e2e_09_leave_approval_flow.spec.ts](specs/e2e_09_leave_approval_flow.spec.ts)（需新建）  
**前置**：dev reset 已执行；employee.demo 和 dept_manager.demo 均属同一部门。

| 步骤 | 操作角色 | 操作 | 期望结果 | 断言类型 | 状态 |
|------|---------|------|---------|---------|------|
| 1 | employee | 提交请假申请（年假 2 天，原因：家事）| 提交成功，Toast 无报错 | DOM: 列表出现新记录 | ❌ |
| 2 | employee | 查看"我的记录" | 新记录状态为"审批中"（PENDING）| DOM: `data-testid="record-status"` 文本 = "审批中" | ❌ |
| 3 | dept_manager | 登录，进入待办中心 | 该申请出现在待办列表 | DOM: `data-testid="todo-item"` 含申请人姓名 | ❌ |
| 4 | dept_manager | 填审批意见，点通过 | 弹窗关闭，Toast 提示成功 | DOM: todo-item 消失 | ❌ |
| 5 | employee | 刷新"我的记录" | 记录状态变为"已通过" | DOM: status = "已通过" | ❌ |
| 6 | API 验证 | GET /attendance/records（employee token）| 找到该记录 status = 'APPROVED' | HTTP 200，record.status 断言 | ❌ |
| **驳回场景** | | | | | |
| 7 | employee | 提交第二条请假申请 | 状态 PENDING | DOM: 列表新增一条 | ❌ |
| 8 | dept_manager | 驳回，填驳回意见"时间冲突" | 单据消失，员工记录状态更新 | API: status = 'REJECTED' | ❌ |
| 9 | employee | 查看"我的记录"，点驳回条目 | 驳回意见"时间冲突"可读 | DOM: reason 文本 = "时间冲突" | ❌ |
| 10 | employee | 点"重新发起"，修改日期后提交 | 新 formId，状态 PENDING（旧记录保留为 REJECTED）| API: 新 id ≠ 步骤7的 id，status='PENDING' | ❌ |

**验收标准**：所有 10 个步骤通过；断言均检查具体 DOM 文本或 HTTP 响应字段，无空洞断言。

---

## BC-01 认证安全边界（E2E 层）

> BC-02 薪资边界 / BC-03 数据保留 / BC-04 表单输入校验属于 HTTP 接口契约验证，见 [api.test.ts](../integration/api.test.ts)。

| 场景 | 操作角色 | 操作步骤 | 期望结果 | 状态 |
| --- | --- | --- | --- | --- |
| JWT 过期 | 任意 | 持有过期 Token 的会话访问任意页面 | 前端自动跳转登录页；不显示业务数据 | ❌ |
| 重置 Token 超时 | employee | 超过 10 分钟后完成忘记密码流程最后一步 | 提示"链接已过期"；不重置密码 | ❌ |
| identityToken 二次使用 | employee | 复用已消费的 identityToken 再次提交换绑手机 | 提示"操作已失效" | ❌ |
| 越权路由 - data-export | employee | 直接访问 /data-export | 重定向到首页，页面不加载 | ❌（BUG-E02 修复后可测）|
| 越权路由 - data-viewer | employee | 直接访问 /data-viewer | 重定向到首页 | ❌ |
| 越权路由 - employees | worker | 直接访问 /employees | 重定向到首页 | ✅（已在手工测试中验证）|

## BC-02 薪资边界（E2E + API 层）

> 验证薪资计算不会出现静默错误（结算为 0、负值、浮点精度丢失）。

| 场景 | 验证方式 | 期望 | 状态 |
| --- | --- | --- | --- |
| 薪资结算后工资条金额 > 0 | API: GET /payroll/slips?cycleId={id}，遍历每条 slip.amount | 每人 amount > 0 | ❌ |
| 请假扣款正确计入 | 请假 1 天后结算，工资条应减少对应金额 | slip.deductionAmount > 0 | ❌ |
| 加班补贴正确计入 | 加班 4h 后结算，工资条加班项 > 0 | slip 含 OVERTIME item, amount > 0 | ❌ |
| 报销金额计入工资条 | 报销审批通过后结算，工资条报销项正确 | slip 含 EXPENSE item | ❌ |

## BC-03 数据保留边界

| 场景 | 验证方式 | 期望 | 状态 |
| --- | --- | --- | --- |
| 到期数据出现在保留提醒列表 | GET /retention/reminders | 数组非空（需预置近期到期数据）| ❌ |
| 保留期修改后立即生效 | PUT /config/retention-period，再 GET /retention/reminders | 提醒列表按新期限重算 | ❌ |

## BC-04 表单输入校验（E2E 层回归）

> 对应手工测试 BUG-E01/E04~E07，修复后须在 E2E 层加回归用例。

| 场景 | 测试文件 | 期望 | 状态 |
| --- | --- | --- | --- |
| 初始化向导手机号格式校验（字母串应拒绝）| e2e_08 步骤 2 扩展 | Toast 提示手机号格式错误 | ❌（BUG-E01 修复后）|
| 报销明细金额填 0 提交被拦截 | T5 date_boundaries.js | 表单报错含"金额"字样 | ❌（BUG-E07 修复后）|
| 报销明细金额填 -100 被拦截 | T5 date_boundaries.js | 前端输入框 min=0.01 拒绝 | ❌（BUG-E06 修复后）|
| 密码修改 Toast 为业务语言 | T6 password_error_toast.js | Toast 不含"[POST]"字样 | ❌（BUG-E03 修复后）|
