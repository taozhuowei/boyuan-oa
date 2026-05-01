# 博渊 OA 平台 — 技术架构文档

## 1. 架构概述

系统采用渐进式模块化架构，核心基石模块提供系统启动所必需的能力，业务模块通过注册机制热插拔，模块间通过 core.bus 通信，禁止跨业务模块直接导入。

## 2. 包结构

后端包结构规则如下。当前代码尚在 `com.oa.backend.*` 扁平结构下，迁移将在各业务模块集成时逐步完成，以下为规划目标结构：

```
com.oa.backend
├── core/          （规划中）基石模块，系统启动必需
│   ├── auth/
│   ├── employee/
│   ├── org/
│   ├── form/
│   ├── approval/
│   ├── notification/
│   ├── file/
│   ├── config/
│   ├── setup/
│   ├── retention/
│   ├── bus/
│   ├── error/
│   ├── tracking/
│   ├── logging/
│   └── health/
├── biz/           （规划中）业务模块，热插拔
│   ├── payroll/
│   ├── attendance/
│   ├── project/
│   ├── expense/
│   └── injury/
└── shared/        （规划中）共享工具类
```

当前过渡期内，所有代码仍在扁平的 `com.oa.backend` 包下按 controller / service / entity / mapper 分层组织。迁移时以模块为单位逐步搬移，不做大规模整体重构。

## 3. 模块注册机制（设计意图）

运维人员通过修改 `modules.yml` 启停业务模块。配置属性支持 Spring `@RefreshScope` 热刷新，修改后无需全量重启即可更新属性值；但启停模块本身（涉及 Bean 加载/卸载）需要优雅重启。

示例配置：

```yaml
modules:
  payroll:
    enabled: true
  attendance:
    enabled: false
```

`enabled: false` 的模块对应的 Spring Bean 不会被加载，其路由和菜单入口在启动时同步屏蔽。

## 4. core.bus 通信规则

业务模块间通信必须通过 core.bus，不得绕过。

- 业务模块间禁止直接 import 对方的类，违反此规则将被 ArchUnit 检测拦截（迁移完成后生效）。
- 异步通知：事件类统一定义在 `core.bus.events` 包，使用 Spring `ApplicationEvent` 发布与监听，发布方不感知消费方。
- 同步查询：查询接口统一定义在 `core.bus.ports` 包，由提供方实现，消费方注入接口而非实现类，避免硬依赖。
- 命名规范：事件类名格式为 `{模块}.{动词}.{对象}`，例如 `PayrollSlipPublished`、`AttendanceRecordCreated`。

## 5. ArchUnit 约束

项目已在 `server/src/test/java/.../ArchitectureTest.java` 启用 ArchUnit 架构测试，当前生效的约束：

- Controller 层不得直接注入 Mapper，必须通过 Service 层访问数据。对应检测命令：`grep -rn "private final.*Mapper" server/src/main/java/com/oa/backend/controller/` 输出必须为空（ObjectMapper 除外）。

模块迁移完成后，将增加以下约束：

- `biz.*` 包内的类不得直接 import 其他 `biz.*` 包的类，所有跨模块通信必须经过 `core.bus`。

## 6. 数据库迁移策略

Flyway 迁移文件位于 `server/src/main/resources/db/migration/`。

- V1–V21 为历史迁移（业务与基石混合），已完成部署，保留不动，不得修改。
- V22 起为新迁移，命名格式：`V{N}__{scope}_{description}.sql`。
  - 基石模块迁移示例：`V22__core_auth_add_mfa.sql`
  - 业务模块迁移示例：`V22__biz_payroll_add_bonus_type.sql`
- 每次新建迁移前确认当前最大版本号，避免版本号冲突。
- 开发环境使用 H2，V2–V9 含 PostgreSQL 专有语法（`ON CONFLICT`、`setval`）无法在 H2 执行，由 CI 专项 job 在 PostgreSQL 容器中验证。
