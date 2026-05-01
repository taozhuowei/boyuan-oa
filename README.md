# 博渊 OA 系统

博渊OA系统是面向定制化开发的企业办公自动化平台，由 Web 端、小程序端、后端服务组成。

- 后端：Spring Boot 3 + MyBatis-Plus
- Web 端：Nuxt 3 + Ant Design Vue 4
- 小程序端：uni-app + Vant 4

## 文档目录

### 架构文档

- [ARCHITECTURE.md](./ARCHITECTURE.md) — 系统架构、模块设计、通信规则、数据库迁移策略

### 基石模块文档

- [core.auth](./docs/core/auth.md) — 认证与授权
- [core.employee](./docs/core/employee.md) — 员工管理
- [core.org](./docs/core/org.md) — 组织架构
- [core.form](./docs/core/form.md) — 表单引擎
- [core.approval](./docs/core/approval.md) — 审批流引擎
- [core.notification](./docs/core/notification.md) — 通知系统
- [core.file](./docs/core/file.md) — 文件存储
- [core.config](./docs/core/config.md) — 系统配置
- [core.setup](./docs/core/setup.md) — 初始化向导
- [core.retention](./docs/core/retention.md) — 数据保留策略
- [core.bus](./docs/core/bus.md) — 模块间通信总线
- [core.error](./docs/core/error.md) — 统一错误处理
- [core.tracking](./docs/core/tracking.md) — 操作追踪
- [core.logging](./docs/core/logging.md) — 审计日志
- [core.health](./docs/core/health.md) — 健康检查与监控

### 业务模块文档（待集成）

- [payroll](./docs/modules/payroll.md) — 薪资管理（待集成）
- [attendance](./docs/modules/attendance.md) — 考勤管理（待集成）
- [project](./docs/modules/project.md) — 项目管理（待集成）
- [expense](./docs/modules/expense.md) — 报销管理（待集成）
- [injury](./docs/modules/injury.md) — 工伤管理（待集成）

### 前端文档

- [前端设计规范](./app/README.md) — 跨端规范、共享类型、约定
- [Web 端组件规范](./app/h5/README.md) — Nuxt 3 组件开发规范
- [小程序端组件规范](./app/mp/README.md) — uni-app 组件开发规范

## 快速启动

```bash
# 后端
cd server && mvn spring-boot:run

# Web 前端
cd app/h5 && yarn dev

# 运行测试
cd server && mvn test
```
