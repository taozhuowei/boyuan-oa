package com.oa.backend.controller;

import com.oa.backend.dto.*;
import com.oa.backend.entity.Employee;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 报销控制器
 * 职责：处理报销申请、查询和审批相关接口
 */
@RestController
@RequestMapping("/expense")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;
    private final EmployeeMapper employeeMapper;

    /**
     * 获取报销表单配置
     */
    @GetMapping("/config")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','PROJECT_MANAGER','CEO')")
    public ResponseEntity<FormConfigResponse> getExpenseConfig() {
        return ResponseEntity.ok(buildExpenseConfig());
    }

    /**
     * 获取费用类型列表
     */
    @GetMapping("/types")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','PROJECT_MANAGER','CEO')")
    public ResponseEntity<List<ExpenseTypeResponse>> getExpenseTypes() {
        return ResponseEntity.ok(expenseService.getExpenseTypes());
    }

    /**
     * 提交报销申请
     */
    @PostMapping("")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','PROJECT_MANAGER','CEO')")
    public ResponseEntity<FormRecordResponse> submitExpense(
            @Valid @RequestBody ExpenseSubmitRequest request,
            Authentication authentication) {
        Long submitterId = getCurrentEmployeeId(authentication);
        if (submitterId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(expenseService.submitExpense(submitterId, request));
    }

    /**
     * 获取报销详情（通过表单ID）
     */
    @GetMapping("/{formId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','PROJECT_MANAGER','CEO')")
    public ResponseEntity<ExpenseClaimResponse> getExpenseDetail(
            @PathVariable Long formId,
            Authentication authentication) {
        Long requesterId = getCurrentEmployeeId(authentication);
        if (requesterId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(expenseService.getExpenseDetail(formId, requesterId));
    }

    /**
     * 获取我的报销记录
     */
    @GetMapping("/records")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','PROJECT_MANAGER','CEO')")
    public ResponseEntity<List<FormRecordResponse>> getMyExpenses(Authentication authentication) {
        Long currentEmployeeId = getCurrentEmployeeId(authentication);
        if (currentEmployeeId == null) {
            return ResponseEntity.badRequest().build();
        }
        String roleCode = getCurrentRoleCode(authentication);
        return ResponseEntity.ok(expenseService.getMyExpenses(currentEmployeeId, roleCode));
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

    /**
     * 构建报销表单配置
     */
    private FormConfigResponse buildExpenseConfig() {
        return new FormConfigResponse("EXPENSE", "费用报销",
                java.util.Arrays.asList(
                        new FormConfigResponse.FormField("expenseType", "报销类型", "SELECT", true, null,
                                java.util.Arrays.asList("TRAVEL", "MEAL", "ACCOMMODATION", "TRANSPORT", "OFFICE", "OTHER"), "请选择报销类型", 1),
                        new FormConfigResponse.FormField("tripStartDate", "出差开始日期", "DATE", false, null, null, "请选择出差开始日期", 2),
                        new FormConfigResponse.FormField("tripEndDate", "出差结束日期", "DATE", false, null, null, "请选择出差结束日期", 3),
                        new FormConfigResponse.FormField("tripDestination", "出差目的地", "TEXT", false, null, null, "请输入出差目的地", 4),
                        new FormConfigResponse.FormField("tripPurpose", "出差事由", "TEXTAREA", false, null, null, "请输入出差事由", 5),
                        new FormConfigResponse.FormField("totalAmount", "报销总金额", "NUMBER", true, null, null, "请输入报销总金额", 6),
                        new FormConfigResponse.FormField("remark", "备注说明", "TEXTAREA", false, null, null, "请输入备注说明", 7)
                ),
                java.util.Arrays.asList(
                        new FormConfigResponse.FormAction("submit", "提交申请", "primary",
                                java.util.Arrays.asList("EMPLOYEE", "WORKER", "FINANCE", "PROJECT_MANAGER", "CEO")),
                        new FormConfigResponse.FormAction("save", "保存草稿", "default",
                                java.util.Arrays.asList("EMPLOYEE", "WORKER", "FINANCE", "PROJECT_MANAGER", "CEO"))
                ),
                new FormConfigResponse.ApprovalFlow("EXPENSE",
                        java.util.Arrays.asList(
                                new FormConfigResponse.ApprovalFlow.FlowNode("初审", "CEO审批", "CEO", 1),
                                new FormConfigResponse.ApprovalFlow.FlowNode("终审", "财务审批", "FINANCE", 2)
                        ))
        );
    }
}
