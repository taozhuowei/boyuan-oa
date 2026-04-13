package com.oa.backend.dto;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

/**
 * 表单提交请求 DTO（请假、加班、工伤、日志通用）
 * formType 已设为可选：各控制器根据 URL 路径自行确定，无需客户端传入
 */
public record FormSubmitRequest(
    String formType,

    @NotNull(message = "表单数据不能为空")
    Map<String, Object> formData,

    String remark
) {
}
