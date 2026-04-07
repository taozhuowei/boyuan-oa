package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * 表单提交请求 DTO（请假、加班、工伤、日志通用）
 */
public record FormSubmitRequest(
    @NotBlank(message = "表单类型不能为空")
    String formType,

    @NotNull(message = "表单数据不能为空")
    Map<String, Object> formData,

    String remark
) {
}
