package com.oa.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** 验证密码重置验证码请求（邮箱链路）。 */
public record VerifyResetCodeRequest(
    @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") String email,
    @NotBlank(message = "验证码不能为空") @Pattern(regexp = "^\\d{6}$", message = "验证码必须是6位数字")
        String code) {}
