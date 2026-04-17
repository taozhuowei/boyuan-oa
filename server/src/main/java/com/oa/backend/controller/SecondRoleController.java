package com.oa.backend.controller;

import com.oa.backend.entity.SecondRoleAssignment;
import com.oa.backend.entity.SecondRoleDef;
import com.oa.backend.service.SecondRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 第二角色（售后 / 物资管理 / 工长）分配 Controller。
 * 业务逻辑全部委托 {@link SecondRoleService}。
 *
 * Routes:
 *   GET    /second-roles/defs                   定义列表（认证用户）
 *   GET    /second-roles?employeeId=&projectId= 查询有效分配
 *   POST   /second-roles                        分配（PM/CEO）
 *   DELETE /second-roles/{id}                   撤销（PM/CEO）
 */
@RestController
@RequestMapping("/second-roles")
@RequiredArgsConstructor
public class SecondRoleController {

    private final SecondRoleService secondRoleService;

    @GetMapping("/defs")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SecondRoleDef>> listDefs() {
        return ResponseEntity.ok(secondRoleService.listDefs());
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SecondRoleAssignment>> list(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long projectId) {
        return ResponseEntity.ok(secondRoleService.listAssignments(employeeId, projectId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CEO','PROJECT_MANAGER')")
    @com.oa.backend.annotation.OperationLogRecord(action = "SECOND_ROLE_ASSIGN", targetType = "SECOND_ROLE")
    public ResponseEntity<?> assign(@RequestBody AssignRequest req, Authentication auth) {
        SecondRoleService.AssignResult result = secondRoleService.assign(
            req.employeeId(), req.roleCode(), req.projectId(), req.note(), auth);
        if (result instanceof SecondRoleService.AssignResult.Ok ok) {
            return ResponseEntity.ok(ok.assignment());
        } else {
            SecondRoleService.AssignResult.Invalid invalid = (SecondRoleService.AssignResult.Invalid) result;
            return ResponseEntity.badRequest().body(Map.of("message", invalid.message()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CEO','PROJECT_MANAGER')")
    @com.oa.backend.annotation.OperationLogRecord(action = "SECOND_ROLE_REVOKE", targetType = "SECOND_ROLE")
    public ResponseEntity<?> revoke(@PathVariable Long id) {
        SecondRoleService.RevokeResult result = secondRoleService.revoke(id);
        if (result instanceof SecondRoleService.RevokeResult.Ok ok) {
            return ResponseEntity.ok(Map.of("message", "已撤销", "id", ok.id()));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    public record AssignRequest(Long employeeId, String roleCode, Long projectId, String note) {}
}
