# core.auth — 认证与登录

## 职责

负责员工账号的身份验证、JWT 令牌颁发与校验、图形验证码管理、登录频率限速，以及密码变更流程；密码重置（忘记密码）由 PasswordResetController 负责，手机号变更由 PhoneChangeController 负责。

## 主要功能

- 账号密码登录，颁发 Bearer JWT 令牌，响应包含员工信息、角色名称、部门名称
- 开发模式免密登录（`/auth/dev-login`），仅用于开发和集成测试环境
- 图形验证码：累计登录失败 ≥ 3 次后，后续登录必须携带 captchaId + captchaAnswer
- 阶梯式登录锁定（per-IP 与 per-账号双维度）：失败 5 次锁 1 分钟，10 次锁 5 分钟，20 次锁 15 分钟，30 次锁 60 分钟；锁定状态存内存，重启清零
- 密码变更（运营期主动修改）：已登录用户提交原密码 + 新密码，新密码规则为 6-64 位且不含空格
- 首次登录密码设置：仅限 `isDefaultPassword=true` 的已认证用户调用，新密码规则为 8-64 位含字母与数字
- 邮箱验证码辅助密码重置：向绑定邮箱发送 6 位验证码，5 分钟过期，验证通过后更新密码并清除账号锁定状态

## 对外暴露的接口

- `POST /api/auth/login` — 密码登录，返回 JWT 令牌与用户信息
- `POST /api/auth/dev-login` — 开发环境免密登录
- `GET /api/auth/me` — 获取当前登录用户基本信息（需已认证）
- `GET /api/auth/captcha` — 获取图形验证码（captchaId + imageBase64）
- `POST /api/auth/change-password` — 已登录用户主动修改密码（需已认证）
- `POST /api/auth/password/first-login-set` — 首次登录设置密码（需已认证，isDefaultPassword=true）
- `POST /api/auth/password/send-reset-code` — 向绑定邮箱发送重置验证码（需已认证）
- `POST /api/auth/password/verify-reset` — 验证邮箱验证码并更新密码（需已认证）

## 依赖

- `core.employee` — 通过 EmployeeService 验证账号状态与密码哈希，查询员工信息

## 技术债 / 待完善

- 登录锁定状态存内存（ConcurrentHashMap），服务重启后清零；生产环境应迁移至 Redis 或持久化存储
- 验证码生成库使用基础实现，未集成主流图形验证码 SDK
