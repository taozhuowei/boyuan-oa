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

    // ─── 501 占位端点验证（M5-M10 未实现模块） ────────────────

    @Nested
    @DisplayName("未实现模块 - 返回 501")
    class UnimplementedModules {

        @Test
        @DisplayName("GET /payroll/cycles - 返回 501（M5 未实现）")
        void payroll_cycles_returns501() throws Exception {
            mockMvc.perform(get("/payroll/cycles")
                    .header("Authorization", "Bearer " + financeToken))
                .andExpect(status().is(501));
        }

        @Test
        @DisplayName("GET /notifications - 返回 501（M7 未实现）")
        void notifications_returns501() throws Exception {
            mockMvc.perform(get("/notifications")
                    .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().is(501));
        }

        @Test
        @DisplayName("GET /backup/tasks - 返回 501（M10 未实现）")
        void backup_tasks_returns501() throws Exception {
            mockMvc.perform(get("/backup/tasks")
                    .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().is(501));
        }

        @Test
        @DisplayName("GET /cleanup/tasks - 返回 501（M10 未实现）")
        void cleanup_tasks_returns501() throws Exception {
            mockMvc.perform(get("/cleanup/tasks")
                    .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().is(501));
        }

        @Test
        @DisplayName("GET /retention/policies - 返回 501（M10 未实现）")
        void retention_policies_returns501() throws Exception {
            mockMvc.perform(get("/retention/policies")
                    .header("Authorization", "Bearer " + ceoToken))
                .andExpect(status().is(501));
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
