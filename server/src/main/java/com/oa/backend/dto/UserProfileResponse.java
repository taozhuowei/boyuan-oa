package com.oa.backend.dto;

import java.util.List;

/**
 * 用户个人资料响应 DTO
 * 包含用户基本信息、角色和可见模块
 */
public record UserProfileResponse(
    String username,
    String displayName,
    String role,
    String roleName,
    String department,
    String employeeType,
    String status,
    List<String> visibleModules
) {
}
