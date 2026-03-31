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
 * 施工日志系统控制器
 * 职责：处理施工日志提交与工伤申报
 */
@RestController
@RequestMapping("/logs")
@RequiredArgsConstructor
public class WorkLogController {

    private final OaDataService oaDataService;

    /**
     * 获取施工日志表单配置
     */
    @GetMapping("/config")
    @PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<FormConfigResponse> getLogConfig() {
        return ResponseEntity.ok(buildLogConfig());
    }

    /**
     * 提交施工日志
     */
    @PostMapping
    @PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<FormRecordResponse> submitLog(
            @Valid @RequestBody FormSubmitRequest request,
            Authentication authentication) {
        String displayName = SecurityUtils.getDisplayNameFromUsername(authentication.getName());
        String department = SecurityUtils.getDepartmentFromUsername(authentication.getName());
        return ResponseEntity.ok(oaDataService.createForm("LOG", displayName, department,
                request.formData(), request.remark()));
    }

    /**
     * 获取工伤申报表单配置
     */
    @GetMapping("/injury/config")
    @PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<FormConfigResponse> getInjuryConfig() {
        return ResponseEntity.ok(buildInjuryConfig());
    }

    /**
     * 提交工伤申报
     */
    @PostMapping("/injury")
    @PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<FormRecordResponse> submitInjury(
            @Valid @RequestBody FormSubmitRequest request,
            Authentication authentication) {
        String displayName = SecurityUtils.getDisplayNameFromUsername(authentication.getName());
        String department = SecurityUtils.getDepartmentFromUsername(authentication.getName());
        return ResponseEntity.ok(oaDataService.createForm("INJURY", displayName, department,
                request.formData(), request.remark()));
    }

    /**
     * 获取日志记录列表
     * 权限：劳工看自己的，项目经理看全部
     */
    @GetMapping("/records")
    @PreAuthorize("hasAnyRole('WORKER','PROJECT_MANAGER')")
    public ResponseEntity<List<FormRecordResponse>> getRecords(Authentication authentication) {
        if (SecurityUtils.isProjectManager(authentication)) {
            return ResponseEntity.ok(oaDataService.listFormsByTypes(Arrays.asList("LOG", "INJURY")));
        }
        String displayName = SecurityUtils.getDisplayNameFromUsername(authentication.getName());
        return ResponseEntity.ok(oaDataService.listFormsBySubmitter(displayName));
    }

    /**
     * 获取待审批列表
     * 权限：项目经理
     */
    @GetMapping("/todo")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<List<FormRecordResponse>> getTodoList() {
        return ResponseEntity.ok(oaDataService.listFormsByTypes(Arrays.asList("LOG", "INJURY")));
    }

    /**
     * 审批通过
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<FormRecordResponse> approve(
            @PathVariable Long id,
            @Valid @RequestBody FormApprovalRequest request,
            Authentication authentication) {
        String approver = SecurityUtils.getDisplayNameFromUsername(authentication.getName());
        return oaDataService.approveForm(id, "APPROVE", approver, "PROJECT_MANAGER", request.comment())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 审批驳回
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<FormRecordResponse> reject(
            @PathVariable Long id,
            @Valid @RequestBody FormApprovalRequest request,
            Authentication authentication) {
        String approver = SecurityUtils.getDisplayNameFromUsername(authentication.getName());
        return oaDataService.approveForm(id, "REJECT", approver, "PROJECT_MANAGER", request.comment())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private FormConfigResponse buildLogConfig() {
        return new FormConfigResponse("LOG", "施工日志",
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
    }

    private FormConfigResponse buildInjuryConfig() {
        return new FormConfigResponse("INJURY", "工伤申报",
                Arrays.asList(
                        new FormConfigResponse.FormField("injuryDate", "发生日期", "DATE", true, null, null, "请选择发生日期", 1),
                        new FormConfigResponse.FormField("injuryLocation", "发生地点", "TEXT", true, null, null, "请输入发生地点", 2),
                        new FormConfigResponse.FormField("injuryDesc", "伤情描述", "TEXTAREA", true, null, null, "请详细描述受伤经过和伤情", 3),
                        new FormConfigResponse.FormField("medicalFee", "医疗费用", "NUMBER", false, null, null, "请输入医疗费用", 4),
                        new FormConfigResponse.FormField("compensation", "申请补偿", "NUMBER", false, null, null, "请输入申请补偿金额", 5)
                ),
                Arrays.asList(
                        new FormConfigResponse.FormAction("submit", "提交申报", "primary", Arrays.asList("WORKER")),
                        new FormConfigResponse.FormAction("save", "保存草稿", "default", Arrays.asList("WORKER"))
                ),
                new FormConfigResponse.ApprovalFlow("DEFAULT",
                        Arrays.asList(
                                new FormConfigResponse.ApprovalFlow.FlowNode("初审", "项目经理审批", "PROJECT_MANAGER", 1)
                        ))
        );
    }
}
