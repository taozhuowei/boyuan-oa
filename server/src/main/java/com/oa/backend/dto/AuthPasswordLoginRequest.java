package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 密码登录请求 DTO
 *
 * @param username 用户名
 * @param password 密码
 */
public record AuthPasswordLoginRequest(
    @NotBlank(message = "username must not be blank") String username,
    @NotBlank(message = "password must not be blank") String password) {}
