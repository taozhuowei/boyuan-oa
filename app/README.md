# 应用工程

`app/` 下维护项目的前后端代码。

## 结构

```text
app/
├─ package.json
├─ yarn.lock
├─ frontend/
└─ backend/
```

## 常用命令

```bash
cd app
yarn install
yarn dev:web
yarn build:web
yarn test:web
yarn test:api
```

## 说明

- 前端为 uni-app + Vue 3 + TypeScript。
- 后端为 Spring Boot 3。
- API 测试脚本已统一迁移到 `../tools/scripts/test-api.ps1`。
