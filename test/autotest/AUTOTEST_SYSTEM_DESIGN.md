# 自动化测试系统设计

> **文档职责**：定义博渊项目的自动化测试工具选型、目录结构、流水线、Page Object 设计、日志问题复现流程、数据隔离策略。
>
> **目标读者**：QA、测试工程师、前后端开发者。
>
> **关联文档**：测试策略与用例设计见 `../TEST_DESIGN.md`。


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
       人工验收（TEST_DESIGN §4 各角色主线）
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

步骤 2：使用 tools/log_analyzer 工具（见 ARCHITECTURE §13.6）
         → 输入 trace_id，定位出错的模块/类/方法/行号

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