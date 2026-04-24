package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** 重置密码请求（忘记密码第三步）。密码强度规则同 D-F-17：8-64 位 + 字母 + 数字。 */
public record ResetPasswordRequest(
    @NotBlank(message = "重置令牌不能为空") String resetToken,
    @NotBlank(message = "新密码不能为空")
        @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d)[^\\s]{8,64}$",
            message = "密码须为8-64位，同时包含字母和数字，不允许空格")
        String newPassword) {}
