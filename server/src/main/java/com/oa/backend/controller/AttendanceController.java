package com.oa.backend.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.dto.*;
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
import java.util.Collections;

/**
 * 考勤系统控制器
 * 职责：处理请假、加班申请与审批
 */
@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final FormService formService;
    private final ApprovalFlowService approvalFlowService;
    private final EmployeeMapper employeeMapper;
    private final ObjectMapper objectMapper;

    /**
     * 获取请假表单配置
     */
    @GetMapping("/leave/config")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','PROJECT_MANAGER','CEO')")
    public ResponseEntity<FormConfigResponse> getLeaveConfig() {
        return ResponseEntity.ok(buildLeaveConfig());
    }

    /**
     * 提交请假申请
     */
    @PostMapping("/leave")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','PROJECT_MANAGER','CEO')")
    public ResponseEntity<FormRecordResponse> submitLeave(
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
        
        return ResponseEntity.ok(formService.submitForm(submitterId, "LEAVE", formDataJson, request.remark()));
    }

    /**
     * 获取加班表单配置
     */
    @GetMapping("/overtime/config")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','PROJECT_MANAGER','CEO')")
    public ResponseEntity<FormConfigResponse> getOvertimeConfig() {
        return ResponseEntity.ok(buildOvertimeConfig());
    }

    /**
     * 提交加班申请
     */
    @PostMapping("/overtime")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','PROJECT_MANAGER','CEO')")
    public ResponseEntity<FormRecordResponse> submitOvertime(
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
        
        return ResponseEntity.ok(formService.submitForm(submitterId, "OVERTIME", formDataJson, request.remark()));
    }

    /**
     * 获取考勤记录列表
     */
    @GetMapping("/records")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','PROJECT_MANAGER','CEO')")
    public ResponseEntity<List<FormRecordResponse>> getRecords(Authentication authentication) {
        Long currentEmployeeId = getCurrentEmployeeId(authentication);
        if (currentEmployeeId == null) {
            return ResponseEntity.badRequest().build();
        }

        String roleCode = getCurrentRoleCode(authentication);
        List<String> formTypes = Arrays.asList("LEAVE", "OVERTIME");
        
        return ResponseEntity.ok(formService.getHistory(currentEmployeeId, roleCode, formTypes));
    }

    /**
     * 获取待审批列表
     * 权限：项目经理初审，CEO终审
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
     * 全量历史记录（PM/CEO 视图，支持按时间范围筛选）
     * 权限：项目经理、CEO
     */
    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
    public ResponseEntity<List<FormRecordResponse>> getHistory(Authentication authentication) {
        Long currentEmployeeId = getCurrentEmployeeId(authentication);
        if (currentEmployeeId == null) {
            return ResponseEntity.badRequest().build();
        }
        String roleCode = getCurrentRoleCode(authentication);
        List<String> formTypes = Arrays.asList("LEAVE", "OVERTIME");
        return ResponseEntity.ok(formService.getHistory(currentEmployeeId, roleCode, formTypes));
    }

    /**
     * 自补加班申请（补申报历史加班，走审批流）
     * 与 POST /attendance/overtime 的区别：此接口明确表示为补申报，进入 OVERTIME 审批流
     * 权限：员工、劳工
     */
    @PostMapping("/overtime-self-report")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER')")
    public ResponseEntity<FormRecordResponse> submitOvertimeSelfReport(
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
        return ResponseEntity.ok(formService.submitForm(submitterId, "OVERTIME", formDataJson, request.remark()));
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

    private FormConfigResponse buildLeaveConfig() {
        return new FormConfigResponse("LEAVE", "请假申请",
                Arrays.asList(
                        new FormConfigResponse.FormField("leaveType", "请假类型", "SELECT", true, null,
                                Arrays.asList("年假", "事假", "病假", "婚假", "产假"), "请选择请假类型", 1),
                        new FormConfigResponse.FormField("startDate", "开始日期", "DATE", true, null, null, "请选择开始日期", 2),
                        new FormConfigResponse.FormField("endDate", "结束日期", "DATE", true, null, null, "请选择结束日期", 3),
                        new FormConfigResponse.FormField("days", "请假天数", "NUMBER", true, null, null, "请输入天数", 4),
                        new FormConfigResponse.FormField("reason", "请假原因", "TEXTAREA", true, null, null, "请输入请假原因", 5)
                ),
                Arrays.asList(
                        new FormConfigResponse.FormAction("submit", "提交申请", "primary", 
                                Arrays.asList("EMPLOYEE", "WORKER", "FINANCE", "PROJECT_MANAGER", "CEO")),
                        new FormConfigResponse.FormAction("save", "保存草稿", "default",
                                Arrays.asList("EMPLOYEE", "WORKER", "FINANCE", "PROJECT_MANAGER", "CEO"))
                ),
                new FormConfigResponse.ApprovalFlow("DEFAULT",
                        Arrays.asList(
                                new FormConfigResponse.ApprovalFlow.FlowNode("初审", "项目经理审批", "PROJECT_MANAGER", 1),
                                new FormConfigResponse.ApprovalFlow.FlowNode("终审", "CEO审批", "CEO", 2)
                        ))
        );
    }

    private FormConfigResponse buildOvertimeConfig() {
        return new FormConfigResponse("OVERTIME", "加班申请",
                Arrays.asList(
                        new FormConfigResponse.FormField("overtimeDate", "加班日期", "DATE", true, null, null, "请选择加班日期", 1),
                        new FormConfigResponse.FormField("startTime", "开始时间", "TIME", true, null, null, "请选择开始时间", 2),
                        new FormConfigResponse.FormField("endTime", "结束时间", "TIME", true, null, null, "请选择结束时间", 3),
                        new FormConfigResponse.FormField("hours", "加班时长", "NUMBER", true, null, null, "请输入小时数", 4),
                        new FormConfigResponse.FormField("reason", "加班原因", "TEXTAREA", true, null, null, "请输入加班原因", 5)
                ),
                Arrays.asList(
                        new FormConfigResponse.FormAction("submit", "提交申请", "primary",
                                Arrays.asList("EMPLOYEE", "WORKER", "FINANCE", "PROJECT_MANAGER", "CEO")),
                        new FormConfigResponse.FormAction("save", "保存草稿", "default",
                                Arrays.asList("EMPLOYEE", "WORKER", "FINANCE", "PROJECT_MANAGER", "CEO"))
                ),
                new FormConfigResponse.ApprovalFlow("DEFAULT",
                        Arrays.asList(
                                new FormConfigResponse.ApprovalFlow.FlowNode("初审", "项目经理审批", "PROJECT_MANAGER", 1),
                                new FormConfigResponse.ApprovalFlow.FlowNode("终审", "CEO审批", "CEO", 2)
                        ))
        );
    }
}
