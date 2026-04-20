package com.oa.backend.exception;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;

/**
 * 全局异常处理器。 目标：所有未捕获异常统一返回 `{"code": <HTTP 状态码>, "message": <业务语言>}`； 不暴露堆栈、框架字段；便于前端基于
 * `error.data.message` 直接展示。
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(BusinessException.class)
  public ResponseEntity<Map<String, Object>> handleBusiness(BusinessException ex) {
    log.debug("BusinessException: code={}, message={}", ex.getCode(), ex.getMessage());
    return buildResponse(ex.getCode(), ex.getMessage());
  }

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
    int code = ex.getStatusCode().value();
    String message = ex.getReason() != null ? ex.getReason() : ex.getStatusCode().toString();
    log.debug("ResponseStatusException: code={}, message={}", code, message);
    return buildResponse(code, message);
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
    log.debug("AccessDeniedException: {}", ex.getMessage());
    return buildResponse(HttpStatus.FORBIDDEN.value(), "无权访问该资源");
  }

  /** Spring Security 认证失败（登录失败、Token 无效等）。 返回 401，避免暴露底层框架实现。 */
  @ExceptionHandler(AuthenticationException.class)
  public ResponseEntity<Map<String, Object>> handleAuthentication(AuthenticationException ex) {
    log.debug("AuthenticationException: {}", ex.getMessage(), ex);
    return buildResponse(HttpStatus.UNAUTHORIZED.value(), "身份认证失败");
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
    FieldError first = ex.getBindingResult().getFieldErrors().stream().findFirst().orElse(null);
    String message;
    if (first != null) {
      message =
          first.getField()
              + ": "
              + (first.getDefaultMessage() != null ? first.getDefaultMessage() : "参数无效");
    } else {
      message = "请求参数校验失败";
    }
    log.debug("MethodArgumentNotValidException: {}", message);
    return buildResponse(HttpStatus.BAD_REQUEST.value(), message);
  }

  /**
   * Bean Validation 约束违反（@Validated 标注于 Controller 上，对 @RequestParam / @PathVariable 使用 @NotBlank
   * / @Size / @Pattern 等约束时触发）。Spring 默认会将此异常映射为 500， 必须显式处理以返回业务语义的 400。
   */
  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<Map<String, Object>> handleConstraintViolation(
      ConstraintViolationException ex) {
    ConstraintViolation<?> first = ex.getConstraintViolations().stream().findFirst().orElse(null);
    String message;
    if (first != null) {
      String path = first.getPropertyPath() != null ? first.getPropertyPath().toString() : "参数";
      // propertyPath 形如 "methodName.paramName"，仅取最后一段对用户更友好
      int dot = path.lastIndexOf('.');
      String field = dot >= 0 && dot < path.length() - 1 ? path.substring(dot + 1) : path;
      String msg = first.getMessage() != null ? first.getMessage() : "参数无效";
      message = field + ": " + msg;
    } else {
      message = "请求参数校验失败";
    }
    log.debug("ConstraintViolationException: {}", message);
    return buildResponse(HttpStatus.BAD_REQUEST.value(), message);
  }

  /** HTTP 方法不被当前接口支持（例如 GET 请求到一个仅声明 @PostMapping 的路径）。 返回 405，避免退化为 500。 */
  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<Map<String, Object>> handleMethodNotSupported(
      HttpRequestMethodNotSupportedException ex) {
    log.debug(
        "HttpRequestMethodNotSupportedException: method={}, supported={}",
        ex.getMethod(),
        ex.getSupportedHttpMethods());
    return buildResponse(HttpStatus.METHOD_NOT_ALLOWED.value(), "请求方法不被支持");
  }

  /** 请求 Content-Type 不被当前接口支持（例如接口只接受 JSON，但客户端发了 form）。 */
  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
  public ResponseEntity<Map<String, Object>> handleMediaTypeNotSupported(
      HttpMediaTypeNotSupportedException ex) {
    log.debug(
        "HttpMediaTypeNotSupportedException: contentType={}, supported={}",
        ex.getContentType(),
        ex.getSupportedMediaTypes());
    return buildResponse(HttpStatus.UNSUPPORTED_MEDIA_TYPE.value(), "不支持的请求媒体类型");
  }

  /** 客户端 Accept 头要求的响应类型当前接口无法产生。 */
  @ExceptionHandler(HttpMediaTypeNotAcceptableException.class)
  public ResponseEntity<Map<String, Object>> handleMediaTypeNotAcceptable(
      HttpMediaTypeNotAcceptableException ex) {
    log.debug("HttpMediaTypeNotAcceptableException: supported={}", ex.getSupportedMediaTypes());
    return buildResponse(HttpStatus.NOT_ACCEPTABLE.value(), "无法生成客户端可接受的响应格式");
  }

  /** 查询参数 / 路径变量类型转换失败，如 /xxx/abc 但 id 为 Long。 */
  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<Map<String, Object>> handleTypeMismatch(
      MethodArgumentTypeMismatchException ex) {
    String name = ex.getName() != null ? ex.getName() : "参数";
    String message = "参数 " + name + " 类型不正确";
    log.debug("MethodArgumentTypeMismatchException: name={}", name, ex);
    return buildResponse(HttpStatus.BAD_REQUEST.value(), message);
  }

  /** 必须请求头缺失，如 Authorization 未携带时访问需要认证的 /auth/** 端点。 */
  @ExceptionHandler(MissingRequestHeaderException.class)
  public ResponseEntity<Map<String, Object>> handleMissingHeader(MissingRequestHeaderException ex) {
    log.debug("MissingRequestHeaderException: header={}", ex.getHeaderName(), ex);
    return buildResponse(HttpStatus.BAD_REQUEST.value(), "缺少必要请求头: " + ex.getHeaderName());
  }

  /** 请求体 JSON 解析失败（Jackson 反序列化异常）。 不回传 Jackson 原始 message，避免泄露字段内部结构。 */
  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<Map<String, Object>> handleNotReadable(HttpMessageNotReadableException ex) {
    log.debug("HttpMessageNotReadableException: {}", ex.getMessage(), ex);
    return buildResponse(HttpStatus.BAD_REQUEST.value(), "请求体格式错误");
  }

  /** 数据库约束违反（主键/唯一键/外键冲突等）。 返回 409，不暴露 SQL 约束名、表名、列名。 */
  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<Map<String, Object>> handleDataIntegrity(
      DataIntegrityViolationException ex) {
    // 日志级别 warn：生产环境需要排查数据冲突（唯一键/外键/非空约束等），
    // debug 级别默认不开启会导致问题定位困难
    log.warn("DataIntegrityViolationException: {}", ex.getMessage(), ex);
    return buildResponse(HttpStatus.CONFLICT.value(), "数据冲突或约束违反");
  }

  /** 文件上传超过 server.servlet.multipart.max-file-size / max-request-size。 */
  @ExceptionHandler(MaxUploadSizeExceededException.class)
  public ResponseEntity<Map<String, Object>> handleMaxUpload(MaxUploadSizeExceededException ex) {
    // 日志级别 warn：超限上传可能是配置问题或恶意尝试，应留存生产线索
    log.warn("MaxUploadSizeExceededException: {}", ex.getMessage());
    return buildResponse(HttpStatus.PAYLOAD_TOO_LARGE.value(), "文件超过上传大小限制");
  }

  /**
   * 未匹配任何路由。需要配合 application.yml： spring.mvc.throw-exception-if-no-handler-found: true
   * spring.web.resources.add-mappings: false
   */
  @ExceptionHandler(NoHandlerFoundException.class)
  public ResponseEntity<Map<String, Object>> handleNoHandler(NoHandlerFoundException ex) {
    log.debug("NoHandlerFoundException: {} {}", ex.getHttpMethod(), ex.getRequestURL(), ex);
    return buildResponse(HttpStatus.NOT_FOUND.value(), "接口不存在");
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
    log.debug("IllegalArgumentException: {}", ex.getMessage());
    return buildResponse(
        HttpStatus.BAD_REQUEST.value(), ex.getMessage() != null ? ex.getMessage() : "请求参数不合法");
  }

  /**
   * 业务状态异常（如：重复提交、状态流转非法、无权操作等）。 Service 层抛出 IllegalStateException 时，消息为用户可读的中文描述， 直接透传给前端；返回 409
   * Conflict 以区别于参数错误（400）和服务器错误（500）。
   */
  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
    log.warn("IllegalStateException: {}", ex.getMessage());
    return buildResponse(
        HttpStatus.CONFLICT.value(), ex.getMessage() != null ? ex.getMessage() : "操作与当前业务状态冲突");
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleFallback(Exception ex) {
    log.error("Unhandled exception", ex);
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "服务器内部错误，请稍后重试");
  }

  private ResponseEntity<Map<String, Object>> buildResponse(int code, String message) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("code", code);
    body.put("message", message);
    HttpStatus status = safeResolve(code);
    return ResponseEntity.status(status).body(body);
  }

  private HttpStatus safeResolve(int code) {
    HttpStatus resolved = HttpStatus.resolve(code);
    return resolved != null ? resolved : HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
