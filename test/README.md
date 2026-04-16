# 博渊 OA 测试套件

测试代码和工具集合。

## 测试代码位置

| 类型 | 位置 | 运行方式 |
|------|------|----------|
| H5 前端单元测试 | `app/h5/test/` | `yarn workspace oa-h5 test` |
| MP 单元测试 | `app/mp/test/` | `yarn workspace oa-mp test` |
| Shared utils 单元测试 | `test/unit/shared/` | `yarn vitest run test/unit/shared` |
| 后端单元测试 | `server/src/test/` | `cd server && mvn test` |
| API 集成测试 | `test/integration/` | `yarn vitest run --config vitest.integration.config.ts` |

## 一键运行

运行所有前端测试：

```bash
yarn test
```

> 注：`yarn test` 默认运行 H5 单元测试。

## 测试报告

| 类型 | 报告位置 |
|------|----------|
| 后端单元测试 | `server/target/surefire-reports/` |
| 后端覆盖率 | `server/target/site/jacoco/index.html` |

## 依赖文档

- [测试策略设计](./TEST_DESIGN.md)
