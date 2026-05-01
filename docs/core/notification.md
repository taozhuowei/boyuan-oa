# core.notification — 通知中心

## 职责

管理系统内消息通知的发送、查询和已读状态；当前为系统内消息（站内信），不集成短信或推送渠道；由其他模块（主要是 core.approval）在业务流程节点触发调用。

## 主要功能

- 通知列表查询（分页，按创建时间降序），每位用户仅能查询自己的通知
- 单条通知标记已读，仅允许标记属于当前用户的通知
- 批量标记所有未读通知为已读
- 删除所有已读通知（清理历史记录）
- 未读通知数量查询，用于导航栏红点展示

## 对外暴露的接口

- `GET /api/notifications` — 通知列表（已认证用户，支持 page/size 分页）
- `PATCH /api/notifications/{id}/read` — 单条标记已读（已认证用户）
- `POST /api/notifications/read-all` — 批量标记已读（已认证用户）
- `DELETE /api/notifications/read` — 删除已读通知（已认证用户）
- `GET /api/notifications/unread-count` — 未读数量（已认证用户）

## 依赖

无（被其他模块依赖，自身不依赖业务模块）

## 技术债 / 待完善

- 当前不支持 WebSocket 实时推送，前端依赖轮询 /unread-count 接口感知新通知
- 通知发送为同步调用，若通知量大或接收人多，可能影响触发方（如审批推进）的响应时间，后续应改为异步
