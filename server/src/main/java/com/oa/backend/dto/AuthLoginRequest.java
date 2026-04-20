package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 登录认证请求 DTO
 *
 * @param username 用户名
 * @param displayName 显示名称
 * @param role 角色标识
 */
public record AuthLoginRequest(
    @NotBlank(message = "用户名不能为空") String username, String displayName, String role) {}
