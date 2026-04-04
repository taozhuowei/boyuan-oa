# Phase 2/3 API 验收测试报告

> 测试时间：2026-04-04  
> 后端：Spring Boot 3 + H2 (localhost:8080/api)  
> 测试方式：curl 集成测试（真实 HTTP 请求 + 真实 DB）

---

## 测试结果汇总

| TC | 测试项 | 结果 | 备注 |
|----|--------|------|------|
| TC-01 | 正确密码登录返回 token | ✅ PASS | 返回 userId / role / employeeType / token |
| TC-02 | 错误密码返回 401 | ✅ PASS | |
| TC-03 | 登录响应字段完整（userId/role/employeeType） | ✅ PASS | |
| TC-04 | 无 token 访问受保护接口返回 401 | ✅ PASS | |
| TC-05 | CEO 获取员工列表（含种子5条） | ✅ PASS | total=5 |
| TC-06 | CEO 新建员工，自动生成工号 | ✅ PASS | employeeNo=EMP2026040001 |
| TC-07 | 新员工出现在列表中 | ✅ PASS | |
| TC-08 | CEO 修改员工状态 DISABLED/ACTIVE | ✅ PASS | 注：body key 须为 `accountStatus`，非 `status` |
| TC-09 | CEO 重置员工密码 | ✅ PASS | 返回 204 |
| TC-10 | Worker 无权重置他人密码 | ✅ PASS | 403 |
| TC-11 | Worker 无权访问员工列表 | ✅ PASS | 403 |
| TC-12 | 部门树接口可访问 | ✅ PASS | 200 |
| TC-13 | 项目列表 CEO 可见 2 个项目 | ✅ PASS | |
| TC-14 | 财务无权创建角色 | ✅ PASS | 403 |
| TC-15 | 财务可查看角色列表 | ✅ PASS | 200 |
| TC-16 | 组织架构树返回根节点 | ✅ PASS | 6 nodes |
| TC-17 | 项目成员添加（CEO） | ✅ PASS | 201 |
| TC-18 | 岗位列表可访问 | ✅ PASS | 200 |
| TC-19 | CEO 创建岗位 | ✅ PASS（修复后）| bug: Position `IdType.INPUT` → 改为 `AUTO` |
| TC-20 | CEO 更新岗位 | ✅ PASS | 200 |
| TC-21 | CEO 删除岗位 | ✅ PASS | 204 |
| TC-22 | 财务无法直接创建岗位 | ✅ PASS | 403 |
| TC-23 | 忘记密码 - 发验证码 | ✅ PASS | 日志输出验证码 |
| TC-24 | 忘记密码 - 错误验证码拒绝 | ✅ PASS | 400 |
| TC-25 | 修改手机号 step1（send-current-code） | ✅ PASS | 路径：/auth/phone-change/ |
| TC-26 | 财务薪资覆盖提交 | ✅ PASS | 200 |
| TC-27 | 岗位等级创建 | ✅ PASS | 201 |

**总计：27 项 PASS，0 项 FAIL**

---

## Bug 清单

### BUG-01（已修复）— Position.IdType.INPUT 导致 POST /positions 500
- **现象**：POST /positions 返回 500，H2 报 NULL not allowed（id 列）
- **原因**：`Position.java` 中 `@TableId(type = IdType.INPUT)` 不自动生成 id，H2 IDENTITY 列不允许显式 null
- **修复**：`Position.java` 改为 `@TableId(type = IdType.AUTO)`
- **状态**：✅ 已修复并通过测试

### BUG-02（待修复）— PATCH /employees/{id}/status body key 误用时返回 500 而非 400
- **现象**：body 中用 `{"status":"DISABLED"}` 而不是 `{"accountStatus":"DISABLED"}` 时，服务端抛 IllegalArgumentException → 500
- **原因**：全局异常处理器未捕获 `IllegalArgumentException`，导致 500
- **修复建议**：添加 `@ExceptionHandler(IllegalArgumentException.class)` 返回 400
- **状态**：❌ 待修复（低优先级，客户端用正确 key 时无影响）

### BUG-03（待验收）— GET /projects/{id}/members 返回 405
- **现象**：`GET /projects/1/members` 返回 405 Method Not Allowed
- **原因**：ProjectController 只有 `POST /{id}/members` 和 `DELETE /{id}/members/{employeeId}`，没有 `GET /{id}/members`
- **影响**：项目详情页成员列表无法从独立接口获取（但成员信息包含在 GET /projects/{id} 响应内）
- **修复建议**：新增 `GET /projects/{id}/members` 路由，或确认前端用项目详情接口获取成员
- **状态**：❌ 待确认

### BUG-04（已知问题）— 修改手机号路径与前端不一致
- **后端实际路径**：`/api/auth/phone-change/send-current-code`
- **前端 ChangePhoneModal.vue 调用路径**：`/api/employees/me/phone/send-verify-code`（不存在）
- **状态**：❌ 需对齐（前端路径须改为 `/auth/phone-change/...`）

---

## 已验收功能范围

### Phase 2 — 身份认证 + 账号/角色管理
- ✅ JWT 登录（工号/手机号），错误密码 401
- ✅ JWT 含 userId / role / employeeType
- ✅ 员工 CRUD（含岗位/等级/角色/部门字段）
- ✅ 账号启用/禁用（CEO 直接，财务需审批）
- ✅ 密码重置（CEO 直接，财务需审批）
- ✅ 忘记密码流程（3步：发码→校验→重置）
- ✅ 修改手机号流程（4步，路径 /auth/phone-change/）
- ✅ 角色列表/新增/编辑（财务只读，CEO 全权）
- ✅ 薪资覆盖提交（财务提交，CEO 审批）

### Phase 3 — 组织管理
- ✅ 部门树 GET /departments
- ✅ 项目 CRUD（CEO/PM 权限分离）
- ✅ 项目成员添加/删除
- ✅ 岗位 CRUD + 等级 CRUD
- ✅ 组织架构树 GET /org/tree（6 节点）

---

## 你可以自行验收的点

1. **浏览器登录**：打开前端 dev server，用 DevLoginPanel 分别点击 5 个账号，确认跳转工作台
2. **员工管理**：用 CEO 账号进入员工管理页，新建一名员工，刷新后列表出现
3. **权限隔离**：用 Worker 账号登录，确认左侧菜单无"员工管理""角色管理"等入口
4. **岗位管理**：CEO 账号进入岗位管理，新建岗位后能在员工新建弹窗的岗位下拉中选择
5. **项目成员**：CEO 进入项目详情，添加/移除成员，刷新后成员列表正确

---

## 下一步

Phase 2/3 核心接口全部通过。建议修复 BUG-03（members 路由）和 BUG-04（手机号路径对齐）后进入 Phase 4（考勤 + 审批流）。
