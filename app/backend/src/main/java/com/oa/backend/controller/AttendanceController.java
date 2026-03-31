package com.oa.backend.controller;

import com.oa.backend.dto.*;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.OaDataService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

/**
 * 考勤系统控制器
 * 职责：处理请假、加班申请与审批
 */
@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final OaDataService oaDataService;

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
        String displayName = SecurityUtils.getDisplayNameFromUsername(authentication.getName());
        String department = SecurityUtils.getDepartmentFromUsername(authentication.getName());
        return ResponseEntity.ok(oaDataService.createForm("LEAVE", displayName, department, 
                request.formData(), request.remark()));
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
        String displayName = SecurityUtils.getDisplayNameFromUsername(authentication.getName());
        String department = SecurityUtils.getDepartmentFromUsername(authentication.getName());
        return ResponseEntity.ok(oaDataService.createForm("OVERTIME", displayName, department,
                request.formData(), request.remark()));
    }

    /**
     * 获取考勤记录列表
     */
    @GetMapping("/records")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','PROJECT_MANAGER','CEO')")
    public ResponseEntity<List<FormRecordResponse>> getRecords(Authentication authentication) {
        String displayName = SecurityUtils.getDisplayNameFromUsername(authentication.getName());
        // 财务和CEO查看全部，其他只看自己的
        if (SecurityUtils.hasFinanceAccess(authentication) || SecurityUtils.isCEO(authentication)) {
            return ResponseEntity.ok(oaDataService.listFormsByTypes(Arrays.asList("LEAVE", "OVERTIME")));
        }
        return ResponseEntity.ok(oaDataService.listFormsBySubmitter(displayName));
    }

    /**
     * 获取待审批列表
     * 权限：项目经理初审，CEO终审
     */
    @GetMapping("/todo")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
    public ResponseEntity<List<FormRecordResponse>> getTodoList(Authentication authentication) {
        String approverRole = SecurityUtils.getApproverRole(authentication);
        if ("PROJECT_MANAGER".equals(approverRole)) {
            return ResponseEntity.ok(oaDataService.listFormsByStatus("PENDING"));
        } else {
            return ResponseEntity.ok(oaDataService.listFormsByStatus("APPROVING"));
        }
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
        String approver = SecurityUtils.getDisplayNameFromUsername(authentication.getName());
        String approverRole = SecurityUtils.getApproverRole(authentication);
        return oaDataService.approveForm(id, "APPROVE", approver, approverRole, request.comment())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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
        String approver = SecurityUtils.getDisplayNameFromUsername(authentication.getName());
        String approverRole = SecurityUtils.getApproverRole(authentication);
        return oaDataService.approveForm(id, "REJECT", approver, approverRole, request.comment())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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
