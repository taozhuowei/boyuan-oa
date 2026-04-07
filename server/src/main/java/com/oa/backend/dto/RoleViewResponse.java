package com.oa.backend.dto;

import java.util.List;

/**
 * 角色详情响应 DTO
 *
 * @param id          角色 ID
 * @param roleCode    角色编码
 * @param roleName    角色名称
 * @param description 角色描述
 * @param status      状态
 * @param isSystem    是否系统预设角色
 * @param permissions 权限列表
 */
public record RoleViewResponse(
    Long id,
    String roleCode,
    String roleName,
    String description,
    Integer status,
    Boolean isSystem,
    List<String> permissions
) {
}
