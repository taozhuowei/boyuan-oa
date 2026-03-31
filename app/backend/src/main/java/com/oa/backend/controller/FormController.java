package com.oa.backend.controller;

import com.oa.backend.dto.*;
import com.oa.backend.service.OaDataService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

/**
 * 表单中心控制器
 */
@RestController
@RequestMapping("/forms")
@RequiredArgsConstructor
public class FormController {

    private final OaDataService oaDataService;

    /**
     * 获取表单配置
     * 权限：所有登录用户
     */
    @GetMapping("/config")
    public ResponseEntity<FormConfigResponse> getFormConfig(
            @RequestParam String formType,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(buildFormConfig(formType));
    }

    /**
     * 获取待办表单列表
     * 权限：项目经理、CEO
     */
    @GetMapping("/todo")
    public ResponseEntity<List<FormRecordResponse>> getTodoForms(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        String approverRole = getApproverRole(authentication);
        if (approverRole == null) {
            return ResponseEntity.ok(List.of());
        }
        // 项目经理看 PENDING 状态，CEO 看 APPROVING 状态
        if ("PROJECT_MANAGER".equals(approverRole)) {
            return ResponseEntity.ok(oaDataService.listFormsByStatus("PENDING"));
        } else {
            return ResponseEntity.ok(oaDataService.listFormsByStatus("APPROVING"));
        }
    }

    /**
     * 获取表单历史记录
     * 权限：所有登录用户
     */
    @GetMapping("/history")
    public ResponseEntity<List<FormRecordResponse>> getFormHistory(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        String username = authentication.getName();
        String displayName = getDisplayNameFromUsername(username);
        return ResponseEntity.ok(oaDataService.listFormsBySubmitter(displayName));
    }

    /**
     * 获取表单详情
     * 权限：所有登录用户
     */
    @GetMapping("/{id}")
    public ResponseEntity<FormRecordResponse> getForm(
            @PathVariable Long id,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        return oaDataService.getForm(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 提交请假申请
     * 权限：员工、劳工
     */
    @PostMapping("/leave")
    public ResponseEntity<FormRecordResponse> submitLeave(
            @Valid @RequestBody FormSubmitRequest request,
            Authentication authentication) {
        return submitForm("LEAVE", request, authentication);
    }

    /**
     * 提交加班申请
     * 权限：员工、劳工
     */
    @PostMapping("/overtime")
    public ResponseEntity<FormRecordResponse> submitOvertime(
            @Valid @RequestBody FormSubmitRequest request,
            Authentication authentication) {
        return submitForm("OVERTIME", request, authentication);
    }

    /**
     * 提交工伤补偿申请
     * 权限：劳工
     */
    @PostMapping("/injury")
    public ResponseEntity<FormRecordResponse> submitInjury(
            @Valid @RequestBody FormSubmitRequest request,
            Authentication authentication) {
        if (!isWorker(authentication)) {
            return ResponseEntity.status(403).build();
        }
        return submitForm("INJURY", request, authentication);
    }

    /**
     * 提交施工日志
     * 权限：劳工
     */
    @PostMapping("/log")
    public ResponseEntity<FormRecordResponse> submitLog(
            @Valid @RequestBody FormSubmitRequest request,
            Authentication authentication) {
        if (!isWorker(authentication)) {
            return ResponseEntity.status(403).build();
        }
        return submitForm("LOG", request, authentication);
    }

    /**
     * 审批通过
     * 权限：项目经理、CEO
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<FormRecordResponse> approveForm(
            @PathVariable Long id,
            @Valid @RequestBody FormApprovalRequest request,
            Authentication authentication) {
        if (!canApprove(authentication)) {
            return ResponseEntity.status(403).build();
        }
        String approver = getDisplayNameFromUsername(authentication.getName());
        String approverRole = getApproverRole(authentication);
        return oaDataService.approveForm(id, "APPROVE", approver, approverRole, request.comment())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 审批驳回
     * 权限：项目经理、CEO
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<FormRecordResponse> rejectForm(
            @PathVariable Long id,
            @Valid @RequestBody FormApprovalRequest request,
            Authentication authentication) {
        if (!canApprove(authentication)) {
            return ResponseEntity.status(403).build();
        }
        String approver = getDisplayNameFromUsername(authentication.getName());
        String approverRole = getApproverRole(authentication);
        return oaDataService.approveForm(id, "REJECT", approver, approverRole, request.comment())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private ResponseEntity<FormRecordResponse> submitForm(String formType, FormSubmitRequest request, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        String username = authentication.getName();
        String displayName = getDisplayNameFromUsername(username);
        String department = getDepartmentFromUsername(username);

        FormRecordResponse response = oaDataService.createForm(formType, displayName, department,
                request.formData(), request.remark());
        return ResponseEntity.ok(response);
    }

    private boolean isWorker(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_WORKER".equals(a.getAuthority()));
    }

    private boolean canApprove(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> Arrays.asList("ROLE_PROJECT_MANAGER", "ROLE_CEO").contains(a.getAuthority()));
    }

    private String getApproverRole(Authentication authentication) {
        if (authentication == null) {
            return null;
        }

        return authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .filter(authority -> Arrays.asList("ROLE_PROJECT_MANAGER", "ROLE_CEO").contains(authority))
                .findFirst()
                .map(authority -> authority.replace("ROLE_", ""))
                .orElse(null);
    }

    private String getDisplayNameFromUsername(String username) {
        return switch (username.toLowerCase()) {
            case "employee.demo" -> "张晓宁";
            case "worker.demo" -> "赵铁柱";
            case "finance.demo" -> "李静";
            case "pm.demo" -> "王建国";
            case "ceo.demo" -> "陈明远";
            default -> username;
        };
    }

    private String getDepartmentFromUsername(String username) {
        return switch (username.toLowerCase()) {
            case "employee.demo" -> "综合管理部";
            case "worker.demo" -> "施工一部";
            case "finance.demo" -> "财务管理部";
            case "pm.demo" -> "项目一部";
            case "ceo.demo" -> "运营管理部";
            default -> "未分配";
        };
    }

    private FormConfigResponse buildFormConfig(String formType) {
        return switch (formType) {
            case "LEAVE" -> new FormConfigResponse("LEAVE", "请假申请",
                    Arrays.asList(
                            new FormConfigResponse.FormField("leaveType", "请假类型", "SELECT", true, null,
                                    Arrays.asList("年假", "事假", "病假", "婚假", "产假"), "请选择请假类型", 1),
                            new FormConfigResponse.FormField("startDate", "开始日期", "DATE", true, null, null, "请选择开始日期", 2),
                            new FormConfigResponse.FormField("endDate", "结束日期", "DATE", true, null, null, "请选择结束日期", 3),
                            new FormConfigResponse.FormField("days", "请假天数", "NUMBER", true, null, null, "请输入天数", 4),
                            new FormConfigResponse.FormField("reason", "请假原因", "TEXTAREA", true, null, null, "请输入请假原因", 5)
                    ),
                    Arrays.asList(
                            new FormConfigResponse.FormAction("submit", "提交申请", "primary", Arrays.asList("EMPLOYEE", "WORKER")),
                            new FormConfigResponse.FormAction("save", "保存草稿", "default", Arrays.asList("EMPLOYEE", "WORKER"))
                    ),
                    new FormConfigResponse.ApprovalFlow("DEFAULT",
                            Arrays.asList(
                                    new FormConfigResponse.ApprovalFlow.FlowNode("初审", "项目经理审批", "PROJECT_MANAGER", 1),
                                    new FormConfigResponse.ApprovalFlow.FlowNode("终审", "CEO审批", "CEO", 2)
                            ))
            );
            case "OVERTIME" -> new FormConfigResponse("OVERTIME", "加班申请",
                    Arrays.asList(
                            new FormConfigResponse.FormField("overtimeDate", "加班日期", "DATE", true, null, null, "请选择加班日期", 1),
                            new FormConfigResponse.FormField("startTime", "开始时间", "TIME", true, null, null, "请选择开始时间", 2),
                            new FormConfigResponse.FormField("endTime", "结束时间", "TIME", true, null, null, "请选择结束时间", 3),
                            new FormConfigResponse.FormField("hours", "加班时长", "NUMBER", true, null, null, "请输入小时数", 4),
                            new FormConfigResponse.FormField("reason", "加班原因", "TEXTAREA", true, null, null, "请输入加班原因", 5)
                    ),
                    Arrays.asList(
                            new FormConfigResponse.FormAction("submit", "提交申请", "primary", Arrays.asList("EMPLOYEE", "WORKER")),
                            new FormConfigResponse.FormAction("save", "保存草稿", "default", Arrays.asList("EMPLOYEE", "WORKER"))
                    ),
                    new FormConfigResponse.ApprovalFlow("DEFAULT",
                            Arrays.asList(
                                    new FormConfigResponse.ApprovalFlow.FlowNode("初审", "项目经理审批", "PROJECT_MANAGER", 1),
                                    new FormConfigResponse.ApprovalFlow.FlowNode("终审", "CEO审批", "CEO", 2)
                            ))
            );
            case "INJURY" -> new FormConfigResponse("INJURY", "工伤补偿",
                    Arrays.asList(
                            new FormConfigResponse.FormField("injuryDate", "工伤发生日期", "DATE", true, null, null, "请选择发生日期", 1),
                            new FormConfigResponse.FormField("injuryLocation", "工伤发生地点", "TEXT", true, null, null, "请输入发生地点", 2),
                            new FormConfigResponse.FormField("injuryDesc", "工伤描述", "TEXTAREA", true, null, null, "请描述工伤情况", 3),
                            new FormConfigResponse.FormField("medicalFee", "医疗费用", "NUMBER", true, null, null, "请输入医疗费用", 4),
                            new FormConfigResponse.FormField("compensation", "申请补偿金额", "NUMBER", true, null, null, "请输入申请金额", 5)
                    ),
                    Arrays.asList(
                            new FormConfigResponse.FormAction("submit", "提交申请", "primary", Arrays.asList("WORKER")),
                            new FormConfigResponse.FormAction("save", "保存草稿", "default", Arrays.asList("WORKER"))
                    ),
                    new FormConfigResponse.ApprovalFlow("DEFAULT",
                            Arrays.asList(
                                    new FormConfigResponse.ApprovalFlow.FlowNode("初审", "项目经理审批", "PROJECT_MANAGER", 1),
                                    new FormConfigResponse.ApprovalFlow.FlowNode("终审", "CEO审批", "CEO", 2)
                            ))
            );
            case "LOG" -> new FormConfigResponse("LOG", "施工日志",
                    Arrays.asList(
                            new FormConfigResponse.FormField("logDate", "日志日期", "DATE", true, null, null, "请选择日期", 1),
                            new FormConfigResponse.FormField("project", "所属项目", "SELECT", true, null,
                                    Arrays.asList("绿地中心大厦", "科技园区改造"), "请选择项目", 2),
                            new FormConfigResponse.FormField("weather", "天气", "SELECT", true, null,
                                    Arrays.asList("晴", "多云", "阴", "雨"), "请选择天气", 3),
                            new FormConfigResponse.FormField("workContent", "工作内容", "TEXTAREA", true, null, null, "请输入工作内容", 4),
                            new FormConfigResponse.FormField("progress", "完成进度", "NUMBER", true, null, null, "请输入完成百分比", 5),
                            new FormConfigResponse.FormField("problems", "存在问题", "TEXTAREA", false, null, null, "请输入存在的问题", 6)
                    ),
                    Arrays.asList(
                            new FormConfigResponse.FormAction("submit", "提交日志", "primary", Arrays.asList("WORKER")),
                            new FormConfigResponse.FormAction("save", "保存草稿", "default", Arrays.asList("WORKER"))
                    ),
                    new FormConfigResponse.ApprovalFlow("DEFAULT",
                            Arrays.asList(
                                    new FormConfigResponse.ApprovalFlow.FlowNode("初审", "项目经理审批", "PROJECT_MANAGER", 1)
                            ))
            );
            default -> new FormConfigResponse(formType, formType, List.of(), List.of(),
                    new FormConfigResponse.ApprovalFlow("NONE", List.of()));
        };
    }
}
