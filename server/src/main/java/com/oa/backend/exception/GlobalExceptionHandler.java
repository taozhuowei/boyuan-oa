package com.oa.backend.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 全局异常处理器。
 * 目标：所有未捕获异常统一返回 `{"code": <HTTP 状态码>, "message": <业务语言>}`；
 *       不暴露堆栈、框架字段；便于前端基于 `error.data.message` 直接展示。
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

    /**
     * Spring Security 认证失败（登录失败、Token 无效等）。
     * 返回 401，避免暴露底层框架实现。
     */
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
            message = first.getField() + ": " + (first.getDefaultMessage() != null ? first.getDefaultMessage() : "参数无效");
        } else {
            message = "请求参数校验失败";
        }
        log.debug("MethodArgumentNotValidException: {}", message);
        return buildResponse(HttpStatus.BAD_REQUEST.value(), message);
    }

    /**
     * 查询参数 / 路径变量类型转换失败，如 /xxx/abc 但 id 为 Long。
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String name = ex.getName() != null ? ex.getName() : "参数";
        String message = "参数 " + name + " 类型不正确";
        log.debug("MethodArgumentTypeMismatchException: name={}", name, ex);
        return buildResponse(HttpStatus.BAD_REQUEST.value(), message);
    }

    /**
     * 请求体 JSON 解析失败（Jackson 反序列化异常）。
     * 不回传 Jackson 原始 message，避免泄露字段内部结构。
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleNotReadable(HttpMessageNotReadableException ex) {
        log.debug("HttpMessageNotReadableException: {}", ex.getMessage(), ex);
        return buildResponse(HttpStatus.BAD_REQUEST.value(), "请求体格式错误");
    }

    /**
     * 数据库约束违反（主键/唯一键/外键冲突等）。
     * 返回 409，不暴露 SQL 约束名、表名、列名。
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.debug("DataIntegrityViolationException: {}", ex.getMessage(), ex);
        return buildResponse(HttpStatus.CONFLICT.value(), "数据冲突或约束违反");
    }

    /**
     * 文件上传超过 server.servlet.multipart.max-file-size / max-request-size。
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUpload(MaxUploadSizeExceededException ex) {
        log.debug("MaxUploadSizeExceededException: {}", ex.getMessage(), ex);
        return buildResponse(HttpStatus.PAYLOAD_TOO_LARGE.value(), "文件超过上传大小限制");
    }

    /**
     * 未匹配任何路由。需要配合 application.yml：
     *   spring.mvc.throw-exception-if-no-handler-found: true
     *   spring.web.resources.add-mappings: false
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoHandler(NoHandlerFoundException ex) {
        log.debug("NoHandlerFoundException: {} {}", ex.getHttpMethod(), ex.getRequestURL(), ex);
        return buildResponse(HttpStatus.NOT_FOUND.value(), "接口不存在");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        log.debug("IllegalArgumentException: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST.value(),
                ex.getMessage() != null ? ex.getMessage() : "请求参数不合法");
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
