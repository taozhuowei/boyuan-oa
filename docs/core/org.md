# core.org — 组织结构与部门

## 职责

管理公司的部门树、岗位体系和第二角色（并发职务）；作为基础数据层，不依赖其他业务模块，被 core.employee 和各业务模块广泛引用。

## 主要功能

- 部门 CRUD，支持父子层级关系，构成部门树
- 组织架构树查询，以树形结构返回所有部门及其员工节点
- 修改员工直系领导（CEO 专属操作，写入 employee.direct_supervisor_id）
- 岗位及岗位等级的新增、更新、查询；岗位关联部门与薪资等级范围
- 第二角色（SecondRole）绑定与查询，支持员工兼任多个职务

## 对外暴露的接口

- `GET /api/departments` — 部门列表（CEO/HR/FINANCE/PROJECT_MANAGER/DEPARTMENT_MANAGER）
- `POST /api/departments` — 创建部门（CEO/HR）
- `PUT /api/departments/{id}` — 更新部门（CEO/HR）
- `DELETE /api/departments/{id}` — 删除部门（CEO）
- `GET /api/org/tree` — 组织架构树（CEO）
- `PATCH /api/org/supervisor/{employeeId}` — 修改员工直系领导（CEO）
- `GET /api/positions` — 岗位列表（CEO/HR/FINANCE）
- `POST /api/positions` — 创建或更新岗位（CEO/HR）

## 依赖

无（系统基础数据层）

## 技术债 / 待完善

- 部门删除未检查该部门下是否有在职员工，可能导致孤儿数据
- 岗位等级与薪资档位的关联校验逻辑分散在 Service 层，缺乏统一的完整性约束
