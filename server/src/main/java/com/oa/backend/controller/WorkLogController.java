package com.oa.backend.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.dto.FormApprovalRequest;
import com.oa.backend.dto.FormRecordResponse;
import com.oa.backend.dto.FormSubmitRequest;
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
 * 施工日志与工伤申报控制器
 * 职责：处理劳工的施工日志提交与工伤申报，以及项目经理的审批操作。
 * 使用 FormService + ApprovalFlowService 代替 OaDataService 内存实现。
 */
@RestController
@RequestMapping("/logs")
@RequiredArgsConstructor
public class WorkLogController {

    private final FormService formService;
    private final ApprovalFlowService approvalFlowService;
    private final EmployeeMapper employeeMapper;
    private final ObjectMapper objectMapper;

    /**
     * 提交施工日志
     * 权限：劳工（WORKER）
     */
    @PostMapping
    @PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<FormRecordResponse> submitLog(
            @Valid @RequestBody FormSubmitRequest request,
            Authentication authentication) {
        Long submitterId = getCurrentEmployeeId(authentication);
        if (submitterId == null) {
            return ResponseEntity.badRequest().build();
        }
        String formDataJson;
        try {
            formDataJson = objectMapper.writeValueAsString(request.formData());
        } catch (JsonProcessingException e) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(formService.submitForm(submitterId, "LOG", formDataJson, request.remark()));
    }

    /**
     * 提交工伤申报
     * 权限：劳工（WORKER）
     */
    @PostMapping("/injury")
    @PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<FormRecordResponse> submitInjury(
            @Valid @RequestBody FormSubmitRequest request,
            Authentication authentication) {
        Long submitterId = getCurrentEmployeeId(authentication);
        if (submitterId == null) {
            return ResponseEntity.badRequest().build();
        }
        String formDataJson;
        try {
            formDataJson = objectMapper.writeValueAsString(request.formData());
        } catch (JsonProcessingException e) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(formService.submitForm(submitterId, "INJURY", formDataJson, request.remark()));
    }

    /**
     * 获取记录列表
     * WORKER: 查看本人提交的施工日志/工伤申报
     * PROJECT_MANAGER: 查看所有相关记录（CEO 也可查看）
     */
    @GetMapping("/records")
    @PreAuthorize("hasAnyRole('WORKER','PROJECT_MANAGER','CEO')")
    public ResponseEntity<List<FormRecordResponse>> getRecords(Authentication authentication) {
        Long currentEmployeeId = getCurrentEmployeeId(authentication);
        if (currentEmployeeId == null) {
            return ResponseEntity.badRequest().build();
        }
        String roleCode = getCurrentRoleCode(authentication);
        return ResponseEntity.ok(formService.getHistory(currentEmployeeId, roleCode, Arrays.asList("LOG", "INJURY")));
    }

    /**
     * 获取待审批列表
     * 权限：项目经理（PROJECT_MANAGER）
     */
    @GetMapping("/todo")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
    public ResponseEntity<List<FormRecordResponse>> getTodoList(Authentication authentication) {
        Long currentEmployeeId = getCurrentEmployeeId(authentication);
        if (currentEmployeeId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(approvalFlowService.getTodo(currentEmployeeId));
    }

    /**
     * 审批通过
     * 权限：项目经理（PROJECT_MANAGER）
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
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
     * 权限：项目经理（PROJECT_MANAGER）
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
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

    private Long getCurrentEmployeeId(Authentication authentication) {
        if (authentication == null) return null;
        Employee employee = SecurityUtils.getEmployeeFromUsername(authentication.getName(), employeeMapper);
        return employee != null ? employee.getId() : null;
    }

    private String getCurrentRoleCode(Authentication authentication) {
        if (authentication == null) return null;
        Employee employee = SecurityUtils.getEmployeeFromUsername(authentication.getName(), employeeMapper);
        return employee != null ? employee.getRoleCode() : null;
    }
}
