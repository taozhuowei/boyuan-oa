# 博渊 OA 测试套件

测试代码和工具集合。

## 测试代码位置

| 类型 | 位置 | 运行方式 |
|------|------|----------|
| 前端单元测试 | `app/mp/src/test/` | `cd app/mp && npx vitest run` |
| 后端单元测试 | `server/src/test/` | `cd server && mvn test` |
| 集成测试 | `test/integration/` | `cd app/mp && npx vitest run --config vitest.integration.config.ts` |

## 一键运行

```bash
cd test
run-all.bat     # Windows
bash run-all.sh # Unix/macOS
```

## 测试报告

| 类型 | 报告位置 |
|------|----------|
| 后端单元测试 | `server/target/surefire-reports/` |
| 后端覆盖率 | `server/target/site/jacoco/index.html` |

## 依赖文档

- [测试策略设计](./TEST_DESIGN.md)
