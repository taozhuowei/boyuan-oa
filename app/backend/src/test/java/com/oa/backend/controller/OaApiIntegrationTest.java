package com.oa.backend.controller;

import com.oa.backend.dto.AuthPasswordLoginRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * OA 系统 API 集成测试
 * 测试所有业务 API 的权限控制和基本功能
 */
@SpringBootTest
@AutoConfigureMockMvc
public class OaApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String employeeToken;
    private String workerToken;
    private String financeToken;
    private String pmToken;
    private String ceoToken;

    @BeforeEach
    void setUp() throws Exception {
        // 获取各角色的 JWT Token
        employeeToken = login("employee.demo", "123456");
        workerToken = login("worker.demo", "123456");
        financeToken = login("finance.demo", "123456");
        pmToken = login("pm.demo", "123456");
        ceoToken = login("ceo.demo", "123456");
    }

    private String login(String username, String password) throws Exception {
        AuthPasswordLoginRequest request = new AuthPasswordLoginRequest(username, password);
        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();
        String response = result.getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }

    // ==================== 员工管理 API 测试 ====================

    @Test
    @DisplayName("GET /employees - 员工列表权限测试")
    void testListEmployees() throws Exception {
        // 员工可以访问
        mockMvc.perform(get("/employees")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // 劳工可以访问
        mockMvc.perform(get("/employees")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk());

        // 未认证不能访问
        mockMvc.perform(get("/employees"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /employees/{id} - 员工详情权限测试")
    void testGetEmployee() throws Exception {
        mockMvc.perform(get("/employees/1")
                        .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").exists());
    }

    // ==================== 工作台 API 测试 ====================

    @Test
    @DisplayName("GET /me/profile - 获取个人资料")
    void testGetMyProfile() throws Exception {
        mockMvc.perform(get("/me/profile")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/me/profile")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /workbench/config - 获取工作台配置")
    void testGetWorkbenchConfig() throws Exception {
        // 员工工作台配置
        mockMvc.perform(get("/workbench/config")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.menus").isArray());

        // CEO 工作台配置
        mockMvc.perform(get("/workbench/config")
                        .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.menus").isArray());
    }

    // ==================== 项目管理 API 测试 ====================

    @Test
    @DisplayName("GET /projects - 项目列表")
    void testListProjects() throws Exception {
        mockMvc.perform(get("/projects")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/projects"))
                .andExpect(status().isUnauthorized());
    }

    // ==================== 通讯录导入 API 测试 ====================

    @Test
    @DisplayName("POST /directory/import-preview - 通讯录导入预览权限")
    void testDirectoryImportPreview() throws Exception {
        String requestBody = """
                {
                    "records": [
                        {"name": "测试1", "phone": "13800138001", "department": "技术部"},
                        {"name": "", "phone": "13800138002", "department": "技术部"},
                        {"name": "测试3", "phone": "invalid", "department": "技术部"}
                    ]
                }
                """;

        // 财务可以访问
        mockMvc.perform(post("/directory/import-preview")
                        .header("Authorization", "Bearer " + financeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCount").value(3))
                .andExpect(jsonPath("$.validCount").value(1))
                .andExpect(jsonPath("$.invalidCount").value(2));

        // 员工不能访问
        mockMvc.perform(post("/directory/import-preview")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /directory/import-apply - 通讯录导入应用权限")
    void testDirectoryImportApply() throws Exception {
        String requestBody = """
                {
                    "selectedIndices": [0, 1]
                }
                """;

        // 财务可以访问
        mockMvc.perform(post("/directory/import-apply")
                        .header("Authorization", "Bearer " + financeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());

        // 员工不能访问
        mockMvc.perform(post("/directory/import-apply")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isForbidden());
    }

    // ==================== 表单中心 API 测试 ====================

    @Test
    @DisplayName("GET /forms/config - 表单配置")
    void testGetFormConfig() throws Exception {
        mockMvc.perform(get("/forms/config")
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("formType", "LEAVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.formType").value("LEAVE"));
    }

    @Test
    @DisplayName("GET /forms/todo - 待办表单")
    void testGetTodoForms() throws Exception {
        // CEO 和项目经理可以看到待办
        mockMvc.perform(get("/forms/todo")
                        .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/forms/todo")
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk());

        // 普通员工看到空列表
        mockMvc.perform(get("/forms/todo")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /forms/history - 表单历史")
    void testGetFormHistory() throws Exception {
        mockMvc.perform(get("/forms/history")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /forms/leave - 提交请假申请")
    void testSubmitLeave() throws Exception {
        String requestBody = """
                {
                    "formType": "LEAVE",
                    "formData": {
                        "leaveType": "年假",
                        "startDate": "2024-04-01",
                        "endDate": "2024-04-03",
                        "days": 3,
                        "reason": "家中有事"
                    },
                    "remark": "请审批"
                }
                """;

        mockMvc.perform(post("/forms/leave")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.formNo").exists())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @DisplayName("POST /forms/overtime - 提交加班申请")
    void testSubmitOvertime() throws Exception {
        String requestBody = """
                {
                    "formType": "OVERTIME",
                    "formData": {
                        "overtimeDate": "2024-04-01",
                        "startTime": "18:00",
                        "endTime": "21:00",
                        "hours": 3,
                        "reason": "项目赶工"
                    },
                    "remark": ""
                }
                """;

        mockMvc.perform(post("/forms/overtime")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /forms/injury - 工伤补偿申请权限")
    void testSubmitInjury() throws Exception {
        String requestBody = """
                {
                    "formType": "INJURY",
                    "formData": {
                        "injuryDate": "2024-03-28",
                        "injuryLocation": "工地A区",
                        "injuryDesc": "摔倒擦伤",
                        "medicalFee": 500,
                        "compensation": 1000
                    }
                }
                """;

        // 劳工可以提交
        mockMvc.perform(post("/forms/injury")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());

        // 普通员工不能提交
        mockMvc.perform(post("/forms/injury")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /forms/log - 施工日志权限")
    void testSubmitLog() throws Exception {
        String requestBody = """
                {
                    "formType": "LOG",
                    "formData": {
                        "logDate": "2024-03-28",
                        "project": "绿地中心大厦",
                        "weather": "晴",
                        "workContent": "完成基础施工",
                        "progress": 30,
                        "problems": "无"
                    }
                }
                """;

        // 劳工可以提交
        mockMvc.perform(post("/forms/log")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());

        // 普通员工不能提交
        mockMvc.perform(post("/forms/log")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isForbidden());
    }

    // ==================== 薪资管理 API 测试 ====================

    @Test
    @DisplayName("GET /payroll/cycles - 工资周期列表权限")
    void testListPayrollCycles() throws Exception {
        // 财务和CEO可以查看
        mockMvc.perform(get("/payroll/cycles")
                        .header("Authorization", "Bearer " + financeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/payroll/cycles")
                        .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk());

        // 普通员工不能查看
        mockMvc.perform(get("/payroll/cycles")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /payroll/slips - 工资单列表")
    void testListPayrollSlips() throws Exception {
        // 员工只能查看自己的
        mockMvc.perform(get("/payroll/slips")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk());

        // 财务可以查看所有
        mockMvc.perform(get("/payroll/slips")
                        .header("Authorization", "Bearer " + financeToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /payroll/cycles/{id}/precheck - 预结算权限")
    void testPrecheckPayrollCycle() throws Exception {
        // 财务可以执行（使用未锁定的周期3）
        mockMvc.perform(post("/payroll/cycles/3/precheck")
                        .header("Authorization", "Bearer " + financeToken))
                .andExpect(status().isOk());

        // 员工不能执行
        mockMvc.perform(post("/payroll/cycles/3/precheck")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /payroll/cycles/{id}/settle - 正式结算权限")
    void testSettlePayrollCycle() throws Exception {
        mockMvc.perform(post("/payroll/cycles/3/settle")
                        .header("Authorization", "Bearer " + financeToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /payroll/cycles/{id}/recalculate - 重新计算权限")
    void testRecalculatePayrollCycle() throws Exception {
        mockMvc.perform(post("/payroll/cycles/1/recalculate")
                        .header("Authorization", "Bearer " + financeToken))
                .andExpect(status().isOk());
    }

    // ==================== 数据保留 API 测试 ====================

    @Test
    @DisplayName("GET /retention/policies - 保留策略权限")
    void testListRetentionPolicies() throws Exception {
        // CEO 可以访问
        mockMvc.perform(get("/retention/policies")
                        .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // 其他角色不能访问
        mockMvc.perform(get("/retention/policies")
                        .header("Authorization", "Bearer " + financeToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /retention/policies/extend - 延期权限")
    void testExtendRetentionPolicy() throws Exception {
        String requestBody = """
                {
                    "policyId": 1,
                    "extendDays": 30,
                    "reason": "审计需要"
                }
                """;

        mockMvc.perform(post("/retention/policies/extend")
                        .header("Authorization", "Bearer " + ceoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /retention/reminders - 到期提醒权限")
    void testListRetentionReminders() throws Exception {
        mockMvc.perform(get("/retention/reminders")
                        .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk());
    }

    // ==================== 备份清理 API 测试 ====================

    @Test
    @DisplayName("GET /backup/tasks - 备份任务权限")
    void testListBackupTasks() throws Exception {
        mockMvc.perform(get("/backup/tasks")
                        .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/backup/tasks")
                        .header("Authorization", "Bearer " + financeToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /backup/tasks - 创建备份任务权限")
    void testCreateBackupTask() throws Exception {
        String requestBody = """
                {
                    "dataScope": "FORM_RECORD",
                    "taskName": "测试备份",
                    "dataTypes": ["LEAVE", "OVERTIME"],
                    "compress": true
                }
                """;

        mockMvc.perform(post("/backup/tasks")
                        .header("Authorization", "Bearer " + ceoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /backup/tasks/{id}/retry - 重试备份任务")
    void testRetryBackupTask() throws Exception {
        mockMvc.perform(post("/backup/tasks/1/retry")
                        .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /cleanup/tasks - 清理任务权限")
    void testListCleanupTasks() throws Exception {
        mockMvc.perform(get("/cleanup/tasks")
                        .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /cleanup/tasks - 创建清理任务")
    void testCreateCleanupTask() throws Exception {
        mockMvc.perform(post("/cleanup/tasks")
                        .header("Authorization", "Bearer " + ceoToken)
                        .param("dataCategory", "FORM_RECORD"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /cleanup/tasks/{id}/retry - 重试清理任务")
    void testRetryCleanupTask() throws Exception {
        mockMvc.perform(post("/cleanup/tasks/1/retry")
                        .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk());
    }

    // ==================== 通知 API 测试 ====================

    @Test
    @DisplayName("GET /notifications - 通知列表")
    void testListNotifications() throws Exception {
        mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/notifications"))
                .andExpect(status().isUnauthorized());
    }
}
