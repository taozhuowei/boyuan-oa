package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.dto.FormApprovalRequest;
import com.oa.backend.dto.FormRecordResponse;
import com.oa.backend.dto.FormSubmitRequest;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.FormRecord;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.FormRecordMapper;
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
    private final FormRecordMapper formRecordMapper;
    private final ObjectMapper objectMapper;
    // FormService provides getDetail() to build a full response after status change

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
     * 权限：劳工（WORKER）或项目经理（PROJECT_MANAGER 代录，触发 skipCondition 跳过 PM Review）
     */
    @PostMapping("/injury")
    @PreAuthorize("hasAnyRole('WORKER','PROJECT_MANAGER','CEO')")
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

    /**
     * 提交施工日志（支持 workItems 动态列表）
     * 功能等同于 POST /logs，但路径语义更清晰；workItems 字段会被序列化进 formData
     * 权限：劳工（WORKER）
     */
    @PostMapping("/construction-logs")
    @PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<FormRecordResponse> submitConstructionLog(
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
     * PM 批注施工日志（不影响审批状态，仅写入 pmNote 字段）
     * 权限：PROJECT_MANAGER / CEO
     */
    @PatchMapping("/construction-logs/{id}/review")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
    public ResponseEntity<Void> reviewLog(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        FormRecord record = formRecordMapper.selectById(id);
        if (record == null) {
            return ResponseEntity.notFound().build();
        }
        // pmNote 写入 remark 字段（不影响审批流程）
        String pmNote = body.getOrDefault("pmNote", "");
        record.setRemark(pmNote);
        record.setUpdatedAt(java.time.LocalDateTime.now());
        formRecordMapper.updateById(record);
        return ResponseEntity.noContent().build();
    }

    /**
     * CEO 追溯驳回施工日志（APPROVED → RECALLED）
     * 权限：CEO
     */
    @PostMapping("/construction-logs/{id}/recall")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<FormRecordResponse> recallLog(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> body,
            Authentication authentication) {
        FormRecord record = formRecordMapper.selectById(id);
        if (record == null) {
            return ResponseEntity.notFound().build();
        }
        if (!"APPROVED".equals(record.getStatus())) {
            return ResponseEntity.badRequest().build();
        }
        record.setStatus("RECALLED");
        record.setUpdatedAt(java.time.LocalDateTime.now());
        formRecordMapper.updateById(record);
        Long ceoId = getCurrentEmployeeId(authentication);
        return ResponseEntity.ok(formService.getDetail(id, ceoId));
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
