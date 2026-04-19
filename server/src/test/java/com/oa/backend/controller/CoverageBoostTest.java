package com.oa.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

/**
 * Coverage boost integration test — targets zero/near-zero coverage classes.
 *
 * <p>Covers: AttendanceController, WorkbenchController/Service, ExpenseController,
 * OvertimeNotificationController, WorkLogController, PayrollCorrectionService (via
 * PayrollController).
 *
 * <p>Test DB: H2 (test application.yml), seeded by data.sql. Auth: POST /auth/login → JWT.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@DisplayName("Coverage Boost — zero/near-zero coverage controllers")
class CoverageBoostTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

  // JWT tokens per role — refreshed before each test to stay stateless
  private String ceoToken;
  private String employeeToken;
  private String financeToken;
  private String pmToken;
  private String workerToken;
  private String hrToken;

  @BeforeEach
  void acquireTokens() throws Exception {
    ceoToken = login("ceo.demo");
    employeeToken = login("employee.demo");
    financeToken = login("finance.demo");
    pmToken = login("pm.demo");
    workerToken = login("worker.demo");
    hrToken = login("hr.demo");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AttendanceController
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName("AttendanceController")
  class AttendanceControllerTests {

    @Test
    @DisplayName("GET /attendance/leave/config - employee returns 200 with form config")
    void leaveConfig_employee_returns200() throws Exception {
      mockMvc
          .perform(
              get("/attendance/leave/config").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.formType").value("LEAVE"));
    }

    @Test
    @DisplayName("GET /attendance/leave/config - no token returns 401")
    void leaveConfig_noToken_returns401() throws Exception {
      mockMvc.perform(get("/attendance/leave/config")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /attendance/overtime/config - employee returns 200 with form config")
    void overtimeConfig_employee_returns200() throws Exception {
      mockMvc
          .perform(
              get("/attendance/overtime/config").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.formType").value("OVERTIME"));
    }

    @Test
    @DisplayName("GET /attendance/overtime/config - no token returns 401")
    void overtimeConfig_noToken_returns401() throws Exception {
      mockMvc.perform(get("/attendance/overtime/config")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /attendance/leave - employee submits leave with valid body returns 200")
    void submitLeave_validBody_returns200() throws Exception {
      Map<String, Object> formData = new HashMap<>();
      formData.put("leaveType", "年假");
      formData.put("startDate", "2026-05-01");
      formData.put("endDate", "2026-05-03");
      formData.put("days", 3);
      formData.put("reason", "年假休息");

      Map<String, Object> req = new HashMap<>();
      req.put("formData", formData);
      req.put("remark", "test");

      mockMvc
          .perform(
              post("/attendance/leave")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /attendance/leave - no token returns 401")
    void submitLeave_noToken_returns401() throws Exception {
      Map<String, Object> formData = new HashMap<>();
      formData.put("leaveType", "年假");
      formData.put("days", 1);
      formData.put("reason", "rest");

      Map<String, Object> req = new HashMap<>();
      req.put("formData", formData);

      mockMvc
          .perform(
              post("/attendance/leave")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /attendance/leave - missing formData returns 400")
    void submitLeave_missingFormData_returns400() throws Exception {
      // formData is @NotNull — omitting it triggers validation failure
      Map<String, Object> req = new HashMap<>();
      req.put("remark", "test");

      mockMvc
          .perform(
              post("/attendance/leave")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /attendance/overtime - employee submits overtime returns 200")
    void submitOvertime_validBody_returns200() throws Exception {
      Map<String, Object> formData = new HashMap<>();
      formData.put("overtimeDate", "2026-05-10");
      formData.put("startTime", "18:00");
      formData.put("endTime", "21:00");
      formData.put("hours", 3);
      formData.put("reason", "项目赶工");

      Map<String, Object> req = new HashMap<>();
      req.put("formData", formData);
      req.put("remark", "加班申请");

      mockMvc
          .perform(
              post("/attendance/overtime")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /attendance/overtime - no token returns 401")
    void submitOvertime_noToken_returns401() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("formData", Map.of("hours", 2));

      mockMvc
          .perform(
              post("/attendance/overtime")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /attendance/records - employee returns 200 with list")
    void getRecords_employee_returns200() throws Exception {
      mockMvc
          .perform(get("/attendance/records").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /attendance/records - no token returns 401")
    void getRecords_noToken_returns401() throws Exception {
      mockMvc.perform(get("/attendance/records")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /attendance/todo - PM returns 200 with list")
    void getTodoList_pm_returns200() throws Exception {
      mockMvc
          .perform(get("/attendance/todo").header("Authorization", "Bearer " + pmToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /attendance/todo - employee returns 403")
    void getTodoList_employee_returns403() throws Exception {
      mockMvc
          .perform(get("/attendance/todo").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /attendance/todo - no token returns 401")
    void getTodoList_noToken_returns401() throws Exception {
      mockMvc.perform(get("/attendance/todo")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /attendance/history - CEO returns 200")
    void getHistory_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/attendance/history").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /attendance/history - employee returns 403")
    void getHistory_employee_returns403() throws Exception {
      mockMvc
          .perform(get("/attendance/history").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /attendance/overtime-self-report - worker submits self-report returns 200")
    void overtimeSelfReport_worker_returns200() throws Exception {
      Map<String, Object> formData = new HashMap<>();
      formData.put("overtimeDate", "2026-04-15");
      formData.put("startTime", "20:00");
      formData.put("endTime", "23:00");
      formData.put("hours", 3);
      formData.put("reason", "补申报");

      Map<String, Object> req = new HashMap<>();
      req.put("formData", formData);
      req.put("remark", "补申报加班");

      mockMvc
          .perform(
              post("/attendance/overtime-self-report")
                  .header("Authorization", "Bearer " + workerToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName(
        "POST /attendance/overtime-self-report - CEO returns 403 (CEO not in allowed roles)")
    void overtimeSelfReport_ceo_returns403() throws Exception {
      Map<String, Object> formData = new HashMap<>();
      formData.put("overtimeDate", "2026-04-15");
      formData.put("hours", 2);
      formData.put("reason", "test");

      Map<String, Object> req = new HashMap<>();
      req.put("formData", formData);

      mockMvc
          .perform(
              post("/attendance/overtime-self-report")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /attendance/{id}/approve - PM approve non-existent form returns non-2xx")
    void approve_pmApproveNonExistentForm_returnsError() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("comment", "approved");

      mockMvc
          .perform(
              post("/attendance/99999/approve")
                  .header("Authorization", "Bearer " + pmToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status >= 400 : "Expected 4xx but got " + status;
              });
    }

    @Test
    @DisplayName("POST /attendance/{id}/approve - employee returns 403")
    void approve_employee_returns403() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("comment", "test");

      mockMvc
          .perform(
              post("/attendance/1/approve")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /attendance/{id}/reject - employee returns 403")
    void reject_employee_returns403() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("comment", "test");

      mockMvc
          .perform(
              post("/attendance/1/reject")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isForbidden());
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WorkbenchController + WorkbenchService
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName("WorkbenchController + WorkbenchService")
  class WorkbenchTests {

    @Test
    @DisplayName("GET /workbench/config - CEO returns 200 with menus")
    void workbenchConfig_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/workbench/config").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.menus").isArray())
          .andExpect(jsonPath("$.quickActions").isArray());
    }

    @Test
    @DisplayName("GET /workbench/config - finance returns 200 with role-specific menus")
    void workbenchConfig_finance_returns200() throws Exception {
      mockMvc
          .perform(get("/workbench/config").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.menus").isArray());
    }

    @Test
    @DisplayName("GET /workbench/config - PM returns 200 with role-specific menus")
    void workbenchConfig_pm_returns200() throws Exception {
      mockMvc
          .perform(get("/workbench/config").header("Authorization", "Bearer " + pmToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.menus").isArray());
    }

    @Test
    @DisplayName("GET /workbench/config - worker returns 200 with role-specific menus")
    void workbenchConfig_worker_returns200() throws Exception {
      mockMvc
          .perform(get("/workbench/config").header("Authorization", "Bearer " + workerToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.menus").isArray());
    }

    @Test
    @DisplayName("GET /workbench/config - employee returns 200 with role-specific menus")
    void workbenchConfig_employee_returns200() throws Exception {
      mockMvc
          .perform(get("/workbench/config").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.menus").isArray());
    }

    @Test
    @DisplayName("GET /workbench/config - HR returns 200 with role-specific menus")
    void workbenchConfig_hr_returns200() throws Exception {
      mockMvc
          .perform(get("/workbench/config").header("Authorization", "Bearer " + hrToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.menus").isArray());
    }

    @Test
    @DisplayName("GET /workbench/config - no token returns 401")
    void workbenchConfig_noToken_returns401() throws Exception {
      mockMvc.perform(get("/workbench/config")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /workbench/summary - CEO returns 200 with summary")
    void workbenchSummary_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/workbench/summary").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /workbench/summary - finance returns 200 (payroll status visible)")
    void workbenchSummary_finance_returns200() throws Exception {
      mockMvc
          .perform(get("/workbench/summary").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /workbench/summary - employee returns 200")
    void workbenchSummary_employee_returns200() throws Exception {
      mockMvc
          .perform(get("/workbench/summary").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /workbench/summary - worker returns 200")
    void workbenchSummary_worker_returns200() throws Exception {
      mockMvc
          .perform(get("/workbench/summary").header("Authorization", "Bearer " + workerToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /workbench/summary - PM returns 200 with active project count")
    void workbenchSummary_pm_returns200() throws Exception {
      mockMvc
          .perform(get("/workbench/summary").header("Authorization", "Bearer " + pmToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /workbench/summary - no token returns 401")
    void workbenchSummary_noToken_returns401() throws Exception {
      mockMvc.perform(get("/workbench/summary")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /me/profile - CEO returns 200 with profile")
    void meProfile_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/me/profile").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.role").value("ceo"));
    }

    @Test
    @DisplayName("GET /me/profile - employee returns 200")
    void meProfile_employee_returns200() throws Exception {
      mockMvc
          .perform(get("/me/profile").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /me/profile - finance returns 200")
    void meProfile_finance_returns200() throws Exception {
      mockMvc
          .perform(get("/me/profile").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /me/profile - no token returns 401")
    void meProfile_noToken_returns401() throws Exception {
      mockMvc.perform(get("/me/profile")).andExpect(status().isUnauthorized());
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ExpenseController
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName("ExpenseController")
  class ExpenseControllerTests {

    @Test
    @DisplayName("GET /expense/config - employee returns 200 with form config")
    void expenseConfig_employee_returns200() throws Exception {
      mockMvc
          .perform(get("/expense/config").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.formType").value("EXPENSE"));
    }

    @Test
    @DisplayName("GET /expense/config - no token returns 401")
    void expenseConfig_noToken_returns401() throws Exception {
      mockMvc.perform(get("/expense/config")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /expense/types - employee returns 200 with type list")
    void expenseTypes_employee_returns200() throws Exception {
      mockMvc
          .perform(get("/expense/types").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /expense/types - no token returns 401")
    void expenseTypes_noToken_returns401() throws Exception {
      mockMvc.perform(get("/expense/types")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /expense/records - employee returns 200 with own records")
    void expenseRecords_employee_returns200() throws Exception {
      mockMvc
          .perform(get("/expense/records").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /expense/records - finance returns 200")
    void expenseRecords_finance_returns200() throws Exception {
      mockMvc
          .perform(get("/expense/records").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /expense/records - no token returns 401")
    void expenseRecords_noToken_returns401() throws Exception {
      mockMvc.perform(get("/expense/records")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /expense - employee submits expense with valid body returns 200")
    void submitExpense_validBody_returns200() throws Exception {
      Map<String, Object> item = new HashMap<>();
      item.put("itemType", "MEAL");
      item.put("expenseDate", LocalDate.now().toString());
      item.put("amount", 50.00);
      item.put("description", "工作餐");

      Map<String, Object> req = new HashMap<>();
      req.put("expenseType", "MEAL");
      req.put("totalAmount", 50.00);
      req.put("items", List.of(item));
      req.put("remark", "test expense");

      mockMvc
          .perform(
              post("/expense")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /expense - missing required fields returns 400")
    void submitExpense_missingRequiredFields_returns400() throws Exception {
      // expenseType and totalAmount and items are all @NotBlank/@NotNull/@NotEmpty
      Map<String, Object> req = new HashMap<>();
      req.put("remark", "incomplete");

      mockMvc
          .perform(
              post("/expense")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /expense - no token returns 401")
    void submitExpense_noToken_returns401() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("expenseType", "MEAL");
      req.put("totalAmount", 100.00);

      mockMvc
          .perform(
              post("/expense")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /expense/{id} - non-existent form ID returns non-200")
    void expenseDetail_nonExistentId_returnsError() throws Exception {
      mockMvc
          .perform(get("/expense/99999").header("Authorization", "Bearer " + employeeToken))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status != 200 : "Expected non-200 for non-existent expense ID";
              });
    }

    @Test
    @DisplayName("GET /expense/{id} - no token returns 401")
    void expenseDetail_noToken_returns401() throws Exception {
      mockMvc.perform(get("/expense/1")).andExpect(status().isUnauthorized());
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OvertimeNotificationController
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName("OvertimeNotificationController")
  class OvertimeNotificationControllerTests {

    @Test
    @DisplayName("GET /overtime-notifications - employee returns 200 with list")
    void listNotifications_employee_returns200() throws Exception {
      mockMvc
          .perform(
              get("/overtime-notifications").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /overtime-notifications - worker returns 200")
    void listNotifications_worker_returns200() throws Exception {
      mockMvc
          .perform(get("/overtime-notifications").header("Authorization", "Bearer " + workerToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /overtime-notifications - no token returns 401")
    void listNotifications_noToken_returns401() throws Exception {
      mockMvc.perform(get("/overtime-notifications")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /overtime-notifications/initiated - PM returns 200")
    void listInitiated_pm_returns200() throws Exception {
      mockMvc
          .perform(
              get("/overtime-notifications/initiated").header("Authorization", "Bearer " + pmToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /overtime-notifications/initiated - CEO returns 200")
    void listInitiated_ceo_returns200() throws Exception {
      mockMvc
          .perform(
              get("/overtime-notifications/initiated")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /overtime-notifications/initiated - employee returns 403")
    void listInitiated_employee_returns403() throws Exception {
      mockMvc
          .perform(
              get("/overtime-notifications/initiated")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /overtime-notifications/initiated - no token returns 401")
    void listInitiated_noToken_returns401() throws Exception {
      mockMvc
          .perform(get("/overtime-notifications/initiated"))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /overtime-notifications - PM creates notification returns 200")
    void createNotification_pm_returns200() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("projectId", 1L);
      req.put("overtimeDate", LocalDate.now().toString());
      req.put("overtimeType", "WEEKEND");
      req.put("content", "周末加班通知");

      mockMvc
          .perform(
              post("/overtime-notifications")
                  .header("Authorization", "Bearer " + pmToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /overtime-notifications - CEO creates notification (ARCHIVED status)")
    void createNotification_ceo_createsArchived() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("projectId", 1L);
      req.put("overtimeDate", LocalDate.now().toString());
      req.put("overtimeType", "HOLIDAY");
      req.put("content", "节假日加班通知 - CEO");

      mockMvc
          .perform(
              post("/overtime-notifications")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.status").value("ARCHIVED"));
    }

    @Test
    @DisplayName("POST /overtime-notifications - employee returns 403")
    void createNotification_employee_returns403() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("projectId", 1L);
      req.put("overtimeDate", LocalDate.now().toString());
      req.put("overtimeType", "WEEKDAY");
      req.put("content", "test");

      mockMvc
          .perform(
              post("/overtime-notifications")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /overtime-notifications - no token returns 401")
    void createNotification_noToken_returns401() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("projectId", 1L);
      req.put("overtimeDate", LocalDate.now().toString());
      req.put("overtimeType", "WEEKDAY");
      req.put("content", "test");

      mockMvc
          .perform(
              post("/overtime-notifications")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /overtime-notifications/{id}/respond - employee accepts notification")
    void respondNotification_employeeAccepts_returns200() throws Exception {
      // First create a notification via PM
      Map<String, Object> createReq = new HashMap<>();
      createReq.put("projectId", 1L);
      createReq.put("overtimeDate", LocalDate.now().toString());
      createReq.put("overtimeType", "WEEKEND");
      createReq.put("content", "respond test notification");

      MvcResult createResult =
          mockMvc
              .perform(
                  post("/overtime-notifications")
                      .header("Authorization", "Bearer " + pmToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createReq)))
              .andExpect(status().isOk())
              .andReturn();

      JsonNode created = objectMapper.readTree(createResult.getResponse().getContentAsString());
      long notificationId = created.get("id").asLong();

      // Employee accepts
      Map<String, Object> respondReq = new HashMap<>();
      respondReq.put("accepted", true);
      respondReq.put("rejectReason", null);

      mockMvc
          .perform(
              post("/overtime-notifications/" + notificationId + "/respond")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(respondReq)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.accepted").value(true));
    }

    @Test
    @DisplayName("POST /overtime-notifications/{id}/respond - idempotent: second accept updates")
    void respondNotification_idempotentUpdate_returns200() throws Exception {
      // Create a NOTIFIED notification
      Map<String, Object> createReq = new HashMap<>();
      createReq.put("projectId", 1L);
      createReq.put("overtimeDate", LocalDate.now().toString());
      createReq.put("overtimeType", "WEEKDAY");
      createReq.put("content", "idempotent test");

      MvcResult createResult =
          mockMvc
              .perform(
                  post("/overtime-notifications")
                      .header("Authorization", "Bearer " + pmToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createReq)))
              .andExpect(status().isOk())
              .andReturn();

      long notificationId =
          objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

      Map<String, Object> respondReq = new HashMap<>();
      respondReq.put("accepted", true);

      // First response
      mockMvc
          .perform(
              post("/overtime-notifications/" + notificationId + "/respond")
                  .header("Authorization", "Bearer " + workerToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(respondReq)))
          .andExpect(status().isOk());

      // Second response (idempotent update)
      mockMvc
          .perform(
              post("/overtime-notifications/" + notificationId + "/respond")
                  .header("Authorization", "Bearer " + workerToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(respondReq)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.accepted").value(true));
    }

    @Test
    @DisplayName(
        "POST /overtime-notifications/{id}/respond - CEO-created (ARCHIVED) reject returns 400")
    void respondNotification_archivedReject_returns400() throws Exception {
      // CEO creates → ARCHIVED
      Map<String, Object> createReq = new HashMap<>();
      createReq.put("projectId", 1L);
      createReq.put("overtimeDate", LocalDate.now().toString());
      createReq.put("overtimeType", "HOLIDAY");
      createReq.put("content", "CEO-initiated cannot reject");

      MvcResult createResult =
          mockMvc
              .perform(
                  post("/overtime-notifications")
                      .header("Authorization", "Bearer " + ceoToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createReq)))
              .andExpect(status().isOk())
              .andReturn();

      long notificationId =
          objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

      // Try to reject an ARCHIVED notification — must return 400
      Map<String, Object> rejectReq = new HashMap<>();
      rejectReq.put("accepted", false);
      rejectReq.put("rejectReason", "I don't want to");

      mockMvc
          .perform(
              post("/overtime-notifications/" + notificationId + "/respond")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(rejectReq)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /overtime-notifications/{id}/respond - non-existent ID returns 404")
    void respondNotification_notFound_returns404() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("accepted", true);

      mockMvc
          .perform(
              post("/overtime-notifications/99999/respond")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isNotFound());
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WorkLogController
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName("WorkLogController")
  class WorkLogControllerTests {

    @Test
    @DisplayName("GET /logs/records - worker returns 200 with list")
    void getRecords_worker_returns200() throws Exception {
      mockMvc
          .perform(get("/logs/records").header("Authorization", "Bearer " + workerToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /logs/records - CEO returns 200")
    void getRecords_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/logs/records").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /logs/records - employee returns 403")
    void getRecords_employee_returns403() throws Exception {
      mockMvc
          .perform(get("/logs/records").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /logs/records - no token returns 401")
    void getRecords_noToken_returns401() throws Exception {
      mockMvc.perform(get("/logs/records")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /logs/todo - PM returns 200 with pending list")
    void getTodo_pm_returns200() throws Exception {
      mockMvc
          .perform(get("/logs/todo").header("Authorization", "Bearer " + pmToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /logs/todo - CEO returns 200")
    void getTodo_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/logs/todo").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /logs/todo - worker returns 403")
    void getTodo_worker_returns403() throws Exception {
      mockMvc
          .perform(get("/logs/todo").header("Authorization", "Bearer " + workerToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /logs/todo - no token returns 401")
    void getTodo_noToken_returns401() throws Exception {
      mockMvc.perform(get("/logs/todo")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /logs - worker submits construction log returns 200")
    void submitLog_worker_returns200() throws Exception {
      Map<String, Object> formData = new HashMap<>();
      formData.put("projectId", 1);
      formData.put("date", LocalDate.now().toString());
      formData.put("content", "今日浇筑完成");
      formData.put("weatherCondition", "晴");
      formData.put("workersCount", 10);

      Map<String, Object> req = new HashMap<>();
      req.put("formData", formData);
      req.put("remark", "施工日志测试");

      mockMvc
          .perform(
              post("/logs")
                  .header("Authorization", "Bearer " + workerToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /logs - PM submits log (self-submit path) returns 200")
    void submitLog_pm_returns200() throws Exception {
      Map<String, Object> formData = new HashMap<>();
      formData.put("projectId", 1);
      formData.put("date", LocalDate.now().toString());
      formData.put("content", "PM自填日志");

      Map<String, Object> req = new HashMap<>();
      req.put("formData", formData);
      req.put("remark", "PM代填");

      mockMvc
          .perform(
              post("/logs")
                  .header("Authorization", "Bearer " + pmToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /logs - employee returns 403")
    void submitLog_employee_returns403() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("formData", Map.of("content", "test"));

      mockMvc
          .perform(
              post("/logs")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /logs - no token returns 401")
    void submitLog_noToken_returns401() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("formData", Map.of("content", "test"));

      mockMvc
          .perform(
              post("/logs")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /logs/injury - worker submits injury report returns 200")
    void submitInjury_worker_returns200() throws Exception {
      Map<String, Object> formData = new HashMap<>();
      formData.put("injuryDate", LocalDate.now().toString());
      formData.put("injuryType", "FALL");
      formData.put("description", "高处坠落");
      formData.put("severity", "MINOR");

      Map<String, Object> req = new HashMap<>();
      req.put("formData", formData);
      req.put("remark", "工伤申报");

      mockMvc
          .perform(
              post("/logs/injury")
                  .header("Authorization", "Bearer " + workerToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /logs/injury - employee returns 403")
    void submitInjury_employee_returns403() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("formData", Map.of("injuryType", "FALL"));

      mockMvc
          .perform(
              post("/logs/injury")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /logs/construction-logs - worker submits returns 200")
    void submitConstructionLog_worker_returns200() throws Exception {
      Map<String, Object> formData = new HashMap<>();
      formData.put("projectId", 1);
      formData.put("date", LocalDate.now().toString());
      formData.put("content", "施工日志 workItems 路径测试");

      Map<String, Object> req = new HashMap<>();
      req.put("formData", formData);
      req.put("remark", "via /construction-logs");

      mockMvc
          .perform(
              post("/logs/construction-logs")
                  .header("Authorization", "Bearer " + workerToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /logs/construction-logs - PM returns 403 (WORKER only)")
    void submitConstructionLog_pm_returns403() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("formData", Map.of("content", "pm test"));

      mockMvc
          .perform(
              post("/logs/construction-logs")
                  .header("Authorization", "Bearer " + pmToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PATCH /logs/construction-logs/{id}/review - PM adds note returns 204")
    void reviewLog_pm_returns204() throws Exception {
      // First create a log via worker to get an ID
      Map<String, Object> formData = new HashMap<>();
      formData.put("projectId", 1);
      formData.put("date", LocalDate.now().toString());
      formData.put("content", "review test log");

      Map<String, Object> submitReq = new HashMap<>();
      submitReq.put("formData", formData);
      submitReq.put("remark", "for review");

      MvcResult logResult =
          mockMvc
              .perform(
                  post("/logs/construction-logs")
                      .header("Authorization", "Bearer " + workerToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(submitReq)))
              .andExpect(status().isOk())
              .andReturn();

      long logId =
          objectMapper.readTree(logResult.getResponse().getContentAsString()).get("id").asLong();

      Map<String, String> reviewReq = new HashMap<>();
      reviewReq.put("pmNote", "批注：施工质量达标");

      mockMvc
          .perform(
              patch("/logs/construction-logs/" + logId + "/review")
                  .header("Authorization", "Bearer " + pmToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(reviewReq)))
          .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("PATCH /logs/construction-logs/{id}/review - employee returns 403")
    void reviewLog_employee_returns403() throws Exception {
      Map<String, String> req = new HashMap<>();
      req.put("pmNote", "test");

      mockMvc
          .perform(
              patch("/logs/construction-logs/1/review")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /logs/{id}/approve - PM approve non-existent ID returns error")
    void approve_pmApproveNonExistent_returnsError() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("comment", "approved");

      mockMvc
          .perform(
              post("/logs/99999/approve")
                  .header("Authorization", "Bearer " + pmToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status >= 400 : "Expected 4xx for non-existent form but got " + status;
              });
    }

    @Test
    @DisplayName("POST /logs/{id}/approve - worker returns 403")
    void approve_worker_returns403() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("comment", "test");

      mockMvc
          .perform(
              post("/logs/1/approve")
                  .header("Authorization", "Bearer " + workerToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /logs/{id}/reject - worker returns 403")
    void reject_worker_returns403() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("comment", "test");

      mockMvc
          .perform(
              post("/logs/1/reject")
                  .header("Authorization", "Bearer " + workerToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /logs/construction-logs/{id}/recall - CEO recall non-existent returns 404")
    void recallLog_ceo_nonExistent_returns404() throws Exception {
      Map<String, String> req = new HashMap<>();
      req.put("reason", "mistake");

      mockMvc
          .perform(
              post("/logs/construction-logs/99999/recall")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /logs/construction-logs/{id}/recall - PM returns 403 (CEO only)")
    void recallLog_pm_returns403() throws Exception {
      Map<String, String> req = new HashMap<>();
      req.put("reason", "test");

      mockMvc
          .perform(
              post("/logs/construction-logs/1/recall")
                  .header("Authorization", "Bearer " + pmToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isForbidden());
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PayrollController — PayrollCorrectionService coverage
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName("PayrollController — correction service coverage")
  class PayrollCorrectionServiceTests {

    @Test
    @DisplayName("GET /payroll/corrections - finance returns 200 with list")
    void listCorrections_finance_returns200() throws Exception {
      mockMvc
          .perform(get("/payroll/corrections").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /payroll/corrections - CEO returns 200")
    void listCorrections_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/payroll/corrections").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /payroll/corrections - employee returns 403")
    void listCorrections_employee_returns403() throws Exception {
      mockMvc
          .perform(get("/payroll/corrections").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /payroll/corrections - no token returns 401")
    void listCorrections_noToken_returns401() throws Exception {
      mockMvc.perform(get("/payroll/corrections")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /payroll/slips/{id}/correction - non-existent slip returns error")
    void createCorrection_nonExistentSlip_returnsError() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("reason", "salary miscalculation");
      req.put("corrections", List.of());

      mockMvc
          .perform(
              post("/payroll/slips/99999/correction")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(
              result -> {
                int status = result.getResponse().getStatus();
                assert status >= 400 : "Expected 4xx for non-existent slip but got " + status;
              });
    }

    @Test
    @DisplayName("POST /payroll/slips/{id}/correction - employee returns 403")
    void createCorrection_employee_returns403() throws Exception {
      Map<String, Object> req = new HashMap<>();
      req.put("reason", "test");
      req.put("corrections", List.of());

      mockMvc
          .perform(
              post("/payroll/slips/1/correction")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(req)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /payroll/slips - employee returns 200 with own slips")
    void listSlips_employee_returns200() throws Exception {
      mockMvc
          .perform(get("/payroll/slips").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /payroll/cycles - finance returns 200")
    void listCycles_finance_returns200() throws Exception {
      mockMvc
          .perform(get("/payroll/cycles").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /payroll/corrections?cycleId=1 - finance can filter by cycleId")
    void listCorrections_withCycleIdFilter_returns200() throws Exception {
      mockMvc
          .perform(
              get("/payroll/corrections")
                  .param("cycleId", "1")
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /payroll/corrections?employeeId=1 - finance can filter by employeeId")
    void listCorrections_withEmployeeIdFilter_returns200() throws Exception {
      mockMvc
          .perform(
              get("/payroll/corrections")
                  .param("employeeId", "1")
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // helper
  // ─────────────────────────────────────────────────────────────────────────

  private String login(String username) throws Exception {
    Map<String, String> req = Map.of("username", username, "password", "123456");
    MvcResult result =
        mockMvc
            .perform(
                post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andReturn();
    return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
  }
}
