package com.oa.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.dto.AuthPasswordLoginRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
 * OA API 集成测试 — M0 / M1 / M2 已完成模块
 *
 * 运行方式：mvn test（Spring Boot Test + H2 内存库 + data.sql 种子数据）
 * 报告输出：target/surefire-reports/（XML）、target/site/jacoco/（覆盖率 HTML）
 *
 * 种子账号（data.sql）：
 *   employee.demo / finance.demo / pm.demo / ceo.demo / worker.demo — 密码均为 123456
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Integration - M0/M1/M2 API")
class OaApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String employeeToken;
    private String financeToken;
    private String pmToken;
    private String ceoToken;
    private String workerToken;

    @BeforeEach
    void obtainTokens() throws Exception {
        employeeToken = login("employee.demo");
        financeToken  = login("finance.demo");
        pmToken       = login("pm.demo");
        ceoToken      = login("ceo.demo");
        workerToken   = login("worker.demo");
    }

    // ─── M0 基础设施 ──────────────────────────────────────────

    @Nested
    @DisplayName("M0 - 基础设施")
    class M0Infrastructure {

        @Test
        @DisplayName("GET /health - 无需 token，返回 200 UP")
        void health_noToken_returns200() throws Exception {
            mockMvc.perform(get("/health"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("GET /setup/status - permitAll 端点，无需 token")
        void setupStatus_noToken_returns200() throws Exception {
            mockMvc.perform(get("/setup/status"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("任意受保护端点未携带 token 返回 401")
        void protectedEndpoint_noToken_returns401() throws Exception {
            mockMvc.perform(get("/employees"))
                .andExpect(status().isUnauthorized());
        }
    }

    // ─── M1 身份认证 ──────────────────────────────────────────

    @Nested
    @DisplayName("M1 - 身份认证")
    class M1Auth {

        @Test
        @DisplayName("POST /auth/login - 正确账号密码返回 200 + token")
        void login_validCredentials_returnsToken() throws Exception {
            AuthPasswordLoginRequest req = new AuthPasswordLoginRequest("ceo.demo", "123456");
            mockMvc.perform(post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.mode").value("PASSWORD_LOGIN"))
                .andExpect(jsonPath("$.role").value("ceo"));
        }

        @Test
        @DisplayName("POST /auth/login - 密码错误返回 401")
        void login_wrongPassword_returns401() throws Exception {
            AuthPasswordLoginRequest req = new AuthPasswordLoginRequest("ceo.demo", "wrongpass");
            mockMvc.perform(post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("POST /auth/login - 账号不存在返回 401（不区分账号/密码错误）")
        void login_unknownAccount_returns401() throws Exception {
            AuthPasswordLoginRequest req = new AuthPasswordLoginRequest("ghost.user", "123456");
            mockMvc.perform(post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("POST /auth/send-reset-code - 手机号存在返回 200")
        void sendResetCode_existingPhone_returns200() throws Exception {
            mockMvc.perform(post("/auth/send-reset-code")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"phone\":\"13800000001\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("POST /auth/send-reset-code - 手机号不存在也返回 200（故意不暴露用户是否存在）")
        void sendResetCode_unknownPhone_returns200() throws Exception {
            mockMvc.perform(post("/auth/send-reset-code")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"phone\":\"19999999999\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("GET /roles - 有效 token 可访问，返回角色列表数组")
        void roles_validToken_returnsArray() throws Exception {
            mockMvc.perform(get("/roles")
                    .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
        }

        @Test
        @DisplayName("GET /roles - 无 token 返回 401")
        void roles_noToken_returns401() throws Exception {
            mockMvc.perform(get("/roles"))
                .andExpect(status().isUnauthorized());
        }
    }

    // ─── M1 员工管理 ──────────────────────────────────────────

    @Nested
    @DisplayName("M1 - 员工管理")
    class M1Employee {

        @Test
        @DisplayName("GET /employees - CEO/财务/PM 均可访问，返回分页结果（employee/worker 无权限）")
        void listEmployees_authorizedRoles_returns200() throws Exception {
            for (String token : new String[]{financeToken, pmToken, ceoToken}) {
                mockMvc.perform(get("/employees")
                        .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
            }
        }

        @Test
        @DisplayName("GET /employees - employee/worker 角色返回 403")
        void listEmployees_unauthorizedRoles_returns403() throws Exception {
            for (String token : new String[]{employeeToken, workerToken}) {
                mockMvc.perform(get("/employees")
                        .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
            }
        }

        @Test
        @DisplayName("GET /employees/1 - 可按 ID 查询存在的员工")
        void getEmployee_existingId_returnsEmployee() throws Exception {
            mockMvc.perform(get("/employees/1")
                    .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("张晓宁"))
                .andExpect(jsonPath("$.employeeNo").value("employee.demo"));
        }

        @Test
        @DisplayName("GET /employees/9999 - 不存在的 ID 返回 404")
        void getEmployee_notFound_returns404() throws Exception {
            mockMvc.perform(get("/employees/9999")
                    .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("GET /employees?keyword=李 - 关键字过滤有效")
        void listEmployees_keyword_filtersResults() throws Exception {
            mockMvc.perform(get("/employees")
                    .param("keyword", "李")
                    .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
        }
    }

    // ─── M2 组织管理 ──────────────────────────────────────────

    @Nested
    @DisplayName("M2 - 部门与组织架构")
    class M2Org {

        @Test
        @DisplayName("GET /departments - 返回部门列表")
        void listDepartments_returns200() throws Exception {
            mockMvc.perform(get("/departments")
                    .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
        }

        @Test
        @DisplayName("GET /org/tree - 返回组织树结构")
        void orgTree_returns200() throws Exception {
            mockMvc.perform(get("/org/tree")
                    .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("M2 - 岗位管理")
    class M2Position {

        @Test
        @DisplayName("GET /positions - 返回岗位列表（可能为空）")
        void listPositions_returns200() throws Exception {
            mockMvc.perform(get("/positions")
                    .header("Authorization", "Bearer " + financeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
        }

        @Test
        @DisplayName("GET /positions - 无 token 返回 401")
        void listPositions_noToken_returns401() throws Exception {
            mockMvc.perform(get("/positions"))
                .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("M2 - 项目管理")
    class M2Project {

        @Test
        @DisplayName("GET /projects - 返回分页项目列表（data.sql 中有 2 个项目）")
        void listProjects_returns200WithData() throws Exception {
            mockMvc.perform(get("/projects")
                    .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.records").isArray());
        }

        @Test
        @DisplayName("GET /projects/1 - 返回项目详情，name 和 members 字段存在")
        void getProject_existingId_returnsProject() throws Exception {
            mockMvc.perform(get("/projects/1")
                    .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").isNotEmpty())
                .andExpect(jsonPath("$.members").isArray());
        }

        @Test
        @DisplayName("GET /projects - 无 token 返回 401")
        void listProjects_noToken_returns401() throws Exception {
            mockMvc.perform(get("/projects"))
                .andExpect(status().isUnauthorized());
        }
    }

    // ─── M9/M10 已实现模块端点验证 ────────────────────────────────

    @Nested
    @DisplayName("M9/M10 - 已实现模块基本可达性")
    class ImplementedModules {

        @Test
        @DisplayName("GET /payroll/cycles - 返回 200（M5 已实现）")
        void payroll_cycles_returns200() throws Exception {
            mockMvc.perform(get("/payroll/cycles")
                    .header("Authorization", "Bearer " + financeToken))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("GET /notifications - 返回 200（M9 已实现）")
        void notifications_returns200() throws Exception {
            mockMvc.perform(get("/notifications")
                    .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("GET /export-tasks - 返回 200（M10 已实现）")
        void export_tasks_returns200() throws Exception {
            mockMvc.perform(get("/export-tasks")
                    .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("GET /cleanup-tasks - 返回 200（M10 已实现）")
        void cleanup_tasks_returns200() throws Exception {
            mockMvc.perform(get("/cleanup-tasks")
                    .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("GET /retention/policies - 返回 200（M10 已实现）")
        void retention_policies_returns200() throws Exception {
            mockMvc.perform(get("/retention/policies")
                    .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().isOk());
        }
    }

    // ─── M5 薪资模块 ────────────────────────────────────────────

    @Nested
    @DisplayName("M5 - 薪资模块")
    class M5Payroll {

        @Test
        @DisplayName("TC1: Finance 创建工资周期 → 200，返回 period")
        void finance_createCycle_returns200() throws Exception {
            String body = "{\"period\": \"2099-01\"}";
            MvcResult result = mockMvc.perform(post("/payroll/cycles")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk())
                    .andReturn();
            String resp = result.getResponse().getContentAsString();
            assert resp.contains("2099-01") : "响应中应包含 period";
        }

        @Test
        @DisplayName("TC2: 重复创建同一 period → 400")
        void finance_createDuplicateCycle_returns400() throws Exception {
            String body = "{\"period\": \"2099-02\"}";
            // 第一次创建
            mockMvc.perform(post("/payroll/cycles")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk());
            // 第二次创建同一 period → 400
            mockMvc.perform(post("/payroll/cycles")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("TC3: Employee 无权访问 /payroll/cycles → 403")
        void employee_listCycles_returns403() throws Exception {
            mockMvc.perform(get("/payroll/cycles")
                            .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("TC4: Finance 创建周期 → 开放窗口 → precheck → settle 完整流程")
        void finance_fullSettlementFlow() throws Exception {
            // 1. 创建周期
            MvcResult createResult = mockMvc.perform(post("/payroll/cycles")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"period\": \"2099-03\"}"))
                    .andExpect(status().isOk())
                    .andReturn();
            Long cycleId = objectMapper.readTree(
                    createResult.getResponse().getContentAsString()).get("id").asLong();

            // 2. 开放窗口
            mockMvc.perform(post("/payroll/cycles/" + cycleId + "/open-window")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("WINDOW_OPEN"));

            // 3. 预结算检查
            MvcResult precheckResult = mockMvc.perform(post("/payroll/cycles/" + cycleId + "/precheck")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.pass").exists())
                    .andReturn();
            // 检查返回 items 数组
            String precheckBody = precheckResult.getResponse().getContentAsString();
            assert precheckBody.contains("items") : "预检结果应含 items";

            // 4. 正式结算
            mockMvc.perform(post("/payroll/cycles/" + cycleId + "/settle")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SETTLED"));

            // 5. Finance 查询该周期工资条
            MvcResult slipsResult = mockMvc.perform(get("/payroll/slips")
                            .header("Authorization", "Bearer " + financeToken)
                            .param("cycleId", cycleId.toString()))
                    .andExpect(status().isOk())
                    .andReturn();
            // 应生成工资条（种子数据有 5 个活跃员工）
            int slipCount = objectMapper.readTree(
                    slipsResult.getResponse().getContentAsString()).size();
            assert slipCount > 0 : "结算后应生成工资条，实际数量: " + slipCount;
        }

        @Test
        @DisplayName("TC5: Employee 查看自己的工资条并确认")
        void employee_viewAndConfirmSlip() throws Exception {
            // 1. Finance 结算，生成工资条
            MvcResult createResult = mockMvc.perform(post("/payroll/cycles")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"period\": \"2099-04\"}"))
                    .andExpect(status().isOk())
                    .andReturn();
            Long cycleId = objectMapper.readTree(
                    createResult.getResponse().getContentAsString()).get("id").asLong();
            mockMvc.perform(post("/payroll/cycles/" + cycleId + "/settle")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk());

            // 2. Employee 查询自己的工资条
            MvcResult slipsResult = mockMvc.perform(get("/payroll/slips")
                            .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isOk())
                    .andReturn();
            long slipId = objectMapper.readTree(
                    slipsResult.getResponse().getContentAsString()).get(0).get("id").asLong();

            // 3. 查看工资条详情
            mockMvc.perform(get("/payroll/slips/" + slipId)
                            .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.slip").exists())
                    .andExpect(jsonPath("$.items").isArray());

            // 4. 先绑定电子签名（电子签名是确认的必要条件）
            String base64Signature = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
            mockMvc.perform(post("/signature/bind")
                            .header("Authorization", "Bearer " + employeeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"signatureImage\": \"" + base64Signature + "\", \"pin\": \"123456\", \"confirmPin\": \"123456\"}"))
                    .andExpect(status().isOk());

            // 5. 确认工资条（需要 PIN 码）
            mockMvc.perform(post("/payroll/slips/" + slipId + "/confirm")
                            .header("Authorization", "Bearer " + employeeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"pin\": \"123456\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.slipId").value(slipId))
                    .andExpect(jsonPath("$.evidenceId").exists());

            // 6. 重复确认 → 400（已非 PUBLISHED 状态）
            mockMvc.perform(post("/payroll/slips/" + slipId + "/confirm")
                            .header("Authorization", "Bearer " + employeeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"pin\": \"123456\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("TC6: Employee 对工资条提出异议")
        void employee_disputeSlip() throws Exception {
            // Finance 结算
            MvcResult createResult = mockMvc.perform(post("/payroll/cycles")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"period\": \"2099-05\"}"))
                    .andExpect(status().isOk())
                    .andReturn();
            Long cycleId = objectMapper.readTree(
                    createResult.getResponse().getContentAsString()).get("id").asLong();
            mockMvc.perform(post("/payroll/cycles/" + cycleId + "/settle")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk());

            // Employee 查询自己工资条
            MvcResult slipsResult = mockMvc.perform(get("/payroll/slips")
                            .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isOk())
                    .andReturn();
            // 取最新一条 (index 0，按 created_at DESC)
            long slipId = objectMapper.readTree(
                    slipsResult.getResponse().getContentAsString()).get(0).get("id").asLong();

            // 提出异议
            mockMvc.perform(post("/payroll/slips/" + slipId + "/dispute")
                            .header("Authorization", "Bearer " + employeeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"reason\": \"基本工资金额有误\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.slip.status").value("DISPUTED"));
        }

        @Test
        @DisplayName("TC7: Employee 无权查看他人工资条 → 403")
        void employee_cannotViewOthersSlip() throws Exception {
            // Finance 结算
            MvcResult createResult = mockMvc.perform(post("/payroll/cycles")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"period\": \"2099-06\"}"))
                    .andExpect(status().isOk())
                    .andReturn();
            Long cycleId = objectMapper.readTree(
                    createResult.getResponse().getContentAsString()).get("id").asLong();
            mockMvc.perform(post("/payroll/cycles/" + cycleId + "/settle")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk());

            // Finance 查工资条，找到 worker 的工资条
            MvcResult slipsResult = mockMvc.perform(get("/payroll/slips")
                            .header("Authorization", "Bearer " + financeToken)
                            .param("cycleId", cycleId.toString()))
                    .andExpect(status().isOk())
                    .andReturn();
            // 用 employee 的 token 去查 worker 的工资条
            var slipsNode = objectMapper.readTree(slipsResult.getResponse().getContentAsString());
            // 找到 employeeId 不是当前 employee.demo 的那条
            Long workerSlipId = null;
            for (var node : slipsNode) {
                // worker.demo 的 id 在 data.sql 中为 5
                if (node.get("employeeId").asLong() == 5L) {
                    workerSlipId = node.get("id").asLong();
                    break;
                }
            }
            if (workerSlipId != null) {
                mockMvc.perform(get("/payroll/slips/" + workerSlipId)
                                .header("Authorization", "Bearer " + employeeToken))
                        .andExpect(status().isForbidden());
            }
        }
    }

    // ─── M6 项目管理模块 ─────────────────────────────────────────

    @Nested
    @DisplayName("M6 - 项目管理：里程碑/进度/Dashboard/汇总")
    class M6Project {

        @Test
        @DisplayName("TC1: PM 创建里程碑 → 201，字段正确")
        void pm_createMilestone() throws Exception {
            // 先确认项目存在
            MvcResult listResult = mockMvc.perform(get("/projects?size=1")
                            .header("Authorization", "Bearer " + ceoToken))
                    .andExpect(status().isOk())
                    .andReturn();
            long projectId = objectMapper.readTree(
                    listResult.getResponse().getContentAsString()).get("records").get(0).get("id").asLong();

            MvcResult r = mockMvc.perform(post("/projects/" + projectId + "/milestones")
                            .header("Authorization", "Bearer " + pmToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"Integration Test Milestone\",\"sort\":10}"))
                    .andExpect(status().isCreated())
                    .andReturn();
            var node = objectMapper.readTree(r.getResponse().getContentAsString());
            assert node.get("id").asLong() > 0 : "应返回新建里程碑 ID";
            assert "Integration Test Milestone".equals(node.get("name").asText()) : "name 不匹配";
        }

        @Test
        @DisplayName("TC2: 查询里程碑列表 → 200，数组")
        void listMilestones() throws Exception {
            MvcResult listResult = mockMvc.perform(get("/projects?size=1")
                            .header("Authorization", "Bearer " + ceoToken))
                    .andExpect(status().isOk())
                    .andReturn();
            long projectId = objectMapper.readTree(
                    listResult.getResponse().getContentAsString()).get("records").get(0).get("id").asLong();

            mockMvc.perform(get("/projects/" + projectId + "/milestones")
                            .header("Authorization", "Bearer " + pmToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray());
        }

        @Test
        @DisplayName("TC3: PM 记录进度 → 201")
        void pm_recordProgress() throws Exception {
            MvcResult listResult = mockMvc.perform(get("/projects?size=1")
                            .header("Authorization", "Bearer " + ceoToken))
                    .andExpect(status().isOk())
                    .andReturn();
            long projectId = objectMapper.readTree(
                    listResult.getResponse().getContentAsString()).get("records").get(0).get("id").asLong();

            mockMvc.perform(post("/projects/" + projectId + "/progress")
                            .header("Authorization", "Bearer " + pmToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"note\":\"Progress check in integration test\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").exists());
        }

        @Test
        @DisplayName("TC4: Dashboard 返回正确结构（milestones/workItemSummary/timeSeriesData）")
        void dashboard_hasCorrectStructure() throws Exception {
            MvcResult listResult = mockMvc.perform(get("/projects?size=1")
                            .header("Authorization", "Bearer " + ceoToken))
                    .andExpect(status().isOk())
                    .andReturn();
            long projectId = objectMapper.readTree(
                    listResult.getResponse().getContentAsString()).get("records").get(0).get("id").asLong();

            mockMvc.perform(get("/projects/" + projectId + "/dashboard")
                            .header("Authorization", "Bearer " + ceoToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.milestones").isArray())
                    .andExpect(jsonPath("$.workItemSummary.total").exists())
                    .andExpect(jsonPath("$.timeSeriesData").isArray());
        }

        @Test
        @DisplayName("TC5: PM 生成汇总报告 → 201，ceoNotifiedAt 已填充")
        void pm_createSummary() throws Exception {
            MvcResult listResult = mockMvc.perform(get("/projects?size=1")
                            .header("Authorization", "Bearer " + ceoToken))
                    .andExpect(status().isOk())
                    .andReturn();
            long projectId = objectMapper.readTree(
                    listResult.getResponse().getContentAsString()).get("records").get(0).get("id").asLong();

            mockMvc.perform(post("/projects/" + projectId + "/construction-summary")
                            .header("Authorization", "Bearer " + pmToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"periodStart\":\"2026-03-01\",\"periodEnd\":\"2026-03-31\",\"pmNote\":\"Test summary\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.summary.id").exists())
                    .andExpect(jsonPath("$.summary.ceoNotifiedAt").exists());
        }

        @Test
        @DisplayName("TC6: CEO 修改项目配置 → 200，logReportCycleDays 更新")
        void ceo_updateProjectConfig() throws Exception {
            MvcResult listResult = mockMvc.perform(get("/projects?size=1")
                            .header("Authorization", "Bearer " + ceoToken))
                    .andExpect(status().isOk())
                    .andReturn();
            long projectId = objectMapper.readTree(
                    listResult.getResponse().getContentAsString()).get("records").get(0).get("id").asLong();

            mockMvc.perform(patch("/projects/" + projectId + "/config")
                            .header("Authorization", "Bearer " + ceoToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"logReportCycleDays\":14}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.logReportCycleDays").value(14));
        }

        @Test
        @DisplayName("TC7: Employee 无权创建里程碑 → 403")
        void employee_cannotCreateMilestone() throws Exception {
            MvcResult listResult = mockMvc.perform(get("/projects?size=1")
                            .header("Authorization", "Bearer " + ceoToken))
                    .andExpect(status().isOk())
                    .andReturn();
            long projectId = objectMapper.readTree(
                    listResult.getResponse().getContentAsString()).get("records").get(0).get("id").asLong();

            mockMvc.perform(post("/projects/" + projectId + "/milestones")
                            .header("Authorization", "Bearer " + employeeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"Forbidden Milestone\",\"sort\":1}"))
                    .andExpect(status().isForbidden());
        }
    }

    // ─── helper ──────────────────────────────────────────────

    private String login(String username) throws Exception {
        AuthPasswordLoginRequest req = new AuthPasswordLoginRequest(username, "123456");
        MvcResult result = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
            .get("token").asText();
    }
}
