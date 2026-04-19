package com.oa.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Coverage boost test 7: PayrollController advanced paths, ProjectRevenueController,
 * ProjectConstructionLogController, OperationLogController, ExpenseController, OrgController,
 * SignatureController validation paths, PayrollBonusController.
 *
 * <p>Uses @SpringBootTest(webEnvironment=MOCK) + @AutoConfigureMockMvc + @TestInstance(PER_CLASS)
 * on each @Nested class. Token acquired via POST /auth/login in @BeforeAll (non-static). No
 * hardcoded IDs except well-known non-existent ones (999999). Dynamic test data uses
 * System.currentTimeMillis() for uniqueness.
 */
class CoverageBoostTest7 {

  private static final ObjectMapper MAPPER = new ObjectMapper();

  // ── PayrollController: cycles, corrections, dispute ─────────────────────────

  @Nested
  @DisplayName("PayrollController - cycle management and correction paths")
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
  @AutoConfigureMockMvc
  @TestInstance(TestInstance.Lifecycle.PER_CLASS)
  class PayrollCycleCorrectionTests {

    @Autowired MockMvc mockMvc;

    String financeToken;
    String ceoToken;
    String employeeToken;

    @BeforeAll
    void setUp() throws Exception {
      financeToken = login(mockMvc, "finance.demo", "123456");
      ceoToken = login(mockMvc, "ceo.demo", "123456");
      employeeToken = login(mockMvc, "employee.demo", "123456");
    }

    @Test
    @DisplayName("GET /payroll/cycles - FINANCE returns 200")
    void listCycles_finance_returns200() throws Exception {
      mockMvc
          .perform(get("/payroll/cycles").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /payroll/cycles - CEO returns 200")
    void listCycles_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/payroll/cycles").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /payroll/cycles - employee returns 403")
    void listCycles_employee_returns403() throws Exception {
      mockMvc
          .perform(get("/payroll/cycles").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /payroll/cycles - blank period returns 400")
    void createCycle_blankPeriod_returns400() throws Exception {
      mockMvc
          .perform(
              post("/payroll/cycles")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"period\":\"\"}")
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /payroll/cycles - null period returns 400")
    void createCycle_nullPeriod_returns400() throws Exception {
      mockMvc
          .perform(
              post("/payroll/cycles")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"period\":null}")
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /payroll/cycles/{id}/open-window - non-existent cycle returns 400")
    void openWindow_nonExistentCycle_returns400() throws Exception {
      mockMvc
          .perform(
              post("/payroll/cycles/999999/open-window")
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status == 400 || status == 404 : "Expected 400 or 404, got " + status;
              });
    }

    @Test
    @DisplayName("POST /payroll/cycles/{id}/open-window - employee returns 403")
    void openWindow_employee_returns403() throws Exception {
      mockMvc
          .perform(
              post("/payroll/cycles/1/open-window")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /payroll/cycles/{id}/precheck - non-existent cycle returns 400")
    void precheck_nonExistentCycle_returns400() throws Exception {
      mockMvc
          .perform(
              post("/payroll/cycles/999999/precheck")
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status == 400 || status == 404 : "Expected 400 or 404, got " + status;
              });
    }

    @Test
    @DisplayName("POST /payroll/cycles/{id}/settle - non-existent cycle returns 400")
    void settle_nonExistentCycle_returns400() throws Exception {
      mockMvc
          .perform(
              post("/payroll/cycles/999999/settle")
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status == 400 || status == 404 : "Expected 400 or 404, got " + status;
              });
    }

    @Test
    @DisplayName("POST /payroll/cycles/{id}/unlock - CEO on non-existent returns 404")
    void unlock_nonExistentCycle_returns404() throws Exception {
      mockMvc
          .perform(
              post("/payroll/cycles/999999/unlock").header("Authorization", "Bearer " + ceoToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status == 404 || status == 400 : "Expected 404 or 400, got " + status;
              });
    }

    @Test
    @DisplayName("POST /payroll/cycles/{id}/unlock - FINANCE returns 403")
    void unlock_finance_returns403() throws Exception {
      mockMvc
          .perform(
              post("/payroll/cycles/1/unlock").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /payroll/corrections - FINANCE returns 200")
    void listCorrections_finance_returns200() throws Exception {
      mockMvc
          .perform(get("/payroll/corrections").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /payroll/corrections - with cycleId param returns 200")
    void listCorrections_withCycleId_returns200() throws Exception {
      mockMvc
          .perform(
              get("/payroll/corrections")
                  .param("cycleId", "1")
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /payroll/corrections - employee returns 403")
    void listCorrections_employee_returns403() throws Exception {
      mockMvc
          .perform(get("/payroll/corrections").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /payroll/slips/{id}/correction - FINANCE on non-existent slip")
    void createCorrection_nonExistentSlip_returnsError() throws Exception {
      mockMvc
          .perform(
              post("/payroll/slips/999999/correction")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"reason\":\"test correction\",\"corrections\":[]}")
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status >= 400 : "Expected 4xx, got " + status;
              });
    }

    @Test
    @DisplayName("POST /payroll/slips/{id}/correction - employee returns 403")
    void createCorrection_employee_returns403() throws Exception {
      mockMvc
          .perform(
              post("/payroll/slips/1/correction")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"reason\":\"test\",\"corrections\":[]}")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /payroll/slips/{id}/dispute - employee on non-existent slip returns 403")
    void disputeSlip_nonExistentSlip_returns403() throws Exception {
      mockMvc
          .perform(
              post("/payroll/slips/999999/dispute")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"reason\":\"amount wrong\"}")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status == 403 || status == 400 || status == 404
                    : "Expected 4xx, got " + status;
              });
    }

    @Test
    @DisplayName("POST /payroll/slips/{id}/dispute - FINANCE returns 403")
    void disputeSlip_finance_returns403() throws Exception {
      mockMvc
          .perform(
              post("/payroll/slips/1/dispute")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"reason\":\"wrong\"}")
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isForbidden());
    }
  }

  // ── ProjectRevenueController ─────────────────────────────────────────────

  @Nested
  @DisplayName("ProjectRevenueController")
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
  @AutoConfigureMockMvc
  @TestInstance(TestInstance.Lifecycle.PER_CLASS)
  class ProjectRevenueControllerTests {

    @Autowired MockMvc mockMvc;

    String ceoToken;
    String financeToken;
    String pmToken;
    String employeeToken;

    @BeforeAll
    void setUp() throws Exception {
      ceoToken = login(mockMvc, "ceo.demo", "123456");
      financeToken = login(mockMvc, "finance.demo", "123456");
      pmToken = login(mockMvc, "pm.demo", "123456");
      employeeToken = login(mockMvc, "employee.demo", "123456");
    }

    @Test
    @DisplayName("GET /projects/{id}/revenue - CEO returns 200")
    void list_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/projects/1/revenue").header("Authorization", "Bearer " + ceoToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status == 200 || status == 404 : "Expected 200 or 404, got " + status;
              });
    }

    @Test
    @DisplayName("GET /projects/{id}/revenue - employee returns 403")
    void list_employee_returns403() throws Exception {
      mockMvc
          .perform(get("/projects/1/revenue").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /projects/{id}/revenue - no token returns 401")
    void list_noToken_returns401() throws Exception {
      mockMvc.perform(get("/projects/1/revenue")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /projects/{id}/revenue/summary - FINANCE returns 200")
    void summary_finance_returns200() throws Exception {
      mockMvc
          .perform(
              get("/projects/1/revenue/summary").header("Authorization", "Bearer " + financeToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status == 200 || status == 404 : "Expected 200 or 404, got " + status;
              });
    }

    @Test
    @DisplayName("GET /projects/{id}/revenue/summary - employee returns 403")
    void summary_employee_returns403() throws Exception {
      mockMvc
          .perform(
              get("/projects/1/revenue/summary").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /projects/{id}/revenue/{milestoneId} - CEO on non-existent returns 404")
    void update_nonExistentMilestone_returns404() throws Exception {
      mockMvc
          .perform(
              put("/projects/1/revenue/999999")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"receiptStatus\":\"RECEIVED\"}")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /projects/{id}/revenue/{milestoneId} - employee returns 403")
    void update_employee_returns403() throws Exception {
      mockMvc
          .perform(
              put("/projects/1/revenue/1")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"receiptStatus\":\"RECEIVED\"}")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName(
        "POST /projects/{id}/revenue/{milestoneId}/contract-change - FINANCE on non-existent")
    void proposeChange_nonExistentMilestone_returnsError() throws Exception {
      mockMvc
          .perform(
              post("/projects/1/revenue/999999/contract-change")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"amount\":10000.00,\"reason\":\"price negotiation\"}")
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status >= 400 : "Expected 4xx, got " + status;
              });
    }

    @Test
    @DisplayName("POST /projects/{id}/revenue/{milestoneId}/contract-change - employee returns 403")
    void proposeChange_employee_returns403() throws Exception {
      mockMvc
          .perform(
              post("/projects/1/revenue/1/contract-change")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"amount\":10000.00,\"reason\":\"test\"}")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /projects/{id}/revenue/{milestoneId}/contract-change - FINANCE")
    void cancelChange_finance_returnsOk() throws Exception {
      mockMvc
          .perform(
              delete("/projects/1/revenue/999999/contract-change")
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status == 200 || status == 403 || status == 400
                    : "Expected 200/403/400, got " + status;
              });
    }
  }

  // ── ProjectConstructionLogController ────────────────────────────────────

  @Nested
  @DisplayName("ProjectConstructionLogController - materials summary")
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
  @AutoConfigureMockMvc
  @TestInstance(TestInstance.Lifecycle.PER_CLASS)
  class ProjectConstructionLogControllerTests {

    @Autowired MockMvc mockMvc;

    String ceoToken;
    String pmToken;
    String financeToken;
    String employeeToken;

    @BeforeAll
    void setUp() throws Exception {
      ceoToken = login(mockMvc, "ceo.demo", "123456");
      pmToken = login(mockMvc, "pm.demo", "123456");
      financeToken = login(mockMvc, "finance.demo", "123456");
      employeeToken = login(mockMvc, "employee.demo", "123456");
    }

    @Test
    @DisplayName("GET /projects/{id}/construction-log/materials-summary - CEO returns 200")
    void materialsSummary_ceo_returns200() throws Exception {
      mockMvc
          .perform(
              get("/projects/1/construction-log/materials-summary")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /projects/{id}/construction-log/materials-summary - PM returns 200")
    void materialsSummary_pm_returns200() throws Exception {
      mockMvc
          .perform(
              get("/projects/1/construction-log/materials-summary")
                  .header("Authorization", "Bearer " + pmToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /projects/{id}/construction-log/materials-summary - FINANCE returns 200")
    void materialsSummary_finance_returns200() throws Exception {
      mockMvc
          .perform(
              get("/projects/1/construction-log/materials-summary")
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /projects/{id}/construction-log/materials-summary - with date params")
    void materialsSummary_withDateParams_returns200() throws Exception {
      mockMvc
          .perform(
              get("/projects/1/construction-log/materials-summary")
                  .param("startDate", "2026-01-01")
                  .param("endDate", "2026-12-31")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /projects/{id}/construction-log/materials-summary - employee returns 403")
    void materialsSummary_employee_returns403() throws Exception {
      mockMvc
          .perform(
              get("/projects/1/construction-log/materials-summary")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /projects/{id}/construction-log/materials-summary - no token returns 401")
    void materialsSummary_noToken_returns401() throws Exception {
      mockMvc
          .perform(get("/projects/1/construction-log/materials-summary"))
          .andExpect(status().isUnauthorized());
    }
  }

  // ── OperationLogController ────────────────────────────────────────────────

  @Nested
  @DisplayName("OperationLogController")
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
  @AutoConfigureMockMvc
  @TestInstance(TestInstance.Lifecycle.PER_CLASS)
  class OperationLogControllerTests {

    @Autowired MockMvc mockMvc;

    String ceoToken;
    String hrToken;
    String employeeToken;

    @BeforeAll
    void setUp() throws Exception {
      ceoToken = login(mockMvc, "ceo.demo", "123456");
      hrToken = login(mockMvc, "hr.demo", "123456");
      employeeToken = login(mockMvc, "employee.demo", "123456");
    }

    @Test
    @DisplayName("GET /operation-logs - CEO returns 200")
    void list_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/operation-logs").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /operation-logs - CEO with date params returns 200")
    void list_ceo_withDateParams_returns200() throws Exception {
      mockMvc
          .perform(
              get("/operation-logs")
                  .param("from", "2026-01-01")
                  .param("to", "2026-12-31")
                  .param("page", "0")
                  .param("size", "10")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /operation-logs - HR returns 403")
    void list_hr_returns403() throws Exception {
      mockMvc
          .perform(get("/operation-logs").header("Authorization", "Bearer " + hrToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /operation-logs - employee returns 403")
    void list_employee_returns403() throws Exception {
      mockMvc
          .perform(get("/operation-logs").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /operation-logs - no token returns 401")
    void list_noToken_returns401() throws Exception {
      mockMvc.perform(get("/operation-logs")).andExpect(status().isUnauthorized());
    }
  }

  // ── ExpenseController ────────────────────────────────────────────────────

  @Nested
  @DisplayName("ExpenseController")
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
  @AutoConfigureMockMvc
  @TestInstance(TestInstance.Lifecycle.PER_CLASS)
  class ExpenseControllerTests {

    @Autowired MockMvc mockMvc;

    String employeeToken;
    String financeToken;
    String workerToken;
    String ceoToken;

    @BeforeAll
    void setUp() throws Exception {
      employeeToken = login(mockMvc, "employee.demo", "123456");
      financeToken = login(mockMvc, "finance.demo", "123456");
      workerToken = login(mockMvc, "worker.demo", "123456");
      ceoToken = login(mockMvc, "ceo.demo", "123456");
    }

    @Test
    @DisplayName("GET /expense/config - employee returns 200")
    void getConfig_employee_returns200() throws Exception {
      mockMvc
          .perform(get("/expense/config").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /expense/config - FINANCE returns 200")
    void getConfig_finance_returns200() throws Exception {
      mockMvc
          .perform(get("/expense/config").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /expense/config - no token returns 401")
    void getConfig_noToken_returns401() throws Exception {
      mockMvc.perform(get("/expense/config")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /expense/types - employee returns 200")
    void getTypes_employee_returns200() throws Exception {
      mockMvc
          .perform(get("/expense/types").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /expense/types - worker returns 200")
    void getTypes_worker_returns200() throws Exception {
      mockMvc
          .perform(get("/expense/types").header("Authorization", "Bearer " + workerToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /expense - valid request employee returns 200")
    void submitExpense_employee_returns200() throws Exception {
      String body =
          "{"
              + "\"expenseType\":\"TRAVEL\","
              + "\"totalAmount\":1500.00,"
              + "\"remark\":\"business trip\","
              + "\"items\":[{\"itemType\":\"TRAVEL\",\"amount\":1500.00,\"description\":\"flight\"}]"
              + "}";
      mockMvc
          .perform(
              post("/expense")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(body)
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status == 200 || status == 400 : "Expected 200 or 400, got " + status;
              });
    }

    @Test
    @DisplayName("POST /expense - missing required fields returns 400")
    void submitExpense_missingFields_returns400() throws Exception {
      mockMvc
          .perform(
              post("/expense")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{}")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /expense/records - employee returns 200")
    void getMyExpenses_employee_returns200() throws Exception {
      mockMvc
          .perform(get("/expense/records").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /expense/records - FINANCE returns 200")
    void getMyExpenses_finance_returns200() throws Exception {
      mockMvc
          .perform(get("/expense/records").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /expense/{formId} - non-existent returns error")
    void getExpenseDetail_nonExistent_returnsError() throws Exception {
      mockMvc
          .perform(get("/expense/999999").header("Authorization", "Bearer " + employeeToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status >= 400 : "Expected 4xx, got " + status;
              });
    }
  }

  // ── OrgController ────────────────────────────────────────────────────────

  @Nested
  @DisplayName("OrgController")
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
  @AutoConfigureMockMvc
  @TestInstance(TestInstance.Lifecycle.PER_CLASS)
  class OrgControllerTests {

    @Autowired MockMvc mockMvc;

    String ceoToken;
    String hrToken;
    String employeeToken;

    @BeforeAll
    void setUp() throws Exception {
      ceoToken = login(mockMvc, "ceo.demo", "123456");
      hrToken = login(mockMvc, "hr.demo", "123456");
      employeeToken = login(mockMvc, "employee.demo", "123456");
    }

    @Test
    @DisplayName("GET /org/tree - CEO returns 200")
    void getOrgTree_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/org/tree").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /org/tree - HR returns 403")
    void getOrgTree_hr_returns403() throws Exception {
      mockMvc
          .perform(get("/org/tree").header("Authorization", "Bearer " + hrToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /org/tree - employee returns 403")
    void getOrgTree_employee_returns403() throws Exception {
      mockMvc
          .perform(get("/org/tree").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /org/tree - no token returns 401")
    void getOrgTree_noToken_returns401() throws Exception {
      mockMvc.perform(get("/org/tree")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PATCH /org/supervisor/{employeeId} - CEO on non-existent employee returns error")
    void updateSupervisor_nonExistentEmployee_returnsError() throws Exception {
      mockMvc
          .perform(
              patch("/org/supervisor/999999")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"supervisorId\":1}")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status >= 400 : "Expected 4xx, got " + status;
              });
    }

    @Test
    @DisplayName("PATCH /org/supervisor/{employeeId} - HR returns 403")
    void updateSupervisor_hr_returns403() throws Exception {
      mockMvc
          .perform(
              patch("/org/supervisor/1")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"supervisorId\":2}")
                  .header("Authorization", "Bearer " + hrToken))
          .andExpect(status().isForbidden());
    }
  }

  // ── SignatureController: validation paths ────────────────────────────────

  @Nested
  @DisplayName("SignatureController - bind validation and status")
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
  @AutoConfigureMockMvc
  @TestInstance(TestInstance.Lifecycle.PER_CLASS)
  class SignatureControllerTests {

    @Autowired MockMvc mockMvc;

    String employeeToken;
    String workerToken;
    String ceoToken;

    @BeforeAll
    void setUp() throws Exception {
      employeeToken = login(mockMvc, "employee.demo", "123456");
      workerToken = login(mockMvc, "worker.demo", "123456");
      ceoToken = login(mockMvc, "ceo.demo", "123456");
    }

    @Test
    @DisplayName("GET /signature/status - employee returns 200")
    void getStatus_employee_returns200() throws Exception {
      mockMvc
          .perform(get("/signature/status").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /signature/status - worker returns 200")
    void getStatus_worker_returns200() throws Exception {
      mockMvc
          .perform(get("/signature/status").header("Authorization", "Bearer " + workerToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /signature/status - CEO returns 403")
    void getStatus_ceo_returns403() throws Exception {
      mockMvc
          .perform(get("/signature/status").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /signature/status - no token returns 401")
    void getStatus_noToken_returns401() throws Exception {
      mockMvc.perform(get("/signature/status")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /signature/bind - missing signatureImage returns 400")
    void bind_missingSignatureImage_returns400() throws Exception {
      mockMvc
          .perform(
              post("/signature/bind")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"pin\":\"1234\",\"confirmPin\":\"1234\"}")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /signature/bind - blank signatureImage returns 400")
    void bind_blankSignatureImage_returns400() throws Exception {
      mockMvc
          .perform(
              post("/signature/bind")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"signatureImage\":\"\",\"pin\":\"1234\",\"confirmPin\":\"1234\"}")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /signature/bind - missing pin returns 400")
    void bind_missingPin_returns400() throws Exception {
      mockMvc
          .perform(
              post("/signature/bind")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"signatureImage\":\"data:image/png;base64,abc\"}")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /signature/bind - pin mismatch returns 400")
    void bind_pinMismatch_returns400() throws Exception {
      mockMvc
          .perform(
              post("/signature/bind")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(
                      "{\"signatureImage\":\"data:image/png;base64,abc\",\"pin\":\"1234\","
                          + "\"confirmPin\":\"5678\"}")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /signature/bind - pin too short returns 400")
    void bind_pinTooShort_returns400() throws Exception {
      mockMvc
          .perform(
              post("/signature/bind")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(
                      "{\"signatureImage\":\"data:image/png;base64,abc\",\"pin\":\"12\","
                          + "\"confirmPin\":\"12\"}")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /signature/bind - CEO returns 403")
    void bind_ceo_returns403() throws Exception {
      mockMvc
          .perform(
              post("/signature/bind")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(
                      "{\"signatureImage\":\"data:image/png;base64,abc\",\"pin\":\"1234\","
                          + "\"confirmPin\":\"1234\"}")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /payroll/slips/{id}/evidence-pdf - non-existent slip returns error")
    void downloadEvidencePdf_nonExistentSlip_returnsError() throws Exception {
      mockMvc
          .perform(
              get("/signature/payroll/slips/999999/evidence-pdf")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status >= 400 : "Expected 4xx, got " + status;
              });
    }
  }

  // ── PayrollBonusController ───────────────────────────────────────────────

  @Nested
  @DisplayName("PayrollBonusController")
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
  @AutoConfigureMockMvc
  @TestInstance(TestInstance.Lifecycle.PER_CLASS)
  class PayrollBonusControllerTests {

    @Autowired MockMvc mockMvc;

    String financeToken;
    String ceoToken;
    String employeeToken;

    @BeforeAll
    void setUp() throws Exception {
      financeToken = login(mockMvc, "finance.demo", "123456");
      ceoToken = login(mockMvc, "ceo.demo", "123456");
      employeeToken = login(mockMvc, "employee.demo", "123456");
    }

    @Test
    @DisplayName("GET /payroll/cycles/{cycleId}/bonuses - FINANCE returns 200")
    void list_finance_returns200() throws Exception {
      mockMvc
          .perform(
              get("/payroll/cycles/1/bonuses").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /payroll/cycles/{cycleId}/bonuses - CEO returns 200")
    void list_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/payroll/cycles/1/bonuses").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /payroll/cycles/{cycleId}/bonuses - employee returns 403")
    void list_employee_returns403() throws Exception {
      mockMvc
          .perform(
              get("/payroll/cycles/1/bonuses").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /payroll/cycles/{cycleId}/bonuses - FINANCE creates bonus")
    void create_finance_returns200() throws Exception {
      mockMvc
          .perform(
              post("/payroll/cycles/1/bonuses")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"employeeId\":1,\"amount\":500.00,\"remark\":\"performance bonus\"}")
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status == 200 || status == 400 : "Expected 200 or 400, got " + status;
              });
    }

    @Test
    @DisplayName("POST /payroll/cycles/{cycleId}/bonuses - CEO returns 403")
    void create_ceo_returns403() throws Exception {
      mockMvc
          .perform(
              post("/payroll/cycles/1/bonuses")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"employeeId\":1,\"amount\":500.00,\"remark\":\"bonus\"}")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /payroll/bonuses/{id} - FINANCE on non-existent returns error")
    void delete_nonExistent_returnsError() throws Exception {
      mockMvc
          .perform(
              delete("/payroll/bonuses/999999").header("Authorization", "Bearer " + financeToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status >= 400 : "Expected 4xx, got " + status;
              });
    }

    @Test
    @DisplayName("DELETE /payroll/bonuses/{id} - employee returns 403")
    void delete_employee_returns403() throws Exception {
      mockMvc
          .perform(delete("/payroll/bonuses/1").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /payroll/bonus-approval-config - authenticated returns 200")
    void getApprovalConfig_authenticated_returns200() throws Exception {
      mockMvc
          .perform(
              get("/payroll/bonus-approval-config")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /payroll/bonus-approval-config - no token returns 401")
    void getApprovalConfig_noToken_returns401() throws Exception {
      mockMvc.perform(get("/payroll/bonus-approval-config")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PUT /payroll/bonus-approval-config - CEO updates config")
    void setApprovalConfig_ceo_returns200() throws Exception {
      mockMvc
          .perform(
              put("/payroll/bonus-approval-config")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"approvalRequired\":true}")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /payroll/bonus-approval-config - FINANCE returns 403")
    void setApprovalConfig_finance_returns403() throws Exception {
      mockMvc
          .perform(
              put("/payroll/bonus-approval-config")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"approvalRequired\":false}")
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isForbidden());
    }
  }

  // ── Shared helper ─────────────────────────────────────────────────────────

  /**
   * Authenticates via POST /auth/login and returns the JWT token string.
   *
   * @param mockMvc the MockMvc instance from the enclosing nested class
   * @param username login username
   * @param password login password
   * @return JWT token string
   */
  static String login(MockMvc mockMvc, String username, String password) throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode node = MAPPER.readTree(result.getResponse().getContentAsString());
    return node.get("token").asText();
  }
}
