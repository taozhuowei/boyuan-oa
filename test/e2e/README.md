# test/e2e — 全链路 E2E 测试

## 目录结构

```text
test/e2e/
├── README.md              # 本文件：目录说明
├── TEST_DESIGN.md         # 测试用例设计（角色、步骤、期望结果、DB 断言）
├── playwright.config.ts   # Playwright 配置
├── fixtures/
│   ├── auth.ts            # 登录态 fixture（storageState 按角色缓存）
│   └── reset.ts           # 数据重置 fixture（POST /api/dev/reset）
├── pages/                 # Page Object Model
│   ├── LoginPage.ts
│   ├── WorkbenchPage.ts
│   ├── FormsPage.ts
│   └── ApprovalPage.ts
└── specs/                 # 测试用例（编号对应 TEST_DESIGN.md）
    ├── e2e_01_employee.spec.ts
    ├── e2e_02_worker.spec.ts
    ├── e2e_03_dept_manager.spec.ts
    ├── e2e_04_pm.spec.ts
    ├── e2e_05_finance.spec.ts
    ├── e2e_06_ceo.spec.ts
    ├── e2e_07_hr.spec.ts
    └── e2e_08_setup_wizard.spec.ts
```

## 运行

```bash
# 前置：dev profile 后端已启动（:8080）、H5 dev server 已启动（:3000）
# 重置业务数据
curl -X POST http://localhost:8080/api/dev/reset

# 运行全部 E2E
npx playwright test --config test/e2e/playwright.config.ts

# 运行单个主线
npx playwright test --config test/e2e/playwright.config.ts e2e_01

# 查看测试报告
npx playwright show-report test/e2e/playwright-report
```

## 测试账号

来自 `local/seed-data.sql`（gitignored，本地开发手动执行一次）。

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| `ceo.demo` | 123456 | ceo |
| `hr.demo` | 123456 | hr |
| `finance.demo` | 123456 | finance |
| `pm.demo` | 123456 | project_manager |
| `employee.demo` | 123456 | employee |
| `worker.demo` | 123456 | worker |

## 测试用例设计

见 [TEST_DESIGN.md](TEST_DESIGN.md)。
