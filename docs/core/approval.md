# core.approval — 审批流引擎

## 职责

定义和驱动各业务类型的审批流，支持多节点串行审批；审批流配置（审批人类型、跳过条件）由 CEO 在系统配置页面维护，运行时由 FormService/ApprovalFlowService 驱动节点推进。

## 主要功能

- 审批流定义 CRUD：按 businessType（LEAVE/OVERTIME/EXPENSE 等）创建和查询审批流定义（ApprovalFlowDef）
- 节点配置：每条流定义包含有序节点列表，节点支持 DIRECT_SUPERVISOR（直系上级）、ROLE（指定角色）、DESIGNATED（指定员工）三种审批人类型，以及 skipCondition 跳过条件（JSON）
- 节点全量替换：PUT 操作以软删除旧节点 + 创建新节点列表的方式原子更新审批流配置
- 节点推进：advance() 方法接收表单 ID、操作人 ID 与动作（APPROVE/REJECT），更新节点状态并触发通知

## 对外暴露的接口

- `GET /api/approval/flows` — 查询所有审批流定义及其节点（CEO）
- `GET /api/approval/flows/{businessType}` — 查询指定业务类型的审批流（CEO）
- `PUT /api/approval/flows/{businessType}` — 更新审批流节点配置（CEO，全量替换）

## 依赖

- `core.notification` — advance() 推进节点时，向下一节点的审批人发送系统内通知

## 技术债 / 待完善

- skipCondition 字段为 nullable JSON 字符串，格式未定义 schema，运行时解析出错会导致节点无法正确跳过
- 并行审批节点（会签）未实现，当前仅支持串行流程
- 审批流定义被删除或修改后，进行中的流程记录不受影响，存在历史快照与当前配置不一致的风险
