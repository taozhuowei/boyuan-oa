# core.health — 健康检查

## 职责

提供服务存活检查接口，供 CI/CD 流水线的就绪探针和运维监控系统使用；自定义端点返回简单 JSON，Spring Boot Actuator 端点提供更详细的健康指标。

## 主要功能

- 自定义健康检查：返回 `{"status": "UP", "stage": "...", "version": "1.0.0"}`，无需认证，适合负载均衡器和 CI 就绪等待
- Spring Boot Actuator 集成：`/actuator/health` 提供标准化健康状态，包含数据库连接、磁盘空间等指示器；CI 管道同时接受 200 和 503 状态码（服务启动中部分指示器可能暂时为 DOWN）

## 对外暴露的接口

- `GET /api/health` — 自定义健康检查（公开，无需认证）
- `GET /actuator/health` — Spring Boot Actuator 标准健康检查（公开）

## 依赖

无

## 技术债 / 待完善

- stage 字段内容为硬编码字符串（"阶段三：身份、角色、权限、组织"），未随迭代更新，应移除或替换为版本信息
- Actuator 端点未限制暴露范围（`management.endpoints.web.exposure.include`），生产环境应仅暴露 health 端点，避免泄露内部指标
