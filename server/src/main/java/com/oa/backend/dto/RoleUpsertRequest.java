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
    @NotBlank(message = "角色代码不能为空") String roleCode,
    @NotBlank(message = "角色名称不能为空") String roleName,
    String description,
    Integer status,
    List<String> permissions) {}
