package com.oa.backend.controller;

import com.oa.backend.dto.EmployeeProfileResponse;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.OaDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
     * 权限：员工、财务、项目经理、CEO、劳工
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE','FINANCE','PROJECT_MANAGER','CEO','WORKER')")
    public ResponseEntity<List<EmployeeProfileResponse>> listEmployees() {
        return ResponseEntity.ok(oaDataService.listEmployees());
    }

    /**
     * 获取员工详情
     * 权限：员工、财务、项目经理、CEO、劳工
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','FINANCE','PROJECT_MANAGER','CEO','WORKER')")
    public ResponseEntity<EmployeeProfileResponse> getEmployee(@PathVariable Long id) {
        return oaDataService.getEmployee(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
