package com.oa.backend.controller;

import com.oa.backend.dto.OrgNodeResponse;
import com.oa.backend.dto.SupervisorUpdateRequest;
import com.oa.backend.entity.Employee;
import com.oa.backend.service.OrgService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 组织架构控制器
 *
 * 职责：对外暴露组织树查询与上级修改接口（CEO 专属）。
 * 业务逻辑全部委托 {@link OrgService}。
 */
@RestController
@RequestMapping("/org")
@RequiredArgsConstructor
public class OrgController {

    private final OrgService orgService;

    /**
     * 获取组织架构树。
     * 权限：CEO only
     */
    @GetMapping("/tree")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<List<OrgNodeResponse>> getOrgTree() {
        return ResponseEntity.ok(orgService.buildOrgTree());
    }

    /**
     * 修改员工直系领导。
     * 权限：CEO only
     */
    @PatchMapping("/supervisor/{employeeId}")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<OrgNodeResponse> updateSupervisor(
            @PathVariable Long employeeId,
            @RequestBody SupervisorUpdateRequest request) {

        Employee updated = orgService.updateSupervisor(employeeId, request.supervisorId());

        // 重新查询组织架构树并返回该员工节点
        List<OrgNodeResponse> tree = orgService.buildOrgTree();
        OrgNodeResponse node = orgService.findNodeInTree(tree, employeeId);
        if (node == null) {
            node = orgService.buildSimpleNodeResponse(updated);
        }

        return ResponseEntity.ok(node);
    }
}
