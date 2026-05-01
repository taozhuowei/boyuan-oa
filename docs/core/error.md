# core.error — 错误捕获与处理

## 职责

通过全局 @RestControllerAdvice 统一捕获各类异常，将其映射为标准结构化 HTTP 响应 `{"code": <HTTP 状态码>, "message": <业务语言>`，不暴露堆栈信息或框架内部字段，保证前端可直接基于 `error.data.message` 展示错误文案。

## 主要功能

- 业务异常（BusinessException）：返回 code 字段指定的 HTTP 状态码与业务消息
- ResponseStatusException：透传 reason 字段作为 message，fallback 到 HTTP 状态描述
- AccessDeniedException：统一返回 403，message 为"无权访问该资源"，不暴露权限细节
- AuthenticationException：统一返回 401，message 为"身份认证失败"
- MethodArgumentNotValidException（Bean Validation 失败）：提取字段级错误信息返回 400
- ConstraintViolationException（路径/查询参数校验失败）：提取约束违反信息返回 400
- DataIntegrityViolationException（数据库唯一约束冲突）：返回 409
- MaxUploadSizeExceededException（文件超大）：返回 413
- NoHandlerFoundException（路由不存在）：返回 404
- HttpRequestMethodNotSupportedException：返回 405
- HttpMessageNotReadableException（JSON 解析失败）：返回 400
- IllegalArgumentException（参数非法）：返回 400，透传 message
- 兜底异常（Exception）：返回 500，隐藏内部错误详情

## 对外暴露的接口

无（横切关注点，不暴露 HTTP 路由）

## 依赖

无

## 技术债 / 待完善

- 兜底 500 响应不记录 request body，排查复杂请求时上下文信息不足，建议引入 MDC 记录 requestId
- 部分 IllegalArgumentException 由业务代码抛出，但语义应为 409（冲突），当前统一映射为 400，存在语义不精确问题
