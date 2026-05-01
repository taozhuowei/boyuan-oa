# core.retention — 数据保留策略

## 职责

根据预设保留策略定期扫描到期数据，生成到期提醒通知管理员，支持管理员执行导出后删除或选择忽略；所有管理操作仅限 CEO 角色。

## 主要功能

- 保留策略列表查询：返回所有未删除的策略，包含数据类型、保留年限和提前警告天数
- 到期提醒查询：返回所有状态为 PENDING 的提醒，按预计删除日期升序排列
- 忽略提醒：将指定提醒状态设为 IGNORED，该批数据不再自动清理
- 导出并删除：异步启动导出任务，将过期数据打包为 ZIP 文件后删除对应数据记录，返回 taskId 供状态查询
- 导出文件下载：凭下载令牌（UUID）获取 ZIP 文件流，令牌过期或文件不存在返回 404
- 每日定时扫描：后台任务按 data.retention.days 配置周期扫描各数据表，生成到期提醒并触发通知

## 对外暴露的接口

- `GET /api/retention/policies` — 保留策略列表（CEO）
- `GET /api/retention/reminders` — 到期提醒列表（CEO）
- `POST /api/retention/reminders/{id}/dismiss` — 忽略指定提醒（CEO）
- `POST /api/retention/reminders/{id}/export-and-delete` — 导出并删除（CEO）
- `GET /api/retention/export/{token}/download` — 下载导出 ZIP 文件（已认证用户）

## 依赖

- `core.notification` — 定时扫描发现到期数据时，向 CEO 发送系统内通知

## 技术债 / 待完善

- 导出任务为异步执行，当前无任务进度查询接口（taskId 返回后前端只能轮询或等待通知）
- 导出 ZIP 文件存储在本地 `${oa.upload-dir}/export/` 目录，不支持分布式部署场景
- 下载令牌有效期未在文档中明确；令牌过期机制依赖 RetentionService 内部实现
