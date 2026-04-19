package com.oa.backend.controller;

import com.oa.backend.dto.RoleUpsertRequest;
import com.oa.backend.dto.RoleViewResponse;
import com.oa.backend.exception.BusinessException;
import com.oa.backend.service.AccessManagementService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** 角色管理控制器 负责系统角色的查询、创建、更新和删除等管理操作 */
@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleController {

  private final AccessManagementService accessManagementService;

  /**
   * 职责：获取系统中所有角色的列表 请求含义：查询所有角色的基本信息 响应含义：返回角色视图响应对象列表，包含角色ID、代码、名称、权限等信息 权限期望：需要已认证用户，任何已登录用户均可访问
   */
  @GetMapping
  public ResponseEntity<List<RoleViewResponse>> list() {
    return ResponseEntity.ok(accessManagementService.listRoles());
  }

  /** 职责：创建新角色 请求含义：提交角色创建请求，包含角色代码、名称和权限列表 响应含义：返回创建成功的角色视图响应对象 权限期望：仅CEO可管理角色 */
  @PostMapping
  @PreAuthorize("hasRole('CEO')")
  @com.oa.backend.annotation.OperationLogRecord(action = "ROLE_CREATE", targetType = "ROLE")
  public ResponseEntity<RoleViewResponse> create(@Valid @RequestBody RoleUpsertRequest request) {
    return ResponseEntity.ok(accessManagementService.createRole(request));
  }

  /** 职责：更新指定角色的信息 请求含义：提交角色更新请求，包含要更新的角色ID和新的角色信息 响应含义：返回更新后的角色视图响应对象 权限期望：仅CEO可管理角色 */
  @PutMapping("/{id}")
  @PreAuthorize("hasRole('CEO')")
  @com.oa.backend.annotation.OperationLogRecord(action = "ROLE_UPDATE", targetType = "ROLE")
  public ResponseEntity<RoleViewResponse> update(
      @PathVariable Long id, @Valid @RequestBody RoleUpsertRequest request) {
    return ResponseEntity.ok(accessManagementService.updateRole(id, request));
  }

  /** 职责：删除指定角色 请求含义：提交角色删除请求 响应含义：204 No Content 权限期望：仅CEO可删除角色 限制：系统角色（isSystem=true）不可删除 */
  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('CEO')")
  @com.oa.backend.annotation.OperationLogRecord(action = "ROLE_DELETE", targetType = "ROLE")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    try {
      accessManagementService.deleteRole(id);
      return ResponseEntity.noContent().build();
    } catch (IllegalStateException e) {
      // 系统角色不可删除 → 400
      throw new BusinessException(400, e.getMessage());
    }
  }
}
