# core.form — 通用表单与流转

## 职责

提供统一的表单查询、审批操作和历史记录入口，作为各业务类型单据（请假、加班、报销等）的通用处理层；表单提交入口由各业务模块自行实现，本模块聚焦待审批队列管理与审批流推进。

## 主要功能

- 待审批列表查询（GET /forms/todo）：各角色仅见自己作为审批人的待办项，员工/工人查看本人提交的待审单据
- 审批通过（POST /forms/{id}/approve）：由项目经理、CEO、财务、部门主管执行，推进审批流节点
- 审批驳回（POST /forms/{id}/reject）：同上权限，注明驳回原因
- 历史记录查询（GET /forms/history）：CEO/FINANCE 可查看所有记录，其他角色仅查看本人提交的记录；默认查询 LEAVE/OVERTIME/EXPENSE 三种类型
- 表单详情查询（GET /forms/{id}）：所有已认证角色可访问，内部校验权限

## 对外暴露的接口

- `GET /api/forms/todo` — 待审批列表（所有已认证角色）
- `POST /api/forms/{id}/approve` — 审批通过（PROJECT_MANAGER/CEO/FINANCE/DEPARTMENT_MANAGER）
- `POST /api/forms/{id}/reject` — 审批驳回（PROJECT_MANAGER/CEO/FINANCE/DEPARTMENT_MANAGER）
- `GET /api/forms/history` — 历史记录（所有已认证角色，可按 formTypes 过滤）
- `GET /api/forms/{id}` — 表单详情（所有已认证角色）

## 依赖

- `core.approval` — 通过 ApprovalFlowService.advance() 推进审批流节点
- `core.notification` — 审批流推进时向下一审批人发送通知（由 ApprovalFlowService 内部触发）

## 技术债 / 待完善

- 表单提交入口（POST /forms）分散在各业务控制器，缺乏统一的提交网关；后续业务模块集成时应考虑统一入口
- formTypes 过滤参数为字符串列表，未做枚举类型约束，非法值会静默忽略
