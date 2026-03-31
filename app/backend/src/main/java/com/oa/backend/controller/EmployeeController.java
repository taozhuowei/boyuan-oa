package com.oa.backend.controller;

import com.oa.backend.dto.EmployeeProfileResponse;
import com.oa.backend.service.OaDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

/**
 * 员工管理控制器
 */
@RestController
@RequestMapping("/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final OaDataService oaDataService;

    /**
     * 获取员工列表
     * 权限：员工、财务、项目经理、CEO
     */
    @GetMapping
    public ResponseEntity<List<EmployeeProfileResponse>> listEmployees(Authentication authentication) {
        if (!hasEmployeeAccess(authentication)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(oaDataService.listEmployees());
    }

    /**
     * 获取员工详情
     * 权限：员工、财务、项目经理、CEO
     */
    @GetMapping("/{id}")
    public ResponseEntity<EmployeeProfileResponse> getEmployee(
            @PathVariable Long id,
            Authentication authentication) {
        if (!hasEmployeeAccess(authentication)) {
            return ResponseEntity.status(403).build();
        }
        return oaDataService.getEmployee(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private boolean hasEmployeeAccess(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> Arrays.asList("ROLE_EMPLOYEE", "ROLE_FINANCE", "ROLE_PROJECT_MANAGER", "ROLE_CEO", "ROLE_WORKER")
                        .contains(a.getAuthority()));
    }
}
