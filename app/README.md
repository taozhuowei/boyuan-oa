# 博渊 OA 前端

uni-app 跨端应用，支持 H5 和微信小程序。

## 技术栈

| 技术 | 版本 |
|------|------|
| uni-app | 3.0 |
| Vue | 3.5 |
| TypeScript | 5.4 |
| Vite | 5.2 |
| Pinia | 2.1 |

## 目录结构

```
├── h5/              # H5 端代码
├── mp/              # 小程序端代码
├── shared/          # 共享类型和工具
└── scripts/         # 脚本工具
```

## 开发命令

```bash
# 需先在根目录执行 yarn install

# 启动 H5 开发（需后端已在 8080 运行）
yarn dev:h5

# 启动小程序开发（需后端已在 8080 运行）
yarn dev:mp

# 运行单元测试
cd ../app && ../node_modules/.bin/vitest run

# 运行集成测试
cd ../app && ../node_modules/.bin/vitest run --config vitest.integration.config.ts
```

## 依赖文档

- [前端实现细节](../docs/FRONTEND_IMPL.md)
