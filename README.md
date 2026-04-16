# 博渊 OA 工作台

面向中小型建筑施工企业的内部办公协同系统，包含 H5 管理后台和微信小程序端。

## 核心架构

```
┌─────────────┐    ┌─────────────┐
│  小程序端    │    │   H5 端     │
│  (uni-app)  │    │  (Nuxt 3)   │
└──────┬──────┘    └──────┬──────┘
       │                  │
       └────────┬─────────┘
                │ HTTP / REST
                ▼
       ┌─────────────────┐
       │  Spring Boot    │
       │  PostgreSQL     │
       └─────────────────┘
```

## 目录结构

| 目录 | 说明 |
|------|------|
| [app/h5/](./app/h5/) | H5 前端（Nuxt 3 + Ant Design Vue） |
| [app/mp/](./app/mp/) | 小程序前端（uni-app） |
| [app/shared/](./app/shared/) | 前端共享类型和工具 |
| [server/](./server/) | 后端服务（Spring Boot + MyBatis-Plus） |
| [test/](./test/) | 测试设计文档和集成测试 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 系统架构设计 |
| [DESIGN.md](./DESIGN.md) | 产品设计与业务文档 |
| [TODO.md](./TODO.md) | 项目 Roadmap 与待办事项 |

## 快速开始

```bash
# 后端
cd server && mvn spring-boot:run

# H5 前端
cd app/h5 && npm run dev

# 小程序
cd app/mp && npm run dev
```

## 运行测试

```bash
# 后端单元测试 + 集成测试
cd server && mvn test

# H5 前端单元测试
cd app/h5 && npm run test

# 小程序单元测试
cd app/mp && npm run test
```

---

## 部署

> 部署方案待 Phase D 启动后设计，详见 [TODO.md](./TODO.md) Phase D。

---

## 声明

- 本项目为私有项目，未经授权不得使用
- 详见 [docs/](./docs/) 目录下的架构设计和业务文档
