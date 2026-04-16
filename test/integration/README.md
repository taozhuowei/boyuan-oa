# API 集成测试

跨前后端的 HTTP 接口测试，使用 Vitest + 原生 fetch 直接向 `http://localhost:8080/api` 发起真实请求。  
后端不可达时所有用例自动跳过，不报错不阻塞 CI。

## 运行

```bash
# 先以 dev profile 启动后端
cd server && mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 执行集成测试
yarn vitest run --config vitest.integration.config.ts
```

## 已覆盖模块（api.test.ts）

| 模块 | 用例 | 覆盖内容 |
| --- | --- | --- |
| M0 基础设施 | 1 | `GET /health` 无需 token 返回 200 |
| M1 认证 | 5 | 登录成功 / 密码错误 / 无 token 401 / 角色返回 / 当前用户信息 |
| M1 员工管理 | 4 | 列表（CEO/worker 权限对比）/ 单条详情 / 404 |
| M2 组织管理 | 5 | 部门列表 / 项目列表（分页）/ 项目详情 / 操作日志（CEO 可读 / finance 403）|
| M5 薪资构成扩展 | 4 | 补贴列表 / 创建（权限 + 自动清理）/ 三级覆盖保存 / 奖金审批开关 |

## 测试规范

**覆盖目标**
- 每个端点至少一条 happy path + 一条权限边界（401 / 403）
- 状态变更（POST / PUT / DELETE）验证返回体关键字段，不仅是状态码

**数据策略**
- 测试账号来自 `server/src/main/resources/db/data.sql`（dev profile H2）
- 创建临时数据的用例**必须**在用例内清理（见 `api.test.ts` M5 补贴用例中的 `del` 调用）
- 用例间不共享全局写状态，避免执行顺序依赖

**服务可达性**
- `beforeAll` 以 3 秒超时探测 `/health`，不可达则设 `serverUp = false`
- 每个用例开头 `if (!serverUp) return ctx.skip()` 保证安全跳过

## 边界与异常用例

边界用例属于 HTTP 接口契约验证，无需浏览器，在此层执行成本最低。

### 认证安全

| 场景 | 接口 | 输入 | 期望 |
| --- | --- | --- | --- |
| JWT 过期 | 任意受保护接口 | 过期 Token | 401 |
| resetToken 超时（> 10 min）| `POST /auth/reset-password` | 已过期 resetToken | 401 |
| 验证码 60 秒内重复发送 | `POST /auth/send-reset-code` | 同号码连续调用 | 429 |
| 新手机号已被绑定 | `PUT /employees/me/phone` | 已存在的号码 | 409 |
| identityToken 二次使用 | 换绑手机第 3 步接口 | 已消费的 identityToken | 401 |

### 薪资边界

| 场景 | 接口 | 输入 | 期望 |
| --- | --- | --- | --- |
| 有未解决异议单时发起结算 | `POST /payroll/cycles/{id}/settle` | 存在 PENDING_REVIEW 单据 | 400 + 异议单数量 |
| 工伤提交含 amount 字段 | `POST /forms/injury` | body 含 `amount` 字段 | 201；amount 被忽略，字段为空 |
| 自定义费目含 description | `POST /payroll/items` | body 含 description | 200；工资条明细可返回该 description |

### 数据保留

| 场景 | 接口 | 输入 | 期望 |
| --- | --- | --- | --- |
| retentionYears = -1 | `PUT /retention-policies/{type}` | `retentionYears: -1` | 400（无永久类型）|
| operation_log 到期物理删除 | 触发清理任务后 `GET /operation-logs/{id}` | 已过期记录 id | 404（物理删除，无软删除字段）|

### 表单输入校验

| 场景 | 接口 | 输入 | 期望 |
| --- | --- | --- | --- |
| 请假天数为 0 | `POST /forms/leave` | `days: 0` | 400 |
| 加班时长超过 24 小时 | `POST /forms/overtime` | `hours: 25` | 400 |
| 必填附件未上传 | `POST /forms/leave` | 未包含附件字段（病假） | 400 |
| 密码为空字符串 | `POST /auth/reset-password` | `newPassword: ""` | 400 |

## 待扩展模块

按优先级排序，扩展时在 `api.test.ts` 中追加对应 `describe` 块。

| 模块 | 优先级 | 关键端点 |
| --- | --- | --- |
| M3 考勤 | P1 | `POST /attendance/leave`，`GET /attendance/approvals` |
| M4 审批引擎 | P1 | `PUT /approvals/{id}/approve`，`/reject`，skip 场景验证 |
| M5 薪资结算 | P1 | `POST /payroll/settle`，`GET /payroll/slips`，`GET /payroll/slips/{id}/pdf` |
| M6 项目 | P2 | `POST /projects`，`PUT /projects/{id}/milestone` |
| M8 施工 | P2 | `POST /construction-logs`，`POST /injury-claims` |
| M9 通知 | P2 | `GET /notifications`，`PUT /notifications/{id}/read` |
| M10 数据保留 | P2 | `GET /retention-policies`，`POST /export-tasks` |
