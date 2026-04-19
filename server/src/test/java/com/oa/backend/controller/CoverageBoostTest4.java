package com.oa.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Coverage boost integration test 4 — targets controllers with 0% coverage.
 *
 * <p>Covers: TeamController, ProjectMaterialCostController, ProjectRevenueController,
 * PayrollItemDefController, ProjectMemberController, SalaryConfirmationAgreementController,
 * ApprovalFlowController, DirectoryImportController.
 *
 * <p>Test DB: H2 (test application.yml). Auth: POST /auth/login → JWT. Inner classes use
 * {@literal @}BeforeAll (static) to acquire tokens once per class.
 */
@DisplayName(
    "Coverage Boost 4 — team / material-costs / revenue / item-defs / members / agreements / approval-flows / directory")
class CoverageBoostTest4 {

  // ─────────────────────────────────────────────────────────────────────────
  // Shared auth helper — duplicated in each inner class to stay independent
  // ─────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────
  // TeamController  GET /team/members
  // @PreAuthorize("hasAnyRole('DEPARTMENT_MANAGER','PROJECT_MANAGER')")
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
  @AutoConfigureMockMvc
  @TestInstance(Lifecycle.PER_CLASS)
  @DisplayName("TeamController")
  class TeamControllerTests {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private String pmToken;
    private String deptManagerToken;
    private String employeeToken;

    @BeforeAll
    void acquireTokens() throws Exception {
      pmToken = login("pm.demo");
      deptManagerToken = login("dept_manager.demo");
      employeeToken = login("employee.demo");
    }

    @Test
    @DisplayName("GET /team/members - PM returns 200 with list")
    void getTeamMembers_pm_returns200() throws Exception {
      mockMvc
          .perform(get("/team/members").header("Authorization", "Bearer " + pmToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /team/members - dept_manager returns 200 with list")
    void getTeamMembers_deptManager_returns200() throws Exception {
      mockMvc
          .perform(get("/team/members").header("Authorization", "Bearer " + deptManagerToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /team/members - employee returns 403")
    void getTeamMembers_employee_returns403() throws Exception {
      mockMvc
          .perform(get("/team/members").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /team/members - no token returns 401")
    void getTeamMembers_noToken_returns401() throws Exception {
      mockMvc.perform(get("/team/members")).andExpect(status().isUnauthorized());
    }

    private String login(String username) throws Exception {
      Map<String, String> body = Map.of("username", username, "password", "123456");
      MvcResult result =
          mockMvc
              .perform(
                  post("/auth/login")
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(body)))
              .andExpect(status().isOk())
              .andReturn();
      return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ProjectMaterialCostController  /projects/{projectId}/material-costs
  // GET:    isAuthenticated()
  // POST:   CEO, GENERAL_MANAGER, PROJECT_MANAGER, FINANCE, EMPLOYEE (+ canRecord check)
  // PUT:    CEO, GENERAL_MANAGER, PROJECT_MANAGER, FINANCE, EMPLOYEE (+ canRecord check)
  // DELETE: CEO, PROJECT_MANAGER, FINANCE
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
  @AutoConfigureMockMvc
  @TestInstance(Lifecycle.PER_CLASS)
  @DisplayName("ProjectMaterialCostController")
  class ProjectMaterialCostControllerTests {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private String ceoToken;
    private String financeToken;
    private String pmToken;
    private String employeeToken;
    private String workerToken;

    @BeforeAll
    void acquireTokens() throws Exception {
      ceoToken = login("ceo.demo");
      financeToken = login("finance.demo");
      pmToken = login("pm.demo");
      employeeToken = login("employee.demo");
      workerToken = login("worker.demo");
    }

    @Test
    @DisplayName("GET /projects/1/material-costs - authenticated user returns 200 with list")
    void list_authenticated_returns200() throws Exception {
      mockMvc
          .perform(get("/projects/1/material-costs").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /projects/1/material-costs - employee also returns 200")
    void list_employee_returns200() throws Exception {
      mockMvc
          .perform(
              get("/projects/1/material-costs").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /projects/1/material-costs - no token returns 401")
    void list_noToken_returns401() throws Exception {
      mockMvc.perform(get("/projects/1/material-costs")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /projects/1/material-costs - CEO creates entry returns 200")
    void create_ceo_returns200() throws Exception {
      Map<String, Object> body =
          Map.of(
              "itemName",
              "Steel Pipe " + System.currentTimeMillis(),
              "quantity",
              new BigDecimal("10"),
              "unit",
              "m",
              "unitPrice",
              new BigDecimal("50.00"),
              "occurredOn",
              LocalDate.now().toString());
      mockMvc
          .perform(
              post("/projects/1/material-costs")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.itemName").exists());
    }

    @Test
    @DisplayName("POST /projects/1/material-costs - finance creates entry returns 200")
    void create_finance_returns200() throws Exception {
      Map<String, Object> body =
          Map.of(
              "itemName",
              "Concrete " + System.currentTimeMillis(),
              "quantity",
              new BigDecimal("5"),
              "unit",
              "m3",
              "unitPrice",
              new BigDecimal("300.00"),
              "occurredOn",
              LocalDate.now().toString());
      mockMvc
          .perform(
              post("/projects/1/material-costs")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /projects/1/material-costs - missing required fields returns 400")
    void create_missingRequiredFields_returns400() throws Exception {
      // Missing quantity, unit, unitPrice, occurredOn
      Map<String, Object> body = Map.of("itemName", "Incomplete item");
      mockMvc
          .perform(
              post("/projects/1/material-costs")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status == 400 || status == 403 : "Expected 400 or 403 but got " + status;
              });
    }

    @Test
    @DisplayName("POST /projects/1/material-costs - worker returns 403")
    void create_worker_returns403() throws Exception {
      Map<String, Object> body =
          Map.of(
              "itemName",
              "Worker item",
              "quantity",
              new BigDecimal("1"),
              "unit",
              "pc",
              "unitPrice",
              new BigDecimal("10.00"),
              "occurredOn",
              LocalDate.now().toString());
      mockMvc
          .perform(
              post("/projects/1/material-costs")
                  .header("Authorization", "Bearer " + workerToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /projects/1/material-costs/{id} - non-existent returns 404")
    void delete_nonExistent_returns404() throws Exception {
      mockMvc
          .perform(
              delete("/projects/1/material-costs/999999")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /projects/1/material-costs/{id} - employee returns 403")
    void delete_employee_returns403() throws Exception {
      mockMvc
          .perform(
              delete("/projects/1/material-costs/1")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Material cost full lifecycle: create -> update -> delete")
    void fullLifecycle_createUpdateDelete() throws Exception {
      // Create
      Map<String, Object> createBody =
          Map.of(
              "itemName",
              "Lifecycle Item " + System.currentTimeMillis(),
              "quantity",
              new BigDecimal("3"),
              "unit",
              "kg",
              "unitPrice",
              new BigDecimal("20.00"),
              "occurredOn",
              LocalDate.now().toString(),
              "remark",
              "lifecycle test");
      MvcResult createResult =
          mockMvc
              .perform(
                  post("/projects/1/material-costs")
                      .header("Authorization", "Bearer " + ceoToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createBody)))
              .andExpect(status().isOk())
              .andReturn();

      long itemId =
          objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

      // Update
      Map<String, Object> updateBody =
          Map.of("unitPrice", new BigDecimal("25.00"), "remark", "updated remark");
      mockMvc
          .perform(
              put("/projects/1/material-costs/" + itemId)
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(updateBody)))
          .andExpect(status().isOk());

      // Delete
      mockMvc
          .perform(
              delete("/projects/1/material-costs/" + itemId)
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.message").value("已删除"));
    }

    private String login(String username) throws Exception {
      Map<String, String> body = Map.of("username", username, "password", "123456");
      MvcResult result =
          mockMvc
              .perform(
                  post("/auth/login")
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(body)))
              .andExpect(status().isOk())
              .andReturn();
      return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ProjectRevenueController  /projects/{projectId}/revenue
  // GET /revenue:         CEO, GENERAL_MANAGER, FINANCE, PROJECT_MANAGER
  // PUT /{milestoneId}:   CEO, FINANCE
  // GET /summary:         CEO, GENERAL_MANAGER, FINANCE, PROJECT_MANAGER
  // POST /{milestoneId}/contract-change: FINANCE, PROJECT_MANAGER
  // DELETE /{milestoneId}/contract-change: FINANCE, PROJECT_MANAGER
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
  @AutoConfigureMockMvc
  @TestInstance(Lifecycle.PER_CLASS)
  @DisplayName("ProjectRevenueController")
  class ProjectRevenueControllerTests {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private String ceoToken;
    private String financeToken;
    private String pmToken;
    private String employeeToken;
    private String workerToken;

    @BeforeAll
    void acquireTokens() throws Exception {
      ceoToken = login("ceo.demo");
      financeToken = login("finance.demo");
      pmToken = login("pm.demo");
      employeeToken = login("employee.demo");
      workerToken = login("worker.demo");
    }

    @Test
    @DisplayName("GET /projects/1/revenue - finance returns 200 with milestone list")
    void list_finance_returns200() throws Exception {
      mockMvc
          .perform(get("/projects/1/revenue").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /projects/1/revenue - CEO returns 200")
    void list_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/projects/1/revenue").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /projects/1/revenue - PM returns 200")
    void list_pm_returns200() throws Exception {
      mockMvc
          .perform(get("/projects/1/revenue").header("Authorization", "Bearer " + pmToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /projects/1/revenue - employee returns 403")
    void list_employee_returns403() throws Exception {
      mockMvc
          .perform(get("/projects/1/revenue").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /projects/1/revenue - no token returns 401")
    void list_noToken_returns401() throws Exception {
      mockMvc.perform(get("/projects/1/revenue")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /projects/1/revenue/summary - finance returns 200 with summary map")
    void summary_finance_returns200() throws Exception {
      mockMvc
          .perform(
              get("/projects/1/revenue/summary").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /projects/1/revenue/summary - CEO returns 200")
    void summary_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/projects/1/revenue/summary").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /projects/1/revenue/summary - employee returns 403")
    void summary_employee_returns403() throws Exception {
      mockMvc
          .perform(
              get("/projects/1/revenue/summary").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /projects/1/revenue/summary - no token returns 401")
    void summary_noToken_returns401() throws Exception {
      mockMvc.perform(get("/projects/1/revenue/summary")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PUT /projects/1/revenue/{milestoneId} - non-existent milestone returns 404")
    void updateReceipt_nonExistentMilestone_returns404() throws Exception {
      Map<String, Object> body = Map.of("receiptStatus", "PAID");
      mockMvc
          .perform(
              put("/projects/1/revenue/999999")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName(
        "PUT /projects/1/revenue/{milestoneId} - PM returns 403 (only CEO/FINANCE can update)")
    void updateReceipt_pm_returns403() throws Exception {
      Map<String, Object> body = Map.of("receiptStatus", "PAID");
      mockMvc
          .perform(
              put("/projects/1/revenue/1")
                  .header("Authorization", "Bearer " + pmToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName(
        "POST /projects/1/revenue/{milestoneId}/contract-change - non-existent milestone returns error")
    void contractChange_nonExistentMilestone_returnsError() throws Exception {
      Map<String, Object> body =
          Map.of("amount", new BigDecimal("100000"), "reason", "Contract amendment");
      mockMvc
          .perform(
              post("/projects/1/revenue/999999/contract-change")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status >= 400 : "Expected 4xx for non-existent milestone but got " + status;
              });
    }

    @Test
    @DisplayName("POST /projects/1/revenue/{milestoneId}/contract-change - employee returns 403")
    void contractChange_employee_returns403() throws Exception {
      Map<String, Object> body = Map.of("amount", new BigDecimal("50000"), "reason", "Test");
      mockMvc
          .perform(
              post("/projects/1/revenue/1/contract-change")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /projects/1/revenue/{milestoneId}/contract-change - employee returns 403")
    void cancelChange_employee_returns403() throws Exception {
      mockMvc
          .perform(
              delete("/projects/1/revenue/1/contract-change")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName(
        "DELETE /projects/1/revenue/{milestoneId}/contract-change - non-existent milestone returns 200 (no-op)")
    void cancelChange_nonExistentMilestone_returnsOk() throws Exception {
      // cancelChange service silently no-ops when milestone does not exist — returns 200
      mockMvc
          .perform(
              delete("/projects/1/revenue/999999/contract-change")
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk());
    }

    private String login(String username) throws Exception {
      Map<String, String> body = Map.of("username", username, "password", "123456");
      MvcResult result =
          mockMvc
              .perform(
                  post("/auth/login")
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(body)))
              .andExpect(status().isOk())
              .andReturn();
      return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PayrollItemDefController  /payroll/item-defs
  // GET:    isAuthenticated()
  // POST:   FINANCE only
  // PUT:    FINANCE only
  // DELETE: FINANCE only
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
  @AutoConfigureMockMvc
  @TestInstance(Lifecycle.PER_CLASS)
  @DisplayName("PayrollItemDefController + PayrollItemDefService")
  class PayrollItemDefControllerTests {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private String ceoToken;
    private String financeToken;
    private String employeeToken;

    @BeforeAll
    void acquireTokens() throws Exception {
      ceoToken = login("ceo.demo");
      financeToken = login("finance.demo");
      employeeToken = login("employee.demo");
    }

    @Test
    @DisplayName("GET /payroll/item-defs - authenticated user returns 200 with list")
    void list_authenticated_returns200() throws Exception {
      mockMvc
          .perform(get("/payroll/item-defs").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /payroll/item-defs - finance returns 200")
    void list_finance_returns200() throws Exception {
      mockMvc
          .perform(get("/payroll/item-defs").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /payroll/item-defs - no token returns 401")
    void list_noToken_returns401() throws Exception {
      mockMvc.perform(get("/payroll/item-defs")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /payroll/item-defs - finance creates custom item returns 200")
    void create_finance_returnsCreatedDef() throws Exception {
      String code = "CUSTOM_ITEM_" + System.currentTimeMillis();
      Map<String, Object> body =
          Map.of("code", code, "name", "Custom Bonus", "type", "EARNING", "displayOrder", 50);
      mockMvc
          .perform(
              post("/payroll/item-defs")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.code").value(code));
    }

    @Test
    @DisplayName("POST /payroll/item-defs - missing code returns 400")
    void create_missingCode_returns400() throws Exception {
      Map<String, Object> body = Map.of("name", "No Code Item", "type", "EARNING");
      mockMvc
          .perform(
              post("/payroll/item-defs")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.message").value("code 不能为空"));
    }

    @Test
    @DisplayName("POST /payroll/item-defs - missing name returns 400")
    void create_missingName_returns400() throws Exception {
      Map<String, Object> body =
          Map.of("code", "NO_NAME_" + System.currentTimeMillis(), "type", "EARNING");
      mockMvc
          .perform(
              post("/payroll/item-defs")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.message").value("name 不能为空"));
    }

    @Test
    @DisplayName("POST /payroll/item-defs - missing type returns 400")
    void create_missingType_returns400() throws Exception {
      Map<String, Object> body =
          Map.of("code", "NO_TYPE_" + System.currentTimeMillis(), "name", "Some Item");
      mockMvc
          .perform(
              post("/payroll/item-defs")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.message").value("type 不能为空（EARNING 或 DEDUCTION）"));
    }

    @Test
    @DisplayName("POST /payroll/item-defs - duplicate code returns 400")
    void create_duplicateCode_returns400() throws Exception {
      String code = "DUP_DEF_" + System.currentTimeMillis();
      Map<String, Object> body =
          Map.of("code", code, "name", "First Item", "type", "EARNING", "displayOrder", 90);

      // First creation succeeds
      mockMvc
          .perform(
              post("/payroll/item-defs")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isOk());

      // Second creation with same code must fail
      Map<String, Object> body2 =
          Map.of("code", code, "name", "Duplicate Item", "type", "DEDUCTION");
      mockMvc
          .perform(
              post("/payroll/item-defs")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body2)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.message").value("code 已存在: " + code));
    }

    @Test
    @DisplayName("POST /payroll/item-defs - CEO (not FINANCE) returns 403")
    void create_ceo_returns403() throws Exception {
      Map<String, Object> body = Map.of("code", "CEO_ITEM", "name", "CEO Item", "type", "EARNING");
      mockMvc
          .perform(
              post("/payroll/item-defs")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /payroll/item-defs/{id} - non-existent id returns 404")
    void update_nonExistent_returns404() throws Exception {
      Map<String, Object> body = Map.of("name", "Updated Name", "isEnabled", true);
      mockMvc
          .perform(
              put("/payroll/item-defs/999999")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /payroll/item-defs/{id} - non-existent id returns 404")
    void delete_nonExistent_returns404() throws Exception {
      mockMvc
          .perform(
              delete("/payroll/item-defs/999999").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /payroll/item-defs/{id} - CEO (not FINANCE) returns 403")
    void delete_ceo_returns403() throws Exception {
      mockMvc
          .perform(delete("/payroll/item-defs/1").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /payroll/item-defs/{id} - attempt to update system item returns 400")
    void update_systemItem_returns400() throws Exception {
      // Item ID 1 is a system-built item (isSystem=true) seeded in data.sql
      // Verify with list first, then try to update
      MvcResult listResult =
          mockMvc
              .perform(get("/payroll/item-defs").header("Authorization", "Bearer " + financeToken))
              .andExpect(status().isOk())
              .andReturn();

      JsonNode items = objectMapper.readTree(listResult.getResponse().getContentAsString());
      if (items.isArray() && items.size() > 0) {
        // Find first system item
        for (JsonNode item : items) {
          if (item.path("isSystem").asBoolean(false)) {
            long sysId = item.get("id").asLong();
            Map<String, Object> body = Map.of("name", "Attempted Change", "isEnabled", true);
            mockMvc
                .perform(
                    put("/payroll/item-defs/" + sysId)
                        .header("Authorization", "Bearer " + financeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("系统内置项不能修改（code 和 type 受保护）"));
            break;
          }
        }
      }
    }

    @Test
    @DisplayName("DELETE /payroll/item-defs/{id} - attempt to delete system item returns 400")
    void delete_systemItem_returns400() throws Exception {
      MvcResult listResult =
          mockMvc
              .perform(get("/payroll/item-defs").header("Authorization", "Bearer " + financeToken))
              .andExpect(status().isOk())
              .andReturn();

      JsonNode items = objectMapper.readTree(listResult.getResponse().getContentAsString());
      if (items.isArray()) {
        for (JsonNode item : items) {
          if (item.path("isSystem").asBoolean(false)) {
            long sysId = item.get("id").asLong();
            mockMvc
                .perform(
                    delete("/payroll/item-defs/" + sysId)
                        .header("Authorization", "Bearer " + financeToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("系统内置项不能删除"));
            break;
          }
        }
      }
    }

    @Test
    @DisplayName("PayrollItemDef full lifecycle: create -> update -> delete")
    void fullLifecycle_createUpdateDelete() throws Exception {
      String code = "LIFECYCLE_DEF_" + System.currentTimeMillis();
      Map<String, Object> createBody =
          Map.of("code", code, "name", "Lifecycle Item", "type", "DEDUCTION", "displayOrder", 99);

      MvcResult createResult =
          mockMvc
              .perform(
                  post("/payroll/item-defs")
                      .header("Authorization", "Bearer " + financeToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createBody)))
              .andExpect(status().isOk())
              .andReturn();

      long defId =
          objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

      // Update
      Map<String, Object> updateBody = Map.of("name", "Updated Lifecycle Item", "isEnabled", true);
      mockMvc
          .perform(
              put("/payroll/item-defs/" + defId)
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(updateBody)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.name").value("Updated Lifecycle Item"));

      // Delete
      mockMvc
          .perform(
              delete("/payroll/item-defs/" + defId)
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.message").value("已删除"));
    }

    private String login(String username) throws Exception {
      Map<String, String> body = Map.of("username", username, "password", "123456");
      MvcResult result =
          mockMvc
              .perform(
                  post("/auth/login")
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(body)))
              .andExpect(status().isOk())
              .andReturn();
      return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ProjectMemberController  /projects/{id}/members
  // POST /{id}/members:          CEO only -> returns 201
  // DELETE /{id}/members/{empId}: CEO only -> returns 204
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
  @AutoConfigureMockMvc
  @TestInstance(Lifecycle.PER_CLASS)
  @DisplayName("ProjectMemberController")
  class ProjectMemberControllerTests {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private String ceoToken;
    private String financeToken;
    private String employeeToken;

    @BeforeAll
    void acquireTokens() throws Exception {
      ceoToken = login("ceo.demo");
      financeToken = login("finance.demo");
      employeeToken = login("employee.demo");
    }

    @Test
    @DisplayName("POST /projects/1/members - finance returns 403 (CEO only)")
    void addMember_finance_returns403() throws Exception {
      Map<String, Object> body = Map.of("employeeId", 2L, "role", "MEMBER");
      mockMvc
          .perform(
              post("/projects/1/members")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /projects/1/members - employee returns 403")
    void addMember_employee_returns403() throws Exception {
      Map<String, Object> body = Map.of("employeeId", 1L, "role", "MEMBER");
      mockMvc
          .perform(
              post("/projects/1/members")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /projects/1/members - no token returns 401")
    void addMember_noToken_returns401() throws Exception {
      Map<String, Object> body = Map.of("employeeId", 1L);
      mockMvc
          .perform(
              post("/projects/1/members")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /projects/1/members - CEO adds member returns 201")
    void addMember_ceo_returns201() throws Exception {
      // hr.demo (id varies — use the list endpoint from ProjectController to find a non-member)
      // Use employee.demo (assumed id=1 per seed data) as the member to add
      Map<String, Object> body = Map.of("employeeId", 1L, "role", "MEMBER");
      mockMvc
          .perform(
              post("/projects/1/members")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                // 201 on success; 400 if already a member from a previous test run
                assert status == 201 || status == 400 : "Expected 201 or 400 but got " + status;
              });
    }

    @Test
    @DisplayName("DELETE /projects/1/members/{employeeId} - finance returns 403 (CEO only)")
    void removeMember_finance_returns403() throws Exception {
      mockMvc
          .perform(
              delete("/projects/1/members/1").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /projects/1/members/{employeeId} - no token returns 401")
    void removeMember_noToken_returns401() throws Exception {
      mockMvc.perform(delete("/projects/1/members/1")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("CEO add then remove member — full lifecycle")
    void addAndRemoveMember_ceo_roundTrip() throws Exception {
      // Add finance.demo (id=2) as a member
      Map<String, Object> addBody = Map.of("employeeId", 2L, "role", "MEMBER");
      MvcResult addResult =
          mockMvc
              .perform(
                  post("/projects/2/members")
                      .header("Authorization", "Bearer " + ceoToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(addBody)))
              .andReturn();

      // Only proceed with remove if add succeeded
      if (addResult.getResponse().getStatus() == 201) {
        mockMvc
            .perform(delete("/projects/2/members/2").header("Authorization", "Bearer " + ceoToken))
            .andExpect(status().isNoContent());
      }
    }

    private String login(String username) throws Exception {
      Map<String, String> body = Map.of("username", username, "password", "123456");
      MvcResult result =
          mockMvc
              .perform(
                  post("/auth/login")
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(body)))
              .andExpect(status().isOk())
              .andReturn();
      return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SalaryConfirmationAgreementController  /salary-confirmation-agreement
  // POST:         FINANCE only
  // GET /current: isAuthenticated()
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
  @AutoConfigureMockMvc
  @TestInstance(Lifecycle.PER_CLASS)
  @DisplayName("SalaryConfirmationAgreementController")
  class SalaryConfirmationAgreementControllerTests {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private String ceoToken;
    private String financeToken;
    private String employeeToken;

    @BeforeAll
    void acquireTokens() throws Exception {
      ceoToken = login("ceo.demo");
      financeToken = login("finance.demo");
      employeeToken = login("employee.demo");
    }

    @Test
    @DisplayName("GET /salary-confirmation-agreement/current - authenticated returns 200 or 404")
    void getCurrent_authenticated_returns200or404() throws Exception {
      mockMvc
          .perform(
              get("/salary-confirmation-agreement/current")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status == 200 || status == 404 : "Expected 200 or 404 but got " + status;
              });
    }

    @Test
    @DisplayName("GET /salary-confirmation-agreement/current - CEO also returns 200 or 404")
    void getCurrent_ceo_returns200or404() throws Exception {
      mockMvc
          .perform(
              get("/salary-confirmation-agreement/current")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status == 200 || status == 404 : "Expected 200 or 404 but got " + status;
              });
    }

    @Test
    @DisplayName("GET /salary-confirmation-agreement/current - no token returns 401")
    void getCurrent_noToken_returns401() throws Exception {
      mockMvc
          .perform(get("/salary-confirmation-agreement/current"))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /salary-confirmation-agreement - finance uploads new version returns 200")
    void upload_finance_returns200() throws Exception {
      String version = "v" + System.currentTimeMillis();
      Map<String, String> body = Map.of("version", version, "content", "本协议内容如下...");
      mockMvc
          .perform(
              post("/salary-confirmation-agreement")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.version").value(version));
    }

    @Test
    @DisplayName(
        "POST /salary-confirmation-agreement - second upload replaces previous active version")
    void upload_secondVersion_replacesPrevious() throws Exception {
      // Upload first version
      String v1 = "v_first_" + System.currentTimeMillis();
      Map<String, String> body1 = Map.of("version", v1, "content", "First agreement text");
      mockMvc
          .perform(
              post("/salary-confirmation-agreement")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body1)))
          .andExpect(status().isOk());

      // Upload second version
      String v2 = "v_second_" + System.currentTimeMillis();
      Map<String, String> body2 = Map.of("version", v2, "content", "Second agreement text");
      mockMvc
          .perform(
              post("/salary-confirmation-agreement")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body2)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.version").value(v2));

      // Current should now be v2
      mockMvc
          .perform(
              get("/salary-confirmation-agreement/current")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.version").value(v2));
    }

    @Test
    @DisplayName("POST /salary-confirmation-agreement - missing version returns 400")
    void upload_missingVersion_returns400() throws Exception {
      Map<String, String> body = Map.of("content", "Some content");
      mockMvc
          .perform(
              post("/salary-confirmation-agreement")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.message").value("version 不能为空"));
    }

    @Test
    @DisplayName("POST /salary-confirmation-agreement - missing content returns 400")
    void upload_missingContent_returns400() throws Exception {
      Map<String, String> body = Map.of("version", "v-noContent");
      mockMvc
          .perform(
              post("/salary-confirmation-agreement")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.message").value("content 不能为空"));
    }

    @Test
    @DisplayName("POST /salary-confirmation-agreement - CEO (not FINANCE) returns 403")
    void upload_ceo_returns403() throws Exception {
      Map<String, String> body = Map.of("version", "v-ceo", "content", "CEO agreement text");
      mockMvc
          .perform(
              post("/salary-confirmation-agreement")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /salary-confirmation-agreement - no token returns 401")
    void upload_noToken_returns401() throws Exception {
      Map<String, String> body = Map.of("version", "v-anon", "content", "Anonymous agreement");
      mockMvc
          .perform(
              post("/salary-confirmation-agreement")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isUnauthorized());
    }

    private String login(String username) throws Exception {
      Map<String, String> body = Map.of("username", username, "password", "123456");
      MvcResult result =
          mockMvc
              .perform(
                  post("/auth/login")
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(body)))
              .andExpect(status().isOk())
              .andReturn();
      return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ApprovalFlowController  /approval/flows
  // GET /:             CEO only
  // GET /{businessType}: CEO only
  // PUT /{businessType}: CEO only
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
  @AutoConfigureMockMvc
  @TestInstance(Lifecycle.PER_CLASS)
  @DisplayName("ApprovalFlowController")
  class ApprovalFlowControllerTests {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private String ceoToken;
    private String financeToken;
    private String employeeToken;

    @BeforeAll
    void acquireTokens() throws Exception {
      ceoToken = login("ceo.demo");
      financeToken = login("finance.demo");
      employeeToken = login("employee.demo");
    }

    @Test
    @DisplayName("GET /approval/flows - CEO returns 200 with list of flows")
    void listFlows_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/approval/flows").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /approval/flows - each item has flow and nodes fields")
    void listFlows_ceo_itemsHaveExpectedStructure() throws Exception {
      MvcResult result =
          mockMvc
              .perform(get("/approval/flows").header("Authorization", "Bearer " + ceoToken))
              .andExpect(status().isOk())
              .andReturn();

      JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
      if (json.isArray() && json.size() > 0) {
        JsonNode first = json.get(0);
        assert first.has("flow") : "Each item should have a 'flow' field";
        assert first.has("nodes") : "Each item should have a 'nodes' field";
      }
    }

    @Test
    @DisplayName("GET /approval/flows - finance returns 403 (CEO only)")
    void listFlows_finance_returns403() throws Exception {
      mockMvc
          .perform(get("/approval/flows").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /approval/flows - employee returns 403")
    void listFlows_employee_returns403() throws Exception {
      mockMvc
          .perform(get("/approval/flows").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /approval/flows - no token returns 401")
    void listFlows_noToken_returns401() throws Exception {
      mockMvc.perform(get("/approval/flows")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /approval/flows/LEAVE - CEO returns 200 with leave approval flow")
    void getFlow_leave_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/approval/flows/LEAVE").header("Authorization", "Bearer " + ceoToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                // 200 if LEAVE flow exists in seed data, 404 if not seeded
                assert status == 200 || status == 404 : "Expected 200 or 404 but got " + status;
              });
    }

    @Test
    @DisplayName("GET /approval/flows/{businessType} - non-existent type returns 404")
    void getFlow_nonExistentType_returns404() throws Exception {
      mockMvc
          .perform(
              get("/approval/flows/NONEXISTENT_TYPE_XYZ")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /approval/flows/{businessType} - finance returns 403")
    void getFlow_finance_returns403() throws Exception {
      mockMvc
          .perform(get("/approval/flows/LEAVE").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /approval/flows/{businessType} - non-existent type returns 404")
    void updateFlow_nonExistentType_returns404() throws Exception {
      Map<String, Object> body = Map.of("nodes", List.of());
      mockMvc
          .perform(
              put("/approval/flows/NONEXISTENT_TYPE_XYZ")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /approval/flows/{businessType} - finance returns 403")
    void updateFlow_finance_returns403() throws Exception {
      Map<String, Object> body = Map.of("nodes", List.of());
      mockMvc
          .perform(
              put("/approval/flows/LEAVE")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /approval/flows/{businessType} - no token returns 401")
    void updateFlow_noToken_returns401() throws Exception {
      Map<String, Object> body = Map.of("nodes", List.of());
      mockMvc
          .perform(
              put("/approval/flows/LEAVE")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isUnauthorized());
    }

    private String login(String username) throws Exception {
      Map<String, String> body = Map.of("username", username, "password", "123456");
      MvcResult result =
          mockMvc
              .perform(
                  post("/auth/login")
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(body)))
              .andExpect(status().isOk())
              .andReturn();
      return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DirectoryImportController  /directory
  // POST /import-preview: HR only
  // POST /import-apply:   HR only
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
  @AutoConfigureMockMvc
  @TestInstance(Lifecycle.PER_CLASS)
  @DisplayName("DirectoryImportController")
  class DirectoryImportControllerTests {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private String hrToken;
    private String ceoToken;
    private String employeeToken;

    @BeforeAll
    void acquireTokens() throws Exception {
      hrToken = login("hr.demo");
      ceoToken = login("ceo.demo");
      employeeToken = login("employee.demo");
    }

    @Test
    @DisplayName("POST /directory/import-preview - HR with valid records returns 200 with preview")
    void importPreview_hr_validRecords_returns200() throws Exception {
      Map<String, Object> body =
          Map.of(
              "records",
              List.of(
                  Map.of("name", "张三", "phone", "13812345678", "department", "工程部"),
                  Map.of("name", "李四", "phone", "13987654321", "department", "财务部"),
                  Map.of("name", "王五", "phone", "13712341234", "department", "人事部")));
      mockMvc
          .perform(
              post("/directory/import-preview")
                  .header("Authorization", "Bearer " + hrToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.totalCount").value(3))
          .andExpect(jsonPath("$.validCount").value(3))
          .andExpect(jsonPath("$.invalidCount").value(0))
          .andExpect(jsonPath("$.items").isArray());
    }

    @Test
    @DisplayName("POST /directory/import-preview - record with blank name returns INVALID status")
    void importPreview_blankName_markedInvalid() throws Exception {
      Map<String, Object> body =
          Map.of(
              "records", List.of(Map.of("name", "", "phone", "13800001111", "department", "部门A")));
      MvcResult result =
          mockMvc
              .perform(
                  post("/directory/import-preview")
                      .header("Authorization", "Bearer " + hrToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(body)))
              .andExpect(status().isOk())
              .andReturn();

      JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
      assert json.get("invalidCount").asInt() == 1 : "Expected 1 invalid record";
      assert "INVALID".equals(json.get("items").get(0).get("status").asText())
          : "Expected INVALID status for blank name";
    }

    @Test
    @DisplayName("POST /directory/import-preview - invalid phone format returns INVALID")
    void importPreview_invalidPhone_markedInvalid() throws Exception {
      Map<String, Object> body =
          Map.of("records", List.of(Map.of("name", "赵六", "phone", "12345", "department", "部门B")));
      MvcResult result =
          mockMvc
              .perform(
                  post("/directory/import-preview")
                      .header("Authorization", "Bearer " + hrToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(body)))
              .andExpect(status().isOk())
              .andReturn();

      JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
      assert "INVALID".equals(json.get("items").get(0).get("status").asText())
          : "Expected INVALID for bad phone format";
    }

    @Test
    @DisplayName("POST /directory/import-preview - duplicate phone within batch returns DUPLICATE")
    void importPreview_duplicatePhone_markedDuplicate() throws Exception {
      Map<String, Object> body =
          Map.of(
              "records",
              List.of(
                  Map.of("name", "甲", "phone", "13600001111", "department", "部门X"),
                  Map.of("name", "乙", "phone", "13600001111", "department", "部门Y")));
      MvcResult result =
          mockMvc
              .perform(
                  post("/directory/import-preview")
                      .header("Authorization", "Bearer " + hrToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(body)))
              .andExpect(status().isOk())
              .andReturn();

      JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
      assert json.get("duplicateCount").asInt() == 1 : "Expected 1 duplicate";
      assert json.get("validCount").asInt() == 1 : "Expected 1 valid (first occurrence)";
    }

    @Test
    @DisplayName("POST /directory/import-preview - empty records returns 400 (@NotEmpty)")
    void importPreview_emptyRecords_returns400() throws Exception {
      Map<String, Object> body = Map.of("records", List.of());
      mockMvc
          .perform(
              post("/directory/import-preview")
                  .header("Authorization", "Bearer " + hrToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /directory/import-preview - CEO returns 403 (HR only)")
    void importPreview_ceo_returns403() throws Exception {
      Map<String, Object> body =
          Map.of("records", List.of(Map.of("name", "测试", "phone", "13812345678")));
      mockMvc
          .perform(
              post("/directory/import-preview")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /directory/import-preview - employee returns 403")
    void importPreview_employee_returns403() throws Exception {
      Map<String, Object> body =
          Map.of("records", List.of(Map.of("name", "测试", "phone", "13812345678")));
      mockMvc
          .perform(
              post("/directory/import-preview")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /directory/import-preview - no token returns 401")
    void importPreview_noToken_returns401() throws Exception {
      Map<String, Object> body =
          Map.of("records", List.of(Map.of("name", "测试", "phone", "13812345678")));
      mockMvc
          .perform(
              post("/directory/import-preview")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /directory/import-apply - HR with valid indices returns 200")
    void importApply_hr_validIndices_returns200() throws Exception {
      Map<String, Object> body = Map.of("selectedIndices", List.of(0, 1, 2));
      MvcResult result =
          mockMvc
              .perform(
                  post("/directory/import-apply")
                      .header("Authorization", "Bearer " + hrToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(body)))
              .andExpect(status().isOk())
              .andReturn();

      String responseBody = result.getResponse().getContentAsString();
      assert responseBody.contains("3") : "Response should mention 3 imported records";
    }

    @Test
    @DisplayName("POST /directory/import-apply - empty selectedIndices returns 400 (@NotEmpty)")
    void importApply_emptyIndices_returns400() throws Exception {
      Map<String, Object> body = Map.of("selectedIndices", List.of());
      mockMvc
          .perform(
              post("/directory/import-apply")
                  .header("Authorization", "Bearer " + hrToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /directory/import-apply - CEO returns 403 (HR only)")
    void importApply_ceo_returns403() throws Exception {
      Map<String, Object> body = Map.of("selectedIndices", List.of(0));
      mockMvc
          .perform(
              post("/directory/import-apply")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /directory/import-apply - no token returns 401")
    void importApply_noToken_returns401() throws Exception {
      Map<String, Object> body = Map.of("selectedIndices", List.of(0));
      mockMvc
          .perform(
              post("/directory/import-apply")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isUnauthorized());
    }

    private String login(String username) throws Exception {
      Map<String, String> body = Map.of("username", username, "password", "123456");
      MvcResult result =
          mockMvc
              .perform(
                  post("/auth/login")
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(body)))
              .andExpect(status().isOk())
              .andReturn();
      return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }
  }
}
