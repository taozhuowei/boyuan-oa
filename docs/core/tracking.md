# core.tracking — 操作埋点

## 职责

记录系统内关键操作（操作人、时间、操作类型、目标对象），用于审计追踪和异常排查；通过 @OperationLogRecord 注解在 AOP 切面自动拦截，业务代码无需显式调用日志 API。

## 主要功能

- AOP 自动记录：OperationLogAspect 切面拦截带有 @OperationLogRecord 注解的方法，在方法执行后写入 operation_log 表，记录操作人 ID、操作类型（action）、目标类型（targetType）、目标 ID 和时间戳
- 操作日志查询：按日期范围（from/to）和分页参数查询，仅 CEO 可访问
- 已覆盖的关键操作：员工信息更新（UPDATE_EMPLOYEE）、账号禁用、签名绑定（BIND_SIGNATURE）、审批流配置变更（APPROVAL_FLOW_UPDATE）等

## 对外暴露的接口

- `GET /api/operation-logs` — 操作日志列表（CEO，支持 from/to 日期过滤与 page/size 分页）

## 依赖

- `core.employee` — 通过操作人的 username 解析对应的 employee ID，写入日志记录

## 技术债 / 待完善

- 部分高风险操作（如员工删除、密码重置）尚未添加 @OperationLogRecord 注解，存在审计盲区
- AOP 切面记录目标 ID 的逻辑依赖方法返回值或路径参数解析，对复杂参数结构支持有限
- 操作日志未设置保留策略，长期运行后数据量增长无上限
