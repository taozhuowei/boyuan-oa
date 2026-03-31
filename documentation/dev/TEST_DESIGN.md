# 众维 OA — 测试设计文档

## 1. 测试策略

| 测试层级 | 目标 | 工具 | 执行时机 |
|---|---|---|---|
| 单元测试 | 验证单个函数/组件/类的正确性 | JUnit 5 (后端), Vitest (前端) | 每次提交前 |
| 集成测试 | 验证 Controller + Service + DB 的接口契约 | Spring Boot Test + Testcontainers | 每日构建 |
| 系统/E2E 测试 | 验证完整业务流程（按角色视角） | Playwright / agent-browser + API 脚本 | 阶段提测前 |
| 回归测试 | 防止新改动破坏已有功能 | 自动化测试套件全量执行 | 每次发版前 |

## 2. 单元测试

### 2.1 后端单元测试（JUnit 5 + Mockito）

**覆盖目标**：Service 层纯业务逻辑、工具类、DTO 校验

| 模块 | 测试类 | 关键断言 |
|---|---|---|
| 认证 | `JwtTokenServiceTest` | Token 生成/解析、过期校验 |
| 权限 | `AccessManagementServiceTest` | 角色映射、员工类型绑定 |
| 表单 | `OaDataServiceFormTest` | 创建表单后状态为 PENDING、审批后状态变为 APPROVED |
| 薪资 | `OaDataServicePayrollTest` | 预结算校验失败返回 false、正式结算后周期锁定 |
| 审批 | `FormControllerTest` | 非审批角色调用 approve 返回 403、劳工角色调用 injury 返回 200 |

**示例**：审批状态流转
```java
@Test
void submitLeave_shouldCreatePendingRecord() {
    var result = oaDataService.createForm("LEAVE", "张晓宁", "综合管理部", data, "");
    assertEquals("PENDING", result.status());
}

@Test
void approveForm_shouldTransitionToApproved() {
    var approved = oaDataService.approveForm(1L, "APPROVE", "王建国", "PROJECT_MANAGER", "同意");
    assertTrue(approved.isPresent());
    assertEquals("APPROVED", approved.get().status());
}
```

### 2.2 前端单元测试（Vitest + Vue Test Utils）

**覆盖目标**：组件渲染、状态变化、权限过滤、配置解析

| 组件/模块 | 测试文件 | 关键断言 |
|---|---|---|
| 登录页 | `LoginPage.spec.ts` | 输入账号密码后调用 `/auth/login`、错误时显示提示 |
| 工作台 | `WorkbenchPage.spec.ts` | 按角色渲染不同入口卡片、待办数字正确显示 |
| 表单中心 | `FormsPage.spec.ts` | 拉取 `formType` 配置后渲染对应字段、提交后跳转历史 |
| 权限过滤 | `permissionUtils.spec.ts` | OFFICE 角色过滤施工日志/工伤补偿、LABOR 角色显示 |

**示例**：权限过滤
```typescript
import { filterMenuByRole } from '@/utils/permission'

test('OFFICE should not see injury and log menus', () => {
  const menus = filterMenuByRole(allMenus, 'EMPLOYEE', 'OFFICE')
  expect(menus.some(m => m.code === 'injury')).toBe(false)
  expect(menus.some(m => m.code === 'log')).toBe(false)
})
```

## 3. 集成测试

### 3.1 API 集成测试（Spring Boot Test + @AutoConfigureMockMvc）

**覆盖目标**：HTTP 接口的认证、参数校验、权限控制、数据库状态变更

| 接口 | 场景 | 期望 |
|---|---|---|
| `POST /auth/login` | 正确账号密码 | 200 + JWT Token |
| `POST /auth/login` | 错误密码 | 401 |
| `GET /forms/todo` | 项目经理访问 | 仅返回 PENDING 状态单据 |
| `GET /forms/todo` | CEO 访问 | 仅返回 APPROVING 状态单据 |
| `POST /forms/injury` | 劳工发起 | 201 + PENDING |
| `POST /forms/injury` | 普通员工发起 | 403 |
| `POST /payroll/cycles/{id}/settle` | 财务执行 | 200 + 周期锁定 |
| `POST /payroll/cycles/{id}/settle` | CEO 执行 | 403 |
| `GET /payroll/slips` | 员工访问 | 仅返回本人工资单 |
| `GET /payroll/slips` | 财务访问 | 返回全部工资单 |

**示例**：权限隔离
```java
@Test
@WithMockUser(username = "employee.demo", authorities = "ROLE_EMPLOYEE")
void employeeCannotAccessFinanceEndpoints() throws Exception {
    mockMvc.perform(post("/payroll/cycles/1/settle"))
           .andExpect(status().isForbidden());
}
```

### 3.2 数据库一致性测试

- 审批通过后，`form_record` 状态为 APPROVED，且生成一条 `approval_record`
- 正式结算后，`payroll_cycle` 的 `locked = true`，且生成对应员工的 `payroll_slip`
- 工资条确认后，`payroll_confirmation` 表新增记录（含 IP、时间、设备信息）

## 4. 系统/E2E 测试（按角色全流程）

### 4.1 测试设计原则
- 每个角色至少覆盖一条完整业务主线
- 使用测试账号在真实浏览器/小程序环境中执行
- 关键断言：页面跳转、状态变化、数据可见性

### 4.2 员工流程（employee.demo）

| 步骤 | 操作 | 期望结果 |
|---|---|---|
| 1 | 登录 Web 端 | 进入工作台，可见请假、加班、工资条入口 |
| 2 | 发起请假申请 | 填写类型、起止时间、天数、原因，提交成功 |
| 3 | 查看历史记录 | 列表中出现刚提交的请假单，状态为"待初审" |
| 4 | 查看工资条 | 仅能看到自己的工资条，状态为"待确认" |
| 5 | 确认工资条 | 确认成功，状态变为"已确认" |

### 4.3 劳工流程（worker.demo）

| 步骤 | 操作 | 期望结果 |
|---|---|---|
| 1 | 登录小程序 | 工作台可见施工日志、工伤补偿入口 |
| 2 | 提交施工日志 | 选择项目、天气、填写工作内容，提交成功 |
| 3 | 发起工伤补偿 | 填写日期、地点、费用、补偿金额，提交成功 |
| 4 | 查看待办 | 无审批权限，待办为空 |

### 4.4 项目经理流程（pm.demo）

| 步骤 | 操作 | 期望结果 |
|---|---|---|
| 1 | 登录 Web 端 | 工作台可见审批入口 |
| 2 | 进入待办 | 列表显示员工/劳工提交的 PENDING 单据 |
| 3 | 初审通过请假单 | 单据状态变为"待终审"，待办中消失 |
| 4 | 初审驳回加班单 | 单据状态变为"已驳回"，申请人可重新发起 |
| 5 | 审批施工日志 | 通过后状态变为"已通过"并自动归档 |

### 4.5 CEO 流程（ceo.demo）

| 步骤 | 操作 | 期望结果 |
|---|---|---|
| 1 | 登录 Web 端 | 工作台可见全部管理入口 |
| 2 | 进入待办 | 列表显示项目经理初审通过的 APPROVING 单据 |
| 3 | 终审通过 | 单据状态变为"已通过"并自动归档 |
| 4 | 查看经营总览 | 页面展示项目、人员、薪资汇总数据 |
| 5 | 配置角色权限 | 新增角色并分配菜单权限，即时生效 |

### 4.6 财务流程（finance.demo）

| 步骤 | 操作 | 期望结果 |
|---|---|---|
| 1 | 登录 Web 端 | 工作台可见薪资、通讯录导入入口 |
| 2 | 执行预结算 | 选择周期，系统校验通过，生成试算结果 |
| 3 | 执行正式结算 | 周期锁定，员工端工资条状态变为"待确认" |
| 4 | 处理工资异议 | 查看异议详情，发起更正申请 |
| 5 | 重新结算 | CEO 审批解锁后，执行重新结算，生成新版本工资单 |
| 6 | 通讯录导入 | 上传企业微信通讯录，预览后确认导入，员工档案更新 |

## 5. 测试数据管理

### 5.1 固定测试数据
- 使用 `docs/test-accounts.md` 中的 5 个固定账号
- 每个账号对应固定的部门、员工类型、角色，确保测试可重复

### 5.2 动态测试数据
- 单元测试使用 `@DataJpaTest` + H2 / Testcontainers 的隔离数据库
- 集成测试使用 `src/test/resources/data.sql` 初始化基础数据
- E2E 测试在每次执行前重置测试环境（清理业务数据，保留账号数据）

### 5.3 边界数据

| 场景 | 输入 | 期望 |
|---|---|---|
| 请假天数为 0 | days = 0 | 校验失败，提示天数必须大于 0 |
| 加班时长超过 24 小时 | hours = 25 | 校验失败 |
| 工伤补偿金额为负 | compensation = -100 | 校验失败 |
| 空附件上传 | 未选择文件直接提交 | 若字段非必填则通过，必填则失败 |

## 6. 测试环境与执行

### 6.1 本地开发环境
```bash
cd app
yarn test:web              # 前端单元测试
yarn --cwd frontend type-check  # 前端类型检查
yarn test:api              # API 脚本测试
cd backend && mvn test     # 后端单元+集成测试
```

### 6.2 CI 环境
- 每次 PR 触发：`mvn test` + `yarn test:web` + `yarn type-check`
- 每日构建触发：全量 API 测试 + E2E 核心流程

## 7. 缺陷管理

### 7.1 缺陷分级

| 级别 | 定义 | 示例 |
|---|---|---|
| P0-Critical | 阻塞主流程，系统不可用 | 登录失败、结算导致数据错误 |
| P1-High | 核心功能异常，有 workaround | 审批通过后未归档、工资条显示错误 |
| P2-Medium | 一般功能异常 | 筛选条件失效、页面样式错位 |
| P3-Low | 轻微问题 | 文案错误、日志警告 |

### 7.2 缺陷记录格式
```markdown
| 测试项 | 期望结果 | 实际结果 | 修复状态 |
|---|---|---|---|
```

### 7.3 回归要求
- P0/P1 缺陷修复后，必须补充对应自动化测试用例
- 每次发版前执行全量回归测试套件
