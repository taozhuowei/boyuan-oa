package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

/**
 * 角色新增/更新请求 DTO
 *
 * @param roleCode 角色编码
 * @param roleName 角色名称
 * @param description 角色描述
 * @param status 状态
 * @param permissions 权限列表
 */
public record RoleUpsertRequest(
    @NotBlank(message = "roleCode must not be blank") String roleCode,
    @NotBlank(message = "roleName must not be blank") String roleName,
    String description,
    Integer status,
    List<String> permissions) {}
