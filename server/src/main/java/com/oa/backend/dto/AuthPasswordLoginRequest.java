package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 密码登录请求 DTO
 *
 * @param username 用户名
 * @param password 密码
 */
public record AuthPasswordLoginRequest(
    @NotBlank(message = "用户名不能为空") String username,
    @NotBlank(message = "密码不能为空") String password) {}
