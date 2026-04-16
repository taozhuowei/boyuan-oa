# 博渊 OA — 测试目录

## 目录结构

| 目录 | 内容 | 设计文档 |
| --- | --- | --- |
| `integration/` | API 集成测试（Vitest + 真实 HTTP） | `integration/README.md` |
| `e2e/` | 全链路 E2E 测试设计 | `e2e/README.md` |

## 其他测试位置

| 类型 | 位置 | 设计文档 |
| --- | --- | --- |
| H5 单元测试 | `app/h5/test/` | `app/h5/FRONTEND_IMPL.md §2.2` |
| Shared utils 单元测试 | `app/shared/test/` | — |
| 后端单元 + 集成测试 | `server/src/test/` | `server/README.md §测试设计` |
