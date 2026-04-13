package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 重置密码请求
 */
public record ResetPasswordRequest(
    @NotBlank(message = "重置令牌不能为空")
    String resetToken,

    @NotBlank(message = "新密码不能为空")
    @Size(min = 6, message = "密码长度至少为6位")
    String newPassword
) {}
