package com.oa.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * 业务异常。
 * 由业务代码显式抛出，由 {@link GlobalExceptionHandler} 统一转换为 JSON 响应。
 * 鼓励后续代码从 ResponseStatusException 迁移到本类，以分离"HTTP 层"与"业务层"异常语义。
 */
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BusinessException(HttpStatus status, String message) {
        this(status.value(), message);
    }

    public int getCode() {
        return code;
    }
}
