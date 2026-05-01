# core.logging — 结构化日志

## 职责

统一应用日志格式，支持按请求链路追踪日志；当前已完成基础 Logback 配置，结构化输出和 MDC 请求 ID 注入为待完善项。

## 主要功能（设计意图）

- 基础 Logback 配置：各 Service/Controller 通过 Lombok @Slf4j 注解获取 Logger，日志级别在 application.yml 中按包路径配置
- 结构化日志输出（待完善）：将日志格式从文本行改为 JSON 结构（含 timestamp/level/logger/message/requestId 字段），便于 ELK/Loki 等日志收集平台解析
- MDC 请求 ID 注入（待完善）：在 Filter 层为每个 HTTP 请求生成 requestId 并写入 MDC，使同一请求的所有日志可通过 requestId 关联追踪
- CallerData 定位（待完善）：在 JSON 输出中记录 class/method/line，快速定位问题代码行

## 对外暴露的接口

无（横切关注点，不暴露 HTTP 路由）

## 依赖

无

## 技术债 / 待完善

- JSON 结构化日志格式尚未实现，当前为普通文本输出
- MDC requestId 注入过滤器未创建，跨日志行的请求链路关联依赖手动排查
- 日志文件轮转策略（保留天数、压缩）未在配置中显式声明
