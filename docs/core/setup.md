# core.setup — 初始化向导

## 职责

控制系统首次部署时的初始化流程，包括创建 CEO/HR 初始账号、写入公司基础配置、完成向导终态提交；提供 CEO 密码恢复机制（恢复码重置）。该模块的所有接口为公开端点（无需认证），但通过状态检查和 token 校验防止重复初始化。

## 主要功能

- 初始化状态查询：返回 initialized（step 1-4 是否完成）和 wizardFinalizeCompleted（step 5-10 是否完成）两个标志，供前端决定是否跳转初始化向导
- 系统初始化（POST /setup/init）：创建 CEO、HR 账号（及可选的运营总监、总经理账号），返回一次性 recoveryCode 和 wizardFinalizeToken；系统已初始化后调用返回 403
- 向导终态提交（POST /setup/finalize）：以 wizardFinalizeToken 鉴权，原子写入 step 5-10 的业务初始数据（如部门、审批流配置），幂等保护（已完成返回 409）
- CEO 密码重置（POST /setup/reset-ceo-password）：使用初始化时生成的 recoveryCode 重置 CEO 密码，重置成功后轮换恢复码并清零 CEO 账号的登录失败计数

## 对外暴露的接口

- `GET /api/setup/status` — 初始化状态查询（公开）
- `POST /api/setup/init` — 执行系统初始化（公开，仅未初始化时有效）
- `POST /api/setup/finalize` — 提交向导终态（公开，需 wizardFinalizeToken）
- `POST /api/setup/reset-ceo-password` — 恢复码重置 CEO 密码（公开，需有效 recoveryCode）

## 依赖

- `core.employee` — 初始化时通过 EmployeeService 创建 CEO/HR 账号
- `core.org` — 写入初始部门数据
- `core.config` — 写入公司名称等全局配置
- `core.approval` — 写入默认审批流定义

## 技术债 / 待完善

- wizardFinalizeToken 明文存储于数据库，比对时使用 SHA-256 哈希；若数据库泄露，原文 token 也暴露（token 为一次性使用，风险窗口有限）
- recoveryCode 仅在响应中返回一次，若用户未保存则无法找回，应在前端强制展示保存确认
