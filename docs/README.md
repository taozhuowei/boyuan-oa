# 文档目录

本文档目录包含博渊 OA 项目的所有设计和说明文档。

## 文档清单

| 文档 | 说明 | 目标读者 |
|------|------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 系统技术架构设计，包含设计原则、系统架构图、模块解耦规范、日志系统设计 | 技术负责人、架构师、核心开发者 |
| [BACKEND_IMPL.md](./BACKEND_IMPL.md) | 后端实现细节，包含包结构、MyBatis-Plus 约定、JWT 认证、权限 AOP、引擎实现模式 | 后端开发者 |
| [FRONTEND_IMPL.md](./FRONTEND_IMPL.md) | 前端实现细节，包含适配层设计、useComponent、HTTP 层、CSS 变量规范 | 前端开发者 |
| [TODO.md](./TODO.md) | **唯一开发进度管理入口**，按 M0-M12 模块顺序列出的任务和检查点 | 所有开发者 |
| [CONTEXT.md](./CONTEXT.md) | AI 上下文摘要，记录项目定位、当前状态、核心设计决策和关键文件位置 | AI 助手、新加入的开发者 |
| [DESIGN.md](./DESIGN.md) | 完整业务设计文档，包含角色/权限/审批流/薪资规则/数据保留规则（建筑工程版） | 产品经理、甲方客户、开发者 |
| [BUSINESS_REPORT_PRICING_ANALYSIS.md](./BUSINESS_REPORT_PRICING_ANALYSIS.md) | 博渊 OA 平台市场价值与定价分析报告 | 商务、管理层 |

## 快速导航

### 新成员入职
1. 先读 [CONTEXT.md](./CONTEXT.md) 了解项目概况
2. 查看 [TODO.md](./TODO.md) 确认当前进度
3. 根据角色深入 [ARCHITECTURE.md](./ARCHITECTURE.md) 或具体实现文档

### 开发任务
- 查看当前任务：[TODO.md](./TODO.md)
- 技术方案决策：[ARCHITECTURE.md](./ARCHITECTURE.md)
- 业务规则确认：[DESIGN.md](./DESIGN.md)

### AI 协作
AI 接手项目时，阅读顺序：
1. [CONTEXT.md](./CONTEXT.md) - 获取项目上下文
2. [TODO.md](./TODO.md) - 确认开发进度
3. 按需深入具体实现文档
