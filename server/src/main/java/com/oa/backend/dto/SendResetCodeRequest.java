package com.oa.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** 发送密码重置验证码请求（邮箱链路）。 */
public record SendResetCodeRequest(
    @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") String email) {}
