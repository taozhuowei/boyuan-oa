package com.oa.backend.dto;

/**
 * 登录认证响应 DTO
 *
 * @param token        访问令牌
 * @param tokenType    令牌类型
 * @param mode         登录模式
 * @param userId       用户ID
 * @param username     用户名
 * @param displayName  显示名称
 * @param role         角色标识
 * @param roleName     角色名称
 * @param department   所属部门
 * @param employeeType 员工类型
 */
public record AuthLoginResponse(
    String token,
    String tokenType,
    String mode,
    Long userId,
    String username,
    String displayName,
    String role,
    String roleName,
    String department,
    String employeeType
) {
}
