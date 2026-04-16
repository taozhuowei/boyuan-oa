# 博渊 OA — 集成与系统测试

测试代码、策略与系统级用例设计文档。

## 测试代码位置

| 类型 | 位置 | 运行方式 |
|------|------|----------|
| H5 前端单元测试 | `app/h5/test/` | `yarn workspace oa-h5 test` |
| MP 单元测试 | `app/mp/test/` | `yarn workspace oa-mp test` |
| Shared utils 单元测试 | `app/shared/test/` | `cd app/shared && yarn vitest run` |
| 后端单元测试 | `server/src/test/` | `cd server && mvn test` |
| API 集成测试 | `test/integration/` | `yarn vitest run --config vitest.integration.config.ts` |

## 1. 测试策略

| 测试层级 | 目标 | 工具 | 执行时机 |
| --- | --- | --- | --- |
| 单元测试 | 验证单个 Service/工具类的纯逻辑 | JUnit 5 + Mockito（后端）/ Vitest（前端） | 每次提交前 |
| 集成测试 | 验证 Controller + Service + DB 接口契约 | Spring Boot Test + H2 / Testcontainers | 每日构建 |
| 系统/E2E 测试 | 验证完整业务路径（按角色视角，含数据库状态） | 待选型 | 阶段提测前 |
| 回归测试 | 防止新改动破坏已有功能 | 待选型 | 每次发版前 |

**覆盖率要求**：后端 Service 层 ≥ 80%；算薪引擎 / 审批流引擎 / 签名存证核心路径 100%。

> **E2E 用例**：系统/E2E 层测试框架与用例尚未落地；以下第 4 章「系统/E2E 测试」仅保留业务场景设计作为后续实现参考。

---

## 4. 系统/E2E 测试（按角色全流程）

### 4.1 测试原则

- 每个角色覆盖**至少一条核心主线**，主线需验证数据库最终状态，不仅是页面反馈
- 测试账号来自 `app/backend/src/main/resources/db/data.sql`（dev profile）
- E2E 执行前通过 `POST /test/reset` 重置业务数据（保留账号/配置）

### 4.2 员工主线（employee.demo）

| 步骤 | 操作             | 期望结果                                        | DB 断言                               |
|-----|------------------|-------------------------------------------------|--------------------------------------|
| 1   | 登录 Web 端       | 进入工作台，可见请假/加班入口，无施工日志/工伤入口   | `sys_user.last_login_at` 已更新        |
| 2   | 发起请假申请       | 提交成功，列表状态"待初审"                         | `form_record.status = PENDING`        |
| 3   | 查看待确认工资条   | 仅显示本人工资单，状态"待确认"                     | `payroll_slip.employee_id = 本人 id`  |
| 4   | 完成电子签名绑定   | 绑定成功，工作台签名状态变为已绑定                  | `employee_signature` 新增记录          |
| 5   | 确认工资条         | 成功，存证 PDF 生成，状态"已确认"                  | `payroll_confirmation` 新增；PDF 落盘  |
| 6   | 忘记密码流程       | 4步完成，新密码可登录，旧密码不可用                 | `sys_user.password_hash` 已更新        |
| 7   | 修改手机号         | 3步弹窗完成，个人档案脱敏显示新号码                 | `sys_user.phone` 已更新                |

### 4.3 劳工主线（worker.demo）

| 步骤 | 操作               | 期望结果                                            | DB 断言                                    |
|-----|--------------------|-----------------------------------------------------|-------------------------------------------|
| 1   | 登录小程序          | 工作台可见施工日志/工伤入口，无薪资管理入口              | —                                         |
| 2   | 提交施工日志         | 填写项目/天气/工作内容，提交成功，列表出现新记录          | `construction_log_summary` 新增            |
| 3   | 发起工伤补偿         | 填写基本信息（无补偿金额字段），提交成功，状态"待初审"     | `injury_claim` 新增；`form_record.status = PENDING` |
| 4   | 查看待办            | 无审批权限，待办为空                                  | —                                         |
| 5   | 确认工资条           | 小程序内签名并确认，成功后状态"已确认"                  | `payroll_confirmation` 新增；PDF 落盘       |

### 4.4 项目经理主线（pm.demo）

| 步骤 | 操作                       | 期望结果                                        | DB 断言                                           |
|-----|----------------------------|------------------------------------------------|--------------------------------------------------|
| 1   | 查看待办                    | 显示员工/劳工提交的 PENDING 单据                  | —                                                |
| 2   | 初审通过请假单               | 状态变"待终审"，从待办消失                         | `form_record.status = APPROVING`                 |
| 3   | 初审驳回加班单               | 状态变"已驳回"，申请人可重新发起                    | `form_record.status = REJECTED`                  |
| 4   | 审批施工日志                 | 通过后归档                                       | `construction_log_summary.status = APPROVED`     |
| 5   | **发起工伤补偿（关键路径）** | PM 本人提交工伤，初审节点自动 SKIPPED，直接进 CEO 终审 | 第一审批节点 `status = SKIPPED`；第二节点 `status = PENDING` |

### 4.5 CEO 主线（ceo.demo）

| 步骤 | 操作               | 期望结果                                                  | DB 断言                                     |
|-----|--------------------|---------------------------------------------------------|---------------------------------------------|
| 1   | 查看待办            | 显示初审通过（APPROVING）的单据                             | —                                           |
| 2   | 终审通过请假单       | 状态"已通过"，员工可查看归档记录                             | `form_record.status = APPROVED`             |
| 3   | 配置角色权限         | 新增角色并分配权限码，重新登录即时生效                        | `sys_role` + `permission` 新增记录           |
| 4   | 查看工资确认协议     | 可上传/预览协议文件                                        | `salary_confirmation_agreement` 新增版本     |
| 5   | 查看到期提醒         | 显示 30 天内到期的数据保留提醒                               | `retention_reminder` 有记录                  |
| 6   | 选择"导出后删除"     | 异步导出任务创建，72 小时内可下载链接                        | `export_backup_task.status = PENDING→DONE`  |
| 7   | 审批薪资更正         | 解锁周期后财务可重新结算                                    | `payroll_cycle.locked = false`              |

### 4.6 财务主线（finance.demo）

| 步骤 | 操作                | 期望结果                                              | DB 断言                                          |
|-----|---------------------|-----------------------------------------------------|--------------------------------------------------|
| 1   | 查看窗口期状态       | 显示当前周期窗口期剩余时间，各员工数据完整状态              | `payroll_cycle.window_status = OPEN`             |
| 2   | 预结算检查           | 2 项强制检查全通过，"发起结算"激活；无"例外申请"按钮        | —                                                |
| 3   | 执行正式结算         | 周期锁定，员工端工资条"待确认"                           | `payroll_cycle.locked = true`；工资条生成         |
| 4   | 录入工伤理赔金额     | 对已归档工伤记录录入金额，可关联到当前薪资周期             | `injury_claim.compensation_amount` 已更新         |
| 5   | 发起薪资更正         | 申请 CEO 审批解锁                                     | 审批记录 `status = PENDING`（等待 CEO）           |
| 6   | 重新结算             | CEO 审批后版本递增（v1→v2），历史版本保留               | `payroll_slip.version = 2`；旧版本 `status = SUPERSEDED` |

### 4.7 Sysadmin 主线（初始化 + Admin 控制台）

| 步骤 | 操作                     | 期望结果                                                  | DB 断言                                    |
|-----|--------------------------|----------------------------------------------------------|--------------------------------------------|
| 1   | 初次登录，进入初始化向导   | 5步向导全部展示，无法跳过                                   | —                                          |
| 2   | Step 1：填写公司信息       | 公司名称/Logo 上传成功，`company_info done=true`            | `sys_config.company.name` 写入              |
| 3   | Step 2：创建初始账号       | 系统自动生成员工号，初始密码 123456，`init_accounts done=true` | `sys_user` + `employee` 新增；可用密码登录  |
| 4   | Step 5：确认数据保留策略   | 展示所有类型默认1年（只读），`wizard_done done=true`         | `sys_retention_policy` 有全部类型记录       |
| 5   | 进入 Admin 控制台         | 4个 Tab 可见：系统状态/集成配置/用户反馈/系统日志            | —                                          |
| 6   | 查看用户反馈              | 显示所有角色提交的 feedback，可标记已解决                   | `feedback.status = RESOLVED` 更新          |
| 7   | 再次访问向导              | 重定向到 Admin 控制台（向导不可重入）                        | —                                          |

---

## 5. 关键边界与异常路径

### 5.1 认证安全

| 场景                        | 输入                            | 期望                              |
|----------------------------|---------------------------------|----------------------------------|
| JWT 过期                    | 过期 Token 请求任意接口           | 401；前端自动跳转登录页            |
| resetToken 过期             | 超过 10 分钟调用 reset-password  | 401                               |
| 重复发送验证码               | 60 秒内再次发送                  | 429 Too Many Requests            |
| 新手机号已被其他账号绑定      | PUT /employees/me/phone          | 409 Conflict                     |
| identityToken 使用后再次使用 | 复用已消费的 identityToken       | 401                               |

### 5.2 薪资边界

| 场景                        | 输入                            | 期望                              |
|----------------------------|---------------------------------|----------------------------------|
| 有 PENDING_REVIEW 异议单    | 发起结算                         | 400；返回未解决异议单数量           |
| 窗口期提前关闭               | 调用 closeWindow()              | 编译期不存在此方法（无此接口）       |
| PayrollItemDef description  | 自定义费目含说明字段              | 工资条明细行展示 description 文本   |
| 工资条旧版本                 | 1年后到期                        | 物理删除；`payroll_slip.version=1` 记录消失 |

### 5.3 数据保留

| 场景                        | 期望                              |
|----------------------------|---------------------------------|
| 任意数据类型 retentionYears = -1 | 数据库约束/应用层校验拒绝（无永久类型） |
| operation_log 到期          | 物理删除（无逻辑删除字段）           |
| 清理任务失败 N 天后（N≥3）    | SmsService 触发短信提醒（P3，NoOp 阶段打日志） |

### 5.4 表单输入校验

| 场景              | 输入           | 期望                       |
|-----------------|---------------|---------------------------|
| 请假天数为 0      | days = 0      | 400；提示天数必须大于 0      |
| 加班时长超过 24h   | hours = 25    | 400                        |
| 工伤金额字段      | 提交时含 amount | 忽略（Finance 事后录入）     |
| 空附件（必填）    | 未选文件提交    | 400                        |

---

## 6. 测试数据管理

### 6.1 固定测试账号（dev profile）

账号数据来自 `app/backend/src/main/resources/db/data.sql`（仅 H2 dev profile 加载，不进生产）：

| 账号           | 角色          | 员工类型 | 用途              |
|--------------|---------------|---------|------------------|
| employee.demo | employee      | OFFICE  | 普通员工主线测试   |
| worker.demo   | worker        | LABOR   | 劳工主线测试       |
| pm.demo       | project_manager | OFFICE | 审批/PM主线测试   |
| ceo.demo      | ceo           | OFFICE  | CEO 管理/终审测试  |
| finance.demo  | finance       | OFFICE  | 薪资结算测试       |

> dev 环境默认密码 `123456`（bcrypt 哈希存储）。

### 6.2 隔离策略

- **单元测试**：Mockito 完全 Mock 依赖，无 DB 访问
- **集成测试**：`@Transactional` 每个用例后回滚；或使用 `@DirtiesContext` + H2 重置
- **E2E 测试**：每次执行前调用 `POST /test/reset`，清理业务数据（保留账号/配置/预置数据）

---

## 7. 测试执行命令

```bash
# 后端单元 + 集成测试（覆盖率报告）
cd app/backend && mvn test jacoco:report

# 前端单元测试
cd app/frontend && npm run test:web

# 前端类型检查
cd app/frontend && npm run type-check

# E2E 核心链路（需先启动 dev 服务）
cd app/tests && node run-e2e.js --suite smoke
```

---

## 8. 缺陷管理

### 8.1 缺陷分级

| 级别          | 定义                       | 示例                              |
|-------------|---------------------------|----------------------------------|
| P0-Critical  | 阻塞主流程，系统不可用        | 登录失败、结算导致数据错误            |
| P1-High      | 核心功能异常，有 workaround  | 审批通过后未归档、工资条数据错误       |
| P2-Medium    | 一般功能异常                | 筛选条件失效、通知未触发              |
| P3-Low       | 轻微问题                   | 文案错误、日志警告                   |

### 8.2 P0/P1 必须补充自动化用例

修复 P0/P1 缺陷后，**必须**在对应测试类增加回归用例，防止复现。用例合并到当次 fix PR 一并提交。

### 8.3 缺陷记录格式

```markdown
| 测试项 | 期望结果 | 实际结果 | 修复状态 |
|---|---|---|---|
```

---

---

## 9. 自动化测试系统

### 9.1 自动化测试工具选型

| 层级         | 工具                              | 理由                                                          |
|------------|-----------------------------------|---------------------------------------------------------------|
| 后端单元     | JUnit 5 + Mockito                 | Spring Boot 官方推荐；Mockito 依赖隔离完善                    |
| 后端集成     | Spring Boot Test + H2 + Testcontainers | H2 用于快速 CI；Testcontainers 用于 PostgreSQL 精确验证    |
| 前端单元     | Vitest + Vue Test Utils           | 与 Vite 同生态，速度快；Vue Test Utils 是 Vue 3 官方测试库   |
| API/E2E     | REST Assured（后端）+ Playwright（前端）| REST Assured 链式 API 适合 Java 业务流测试；Playwright 多浏览器 E2E |
| 覆盖率报告   | JaCoCo（后端）+ V8 Coverage（前端）| JaCoCo 集成 Maven；V8 覆盖率内置于 Vitest                    |

**Playwright vs Cypress 选择理由：** Playwright 支持 Chromium/Firefox/WebKit 三端，原生支持 API 请求拦截（无需额外配置），并行执行能力强，适合本项目双端（H5 + 微信开发者工具模拟）测试需求。

---

### 9.2 测试目录结构

```
app/
├── backend/
│   └── src/test/java/com/oa/backend/
│       ├── unit/                    # 单元测试（不依赖 Spring 容器）
│       │   ├── engine/              # ApprovalFlowEngineTest, PayrollEngineTest
│       │   └── service/             # SignatureServiceTest, RetentionServiceTest
│       └── integration/             # 集成测试（@SpringBootTest）
│           ├── api/                 # Controller 层 HTTP 接口测试
│           └── workflow/            # 跨 Service 业务流程测试
└── tests/                           # E2E 测试（独立于前后端）
    ├── playwright.config.ts
    ├── fixtures/                    # 测试数据和环境重置
    │   └── reset.ts                 # 调用 POST /test/reset 重置业务数据
    ├── specs/                       # 测试用例文件（按角色组织）
    │   ├── employee.spec.ts
    │   ├── worker.spec.ts
    │   ├── pm.spec.ts
    │   ├── ceo.spec.ts
    │   └── finance.spec.ts
    └── pages/                       # Page Object 对象（见 §9.4）
        ├── LoginPage.ts
        ├── AttendancePage.ts
        ├── PayrollPage.ts
        └── ...
```

---

### 9.3 自动化测试流水线

```
每次提交 (git push)
  └─► 后端单元测试（mvn test -Dtest=*Unit*）         ≈ 30s
       后端快速集成测试（H2，mvn test -Ph2）           ≈ 90s
  └─► 前端类型检查（npm run type-check）              ≈ 20s
       前端单元测试（npm run test:web）               ≈ 30s

每日构建 (nightly)
  └─► 后端全量集成测试（Testcontainers + PostgreSQL） ≈ 5min
       E2E 冒烟测试（Playwright smoke suite）         ≈ 3min

发版前 (release tag)
  └─► E2E 全量测试（Playwright full suite）          ≈ 15min
       覆盖率报告生成（JaCoCo + V8）
       人工验收（§4 各角色主线）
```

---

### 9.4 Page Object 模式（E2E 可扩展性）

E2E 测试使用 Page Object 模式，将页面操作封装为复用方法，避免直接在 spec 文件中写选择器。新增业务流程只需扩展 Page Object，不修改已有用例。

```typescript
// pages/AttendancePage.ts
export class AttendancePage {
  constructor(private page: Page) {}

  async submitLeave(type: string, days: number, reason: string) {
    await this.page.click('[data-testid="leave-tab"]')
    await this.page.selectOption('[data-testid="leave-type"]', type)
    await this.page.fill('[data-testid="leave-days"]', String(days))
    await this.page.fill('[data-testid="leave-reason"]', reason)
    await this.page.click('[data-testid="submit-btn"]')
    await this.page.waitForSelector('[data-testid="status-pending"]')
  }

  async getLeaveStatus(leaveId: string): Promise<string> {
    // 复用于多个测试场景
    const cell = await this.page.$(`[data-record-id="${leaveId}"] [data-testid="status"]`)
    return cell?.textContent() ?? ''
  }
}

// specs/employee.spec.ts
test('员工提交请假单，状态为 PENDING', async ({ page }) => {
  const attendancePage = new AttendancePage(page)
  await attendancePage.submitLeave('年假', 3, '个人原因')
  // 同时断言 DB 状态（通过 API 验证）
  const resp = await page.request.get('/api/attendance/history')
  const records = await resp.json()
  expect(records.items[0].status).toBe('PENDING')
})
```

**扩展规则：**
- 新增业务页面 → 在 `tests/pages/` 新建对应 Page Object 类
- 新增角色测试场景 → 在 `tests/specs/` 新建对应 spec 文件
- 禁止在 spec 文件中直接使用 CSS 选择器，必须通过 `data-testid` 属性

---

### 9.5 基于日志的问题复现

当生产环境出现问题，可通过以下流程将日志转化为可复现的测试用例：

```
步骤 1：从服务器获取相关时间段的日志文件
         → oa-system.2026-04-07.log

步骤 2：使用 日志文件（位于服务器日志目录，格式为标准文本日志）
         → 搜索 trace_id，定位出错的模块/类/方法/行号

步骤 3：根据工具输出的调用链，提取问题场景的输入参数
         → 如：PayrollEngine.settle(cycleId=xxx) 在特定数据条件下抛出异常

步骤 4：在对应测试类中编写回归用例
         → 复现问题的数据条件作为测试 fixture
         → 断言修复后该场景不再触发异常

步骤 5：合并回归用例到 fix PR，确保以后不复现
```

**约定：** P0/P1 缺陷修复后必须补充回归用例（见 §8.2），并在 PR 描述中注明对应 trace_id。

---

### 9.6 测试数据隔离增强

**模块化测试数据：** 各模块测试数据独立初始化，避免跨模块干扰：

```java
// 考勤模块集成测试基类
@SpringBootTest
@ActiveProfiles("test")
public abstract class AttendanceIntegrationBase {
    @BeforeEach
    void setupAttendanceData() {
        // 只插入考勤测试所需的最小数据集
        testDataBuilder.createEmployee("test-emp-001", "employee")
                       .withPosition("office_worker")
                       .withSupervisor("test-pm-001");
    }

    @AfterEach
    void cleanupAttendanceData() {
        // 回滚，不影响其他模块测试
    }
}
```

**E2E 数据隔离：** 每个测试文件执行前调用 `POST /test/reset`，保留账号/配置/预置数据，清理业务数据：

```typescript
// fixtures/reset.ts
export const resetFixture = base.extend<{ reset: void }>({
  reset: [async ({ request }, use) => {
    await request.post('/api/test/reset')
    await use()
  }, { auto: true }]  // 自动在每个测试前执行
})
```

---

---

## 变更记录

| 日期        | 内容                                                                                         |
|-----------|----------------------------------------------------------------------------------------------|
| 2026-04-07 | 新增 §10 Dev 快捷工具设计：DevToolbar 双端设计、DevController、使用场景、生产构建验证清单 |
| 2026-04-07 | 新增 §9 自动化测试系统：工具选型对比（REST Assured + Playwright）；测试目录结构；流水线设计；Page Object 扩展模式；日志驱动问题复现流程；模块化测试数据隔离 |
| 2026-04-03 | 全量重写：修正 OaDataService 旧引用；新增忘记密码/修改手机号/工伤 skipCondition/签名存证/数据保留/通知/Feedback/Sysadmin 向导完整测试路径；E2E 增加 DB 断言维度；补充认证安全边界用例；修正测试数据来源（data.sql 非 docs/test-accounts.md） |
| 2026-03-31 | 初始版本：基础5角色 E2E 框架、单元测试占位用例 |
