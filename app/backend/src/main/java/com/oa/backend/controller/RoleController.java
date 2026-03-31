package com.oa.backend.controller;

import com.oa.backend.dto.RoleUpsertRequest;
import com.oa.backend.dto.RoleViewResponse;
import com.oa.backend.service.AccessManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * 角色管理控制器
 * 负责系统角色的查询、创建和更新等管理操作
 */
@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleController {

    private final AccessManagementService accessManagementService;

    /**
     * 职责：获取系统中所有角色的列表
     * 请求含义：查询所有角色的基本信息
     * 响应含义：返回角色视图响应对象列表，包含角色ID、代码、名称、权限等信息
     * 权限期望：需要已认证用户，任何已登录用户均可访问
     */
    @GetMapping
    public ResponseEntity<List<RoleViewResponse>> list() {
        return ResponseEntity.ok(accessManagementService.listRoles());
    }

    /**
     * 职责：创建新角色
     * 请求含义：提交角色创建请求，包含角色代码、名称和权限列表
     * 响应含义：返回创建成功的角色视图响应对象
     * 权限期望：允许财务和CEO管理角色
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('FINANCE','CEO')")
    public ResponseEntity<RoleViewResponse> create(
        @Valid @RequestBody RoleUpsertRequest request
    ) {
        return ResponseEntity.ok(accessManagementService.createRole(request));
    }

    /**
     * 职责：更新指定角色的信息
     * 请求含义：提交角色更新请求，包含要更新的角色ID和新的角色信息
     * 响应含义：返回更新后的角色视图响应对象
     * 权限期望：允许财务和CEO管理角色
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FINANCE','CEO')")
    public ResponseEntity<RoleViewResponse> update(
        @PathVariable Long id,
        @Valid @RequestBody RoleUpsertRequest request
    ) {
        return ResponseEntity.ok(accessManagementService.updateRole(id, request));
    }
}
