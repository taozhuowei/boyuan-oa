# core.employee — 员工与用户身份

## 职责

员工档案是系统唯一的用户身份来源；认证模块通过员工工号与密码哈希验证身份，所有业务模块通过员工 ID 关联操作人。该模块负责员工档案的完整生命周期管理，包括组织归属、账号状态与薪资覆盖参数。

## 主要功能

- 员工列表查询（分页，支持关键字/角色/状态/部门过滤），响应按调用者角色脱敏（身份证号仅本人、CEO、HR 可见）
- 员工详情查询，包含角色名称、部门名称、紧急联系人列表
- 员工创建（CEO/HR 权限），支持设置基础薪资覆盖、绩效系数、合同类型等扩展字段
- 员工信息更新（CEO/HR 权限），变更记录写入操作日志
- 员工账号禁用（CEO 权限，软删除策略，状态置为 DISABLED）
- 员工账号密码重置（CEO 权限，重置为初始密码 123456，标记 isDefaultPassword=true）

## 对外暴露的接口

- `GET /api/employees` — 员工列表（CEO/HR/FINANCE/PROJECT_MANAGER/DEPARTMENT_MANAGER）
- `GET /api/employees/{id}` — 员工详情（CEO/HR/FINANCE/PROJECT_MANAGER/DEPARTMENT_MANAGER）
- `POST /api/employees` — 创建员工（CEO/HR）
- `PUT /api/employees/{id}` — 更新员工（CEO/HR）
- `DELETE /api/employees/{id}` — 删除员工（CEO，逻辑删除）
- `PATCH /api/employees/{id}/status` — 禁用账号（CEO）
- `POST /api/employees/{id}/reset-password` — 重置密码（CEO）

## 依赖

- `core.org` — 查询部门名称与岗位信息，填充响应 DTO 的 departmentName 字段

## 技术债 / 待完善

- 账号启用（ACTIVE）功能已按 D-F-21 设计移除，仅保留禁用操作；如需重新启用须由 CEO 重建账号
- 员工软删除后未清理关联的审批流节点配置（approverRef 指向已删除员工 ID 时不自动更新）
