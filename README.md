# 众维 OA 工作台

企业微信工作台小程序 + Web 管理后台，面向建筑与工程企业的内部办公协同系统。

## 文档

- [`documentation/biz/PROJECT.md`](documentation/biz/PROJECT.md) — 项目介绍（甲方/业务阅读）
- [`documentation/dev/ARCHITECTURE.md`](documentation/dev/ARCHITECTURE.md) — 技术架构与接口设计（开发者阅读）
- [`documentation/dev/TEST_DESIGN.md`](documentation/dev/TEST_DESIGN.md) — 测试设计文档（QA/开发者阅读）
- [`documentation/ai/AGENTS.md`](documentation/ai/AGENTS.md) — AI 开发指南（编码助手阅读）

## 快速启动

```bash
cd app
yarn install
yarn dev:web              # Web 本地调试
yarn dev:mp-weixin        # 小程序开发模式
```

## 测试

```bash
yarn test:web
yarn --cwd frontend type-check
yarn test:api
cd backend && mvn test
```

## 目录

- `app/frontend/` — uni-app + Vue 3 + Vite 前端
- `app/backend/` — Java + Spring Boot 后端
- `documentation/` — 项目文档与设计稿
- `tools/scripts/` — 脚本与工具
