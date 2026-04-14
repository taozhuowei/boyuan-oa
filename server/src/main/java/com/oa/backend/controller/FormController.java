package com.oa.backend.controller;

import com.oa.backend.dto.FormApprovalRequest;
import com.oa.backend.dto.FormRecordResponse;
import com.oa.backend.entity.Employee;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.ApprovalFlowService;
import com.oa.backend.service.FormService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

/**
 * 表单控制器
 * 负责处理表单审批相关的通用接口
 */
@RestController
@RequestMapping("/forms")
@RequiredArgsConstructor
public class FormController {

    private final FormService formService;
    private final ApprovalFlowService approvalFlowService;
    private final EmployeeMapper employeeMapper;

    /**
     * 获取待审批列表
     * 权限：项目经理、CEO、财务（各类表单审批流的不同节点审批人）
     */
    @GetMapping("/todo")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO','FINANCE')")
    public ResponseEntity<List<FormRecordResponse>> getTodoList(Authentication authentication) {
        Long currentEmployeeId = getCurrentEmployeeId(authentication);
        if (currentEmployeeId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(formService.getTodo(currentEmployeeId));
    }

    /**
     * 审批通过
     * 权限：项目经理、CEO、财务
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO','FINANCE')")
    public ResponseEntity<FormRecordResponse> approve(
            @PathVariable Long id,
            @Valid @RequestBody FormApprovalRequest request,
            Authentication authentication) {
        Long currentEmployeeId = getCurrentEmployeeId(authentication);
        if (currentEmployeeId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(
                approvalFlowService.advance(id, currentEmployeeId, "APPROVE", request.comment())
        );
    }

    /**
     * 审批驳回
     * 权限：项目经理、CEO、财务
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO','FINANCE')")
    public ResponseEntity<FormRecordResponse> reject(
            @PathVariable Long id,
            @Valid @RequestBody FormApprovalRequest request,
            Authentication authentication) {
        Long currentEmployeeId = getCurrentEmployeeId(authentication);
        if (currentEmployeeId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(
                approvalFlowService.advance(id, currentEmployeeId, "REJECT", request.comment())
        );
    }

    /**
     * 获取历史记录
     * 权限：所有角色
     * CEO/Finance: 查看所有
     * 其他: 只能查看自己的
     */
    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','PROJECT_MANAGER','CEO')")
    public ResponseEntity<List<FormRecordResponse>> getHistory(
            Authentication authentication,
            @RequestParam(required = false) List<String> formTypes) {
        Long currentEmployeeId = getCurrentEmployeeId(authentication);
        if (currentEmployeeId == null) {
            return ResponseEntity.badRequest().build();
        }

        // 获取当前用户角色
        String roleCode = getCurrentRoleCode(authentication);

        // 默认查询请假、加班和报销类型
        List<String> types = formTypes != null && !formTypes.isEmpty()
                ? formTypes
                : Arrays.asList("LEAVE", "OVERTIME", "EXPENSE");

        return ResponseEntity.ok(formService.getHistory(currentEmployeeId, roleCode, types));
    }

    /**
     * 获取表单详情
     * 权限：所有角色（需要有权限查看该表单）
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','PROJECT_MANAGER','CEO')")
    public ResponseEntity<FormRecordResponse> getDetail(
            @PathVariable Long id,
            Authentication authentication) {
        Long currentEmployeeId = getCurrentEmployeeId(authentication);
        if (currentEmployeeId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(formService.getDetail(id, currentEmployeeId));
    }

    /**
     * 获取当前登录员工的 ID
     */
    private Long getCurrentEmployeeId(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        String username = authentication.getName();
        Employee employee = SecurityUtils.getEmployeeFromUsername(username, employeeMapper);
        return employee != null ? employee.getId() : null;
    }

    /**
     * 获取当前登录员工的角色代码
     */
    private String getCurrentRoleCode(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        String username = authentication.getName();
        Employee employee = SecurityUtils.getEmployeeFromUsername(username, employeeMapper);
        return employee != null ? employee.getRoleCode() : null;
    }
}
