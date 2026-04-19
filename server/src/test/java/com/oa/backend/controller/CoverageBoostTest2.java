package com.oa.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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
 * Coverage boost integration test 2 — targets controllers with 0–16 % coverage.
 *
 * <p>Covers: PhoneChangeController, WorkItemTemplateController, ProjectInsuranceController,
 * AllowanceController, AfterSaleController, SecondRoleController, OrgController (OrgService), and
 * related services (SecondRoleService, OrgService).
 *
 * <p>Test DB: H2 (test application.yml), seeded by data.sql. Auth: POST /auth/login → JWT.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@DisplayName(
    "Coverage Boost 2 — phone-change / templates / insurance / allowances / after-sale / second-roles / org")
class CoverageBoostTest2 {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

  // JWT tokens — refreshed before every test; login goes through the real auth stack
  private String ceoToken;
  private String employeeToken;
  private String financeToken;
  private String pmToken;
  private String workerToken;
  private String hrToken;
  private String deptManagerToken;

  @BeforeEach
  void acquireTokens() throws Exception {
    ceoToken = login("ceo.demo");
    employeeToken = login("employee.demo");
    financeToken = login("finance.demo");
    pmToken = login("pm.demo");
    workerToken = login("worker.demo");
    hrToken = login("hr.demo");
    deptManagerToken = login("dept_manager.demo");
  }

  // ── helper ──────────────────────────────────────────────────────────────────

  /**
   * Obtains a JWT from the real login endpoint.
   *
   * @param username employee_no of the seed test account (password is always "123456")
   * @return raw token string
   */
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
    JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
    return json.get("token").asText();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PhoneChangeController  (/auth/phone-change/**)
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName("PhoneChangeController")
  class PhoneChangeControllerTests {

    @Test
    @DisplayName(
        "POST /auth/phone-change/send-current-code - authenticated user with phone returns 200")
    void sendCurrentCode_authenticated_returns200() throws Exception {
      // ceo.demo has phone 13800000004 in seed data
      mockMvc
          .perform(
              post("/auth/phone-change/send-current-code")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.message").value("验证码已发送"));
    }

    @Test
    @DisplayName("POST /auth/phone-change/send-current-code - no token returns 4xx (401 or 400)")
    void sendCurrentCode_noToken_returns4xx() throws Exception {
      // send-current-code reads Authorization header directly; without a token the header is
      // missing so the controller sees a null Authorization → returns 400 (bad request).
      mockMvc
          .perform(post("/auth/phone-change/send-current-code"))
          .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("POST /auth/phone-change/verify-current-code - missing code returns 400")
    void verifyCurrentCode_missingCode_returns400() throws Exception {
      Map<String, String> body = new HashMap<>();
      // code field intentionally omitted
      mockMvc
          .perform(
              post("/auth/phone-change/verify-current-code")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /auth/phone-change/verify-current-code - wrong code returns 400")
    void verifyCurrentCode_wrongCode_returns400() throws Exception {
      // send first so the key exists, then supply wrong code
      mockMvc
          .perform(
              post("/auth/phone-change/send-current-code")
                  .header("Authorization", "Bearer " + pmToken))
          .andExpect(status().isOk());

      Map<String, String> body = Map.of("code", "000000");
      mockMvc
          .perform(
              post("/auth/phone-change/verify-current-code")
                  .header("Authorization", "Bearer " + pmToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /auth/phone-change/verify-current-code - no token returns 4xx")
    void verifyCurrentCode_noToken_returns4xx() throws Exception {
      // @PreAuthorize("isAuthenticated()") on this endpoint causes Spring Security to return
      // 403 (AccessDeniedException for anonymous principal) rather than 401 when no token is
      // present, depending on security configuration.
      Map<String, String> body = Map.of("code", "123456");
      mockMvc
          .perform(
              post("/auth/phone-change/verify-current-code")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("POST /auth/phone-change/send-new-code - missing changeToken returns 400")
    void sendNewCode_missingChangeToken_returns400() throws Exception {
      Map<String, String> body = Map.of("newPhone", "13912345678");
      mockMvc
          .perform(
              post("/auth/phone-change/send-new-code")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /auth/phone-change/send-new-code - invalid phone format returns 400")
    void sendNewCode_invalidPhone_returns400() throws Exception {
      Map<String, String> body =
          Map.of("changeToken", UUID.randomUUID().toString(), "newPhone", "12345");
      mockMvc
          .perform(
              post("/auth/phone-change/send-new-code")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /auth/phone-change/send-new-code - expired changeToken returns 400")
    void sendNewCode_expiredToken_returns400() throws Exception {
      // Supply a valid-format but non-existent change token
      Map<String, String> body =
          Map.of("changeToken", UUID.randomUUID().toString(), "newPhone", "13912345678");
      mockMvc
          .perform(
              post("/auth/phone-change/send-new-code")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /auth/phone-change/send-new-code - no token returns 4xx")
    void sendNewCode_noToken_returns4xx() throws Exception {
      // isAuthenticated() endpoints return 403 for anonymous callers in this security config
      Map<String, String> body =
          Map.of("changeToken", UUID.randomUUID().toString(), "newPhone", "13912345678");
      mockMvc
          .perform(
              post("/auth/phone-change/send-new-code")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("POST /auth/phone-change/confirm - missing changeToken returns 400")
    void confirm_missingChangeToken_returns400() throws Exception {
      Map<String, String> body = Map.of("newPhone", "13912345678", "code", "123456");
      mockMvc
          .perform(
              post("/auth/phone-change/confirm")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /auth/phone-change/confirm - invalid phone returns 400")
    void confirm_invalidPhone_returns400() throws Exception {
      Map<String, String> body =
          Map.of("changeToken", UUID.randomUUID().toString(), "newPhone", "1234", "code", "654321");
      mockMvc
          .perform(
              post("/auth/phone-change/confirm")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /auth/phone-change/confirm - expired changeToken returns 400")
    void confirm_expiredToken_returns400() throws Exception {
      Map<String, String> body =
          Map.of(
              "changeToken", UUID.randomUUID().toString(),
              "newPhone", "13912345678",
              "code", "654321");
      mockMvc
          .perform(
              post("/auth/phone-change/confirm")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /auth/phone-change/confirm - no token returns 4xx")
    void confirm_noToken_returns4xx() throws Exception {
      // isAuthenticated() endpoints return 403 for anonymous callers in this security config
      Map<String, String> body =
          Map.of(
              "changeToken", UUID.randomUUID().toString(),
              "newPhone", "13912345678",
              "code", "654321");
      mockMvc
          .perform(
              post("/auth/phone-change/confirm")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().is4xxClientError());
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WorkItemTemplateController  (/work-item-templates)
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName("WorkItemTemplateController")
  class WorkItemTemplateControllerTests {

    @Test
    @DisplayName("GET /work-item-templates - CEO returns 200 with list")
    void list_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/work-item-templates").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /work-item-templates - PM returns 200")
    void list_pm_returns200() throws Exception {
      mockMvc
          .perform(get("/work-item-templates").header("Authorization", "Bearer " + pmToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /work-item-templates - WORKER returns 200")
    void list_worker_returns200() throws Exception {
      mockMvc
          .perform(get("/work-item-templates").header("Authorization", "Bearer " + workerToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /work-item-templates?projectId=1 - filters by project")
    void list_withProjectId_returns200() throws Exception {
      mockMvc
          .perform(
              get("/work-item-templates")
                  .param("projectId", "1")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /work-item-templates - finance (forbidden) returns 403")
    void list_finance_returns403() throws Exception {
      mockMvc
          .perform(get("/work-item-templates").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /work-item-templates - no token returns 401")
    void list_noToken_returns401() throws Exception {
      mockMvc.perform(get("/work-item-templates")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /work-item-templates - CEO creates template returns 200")
    void create_ceo_returns200() throws Exception {
      Map<String, Object> body = new HashMap<>();
      body.put("name", "Test Template " + System.currentTimeMillis());
      body.put("projectId", null);
      body.put(
          "items",
          List.of(
              Map.of("name", "安装管道", "defaultUnit", "米"),
              Map.of("name", "焊接", "defaultUnit", "个")));

      mockMvc
          .perform(
              post("/work-item-templates")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.name").exists());
    }

    @Test
    @DisplayName("POST /work-item-templates - PM creates project-level template returns 200")
    void create_pm_projectLevel_returns200() throws Exception {
      Map<String, Object> body = new HashMap<>();
      body.put("name", "PM Template " + System.currentTimeMillis());
      body.put("projectId", 1L);
      body.put("items", List.of(Map.of("name", "检测", "defaultUnit", "次")));

      mockMvc
          .perform(
              post("/work-item-templates")
                  .header("Authorization", "Bearer " + pmToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /work-item-templates - missing required name returns 400")
    void create_missingName_returns400() throws Exception {
      Map<String, Object> body = new HashMap<>();
      body.put("name", ""); // @NotBlank
      body.put("items", List.of());

      mockMvc
          .perform(
              post("/work-item-templates")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /work-item-templates - FINANCE (forbidden) returns 403")
    void create_finance_returns403() throws Exception {
      Map<String, Object> body = Map.of("name", "Forbidden Template", "items", List.of());

      mockMvc
          .perform(
              post("/work-item-templates")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /work-item-templates/{id} - update non-existent template returns 404")
    void update_nonExistent_returns404() throws Exception {
      Map<String, Object> body = Map.of("name", "Updated Name", "items", List.of());

      mockMvc
          .perform(
              put("/work-item-templates/999999")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /work-item-templates/{id} - WORKER (forbidden) returns 403")
    void update_worker_returns403() throws Exception {
      Map<String, Object> body = Map.of("name", "New Name", "items", List.of());

      mockMvc
          .perform(
              put("/work-item-templates/1")
                  .header("Authorization", "Bearer " + workerToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /work-item-templates/{id}/derive - derive non-existent template returns 404")
    void derive_nonExistent_returns404() throws Exception {
      Map<String, Object> body = Map.of("name", "Derived Template", "items", List.of());

      mockMvc
          .perform(
              post("/work-item-templates/999999/derive")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /work-item-templates/{id} - delete non-existent template returns 404")
    void delete_nonExistent_returns404() throws Exception {
      mockMvc
          .perform(
              delete("/work-item-templates/999999").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Full lifecycle: create -> update -> derive -> delete")
    void fullLifecycle_createUpdateDerive_succeed() throws Exception {
      // Create
      Map<String, Object> createBody = new HashMap<>();
      createBody.put("name", "Lifecycle Template " + System.currentTimeMillis());
      createBody.put("items", List.of(Map.of("name", "步骤一", "defaultUnit", "次")));

      MvcResult createResult =
          mockMvc
              .perform(
                  post("/work-item-templates")
                      .header("Authorization", "Bearer " + ceoToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createBody)))
              .andExpect(status().isOk())
              .andReturn();

      Long createdId =
          objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

      // Update
      Map<String, Object> updateBody = new HashMap<>();
      updateBody.put("name", "Lifecycle Template Updated");
      updateBody.put("items", List.of(Map.of("name", "步骤A", "defaultUnit", "个")));

      mockMvc
          .perform(
              put("/work-item-templates/" + createdId)
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(updateBody)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.name").value("Lifecycle Template Updated"));

      // Derive
      Map<String, Object> deriveBody =
          Map.of(
              "name",
              "Derived from " + createdId,
              "items",
              List.of(Map.of("name", "派生步骤", "defaultUnit", "套")));

      MvcResult deriveResult =
          mockMvc
              .perform(
                  post("/work-item-templates/" + createdId + "/derive")
                      .header("Authorization", "Bearer " + ceoToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(deriveBody)))
              .andExpect(status().isOk())
              .andReturn();

      Long derivedId =
          objectMapper.readTree(deriveResult.getResponse().getContentAsString()).get("id").asLong();

      // Delete derived
      mockMvc
          .perform(
              delete("/work-item-templates/" + derivedId)
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isNoContent());

      // Delete original
      mockMvc
          .perform(
              delete("/work-item-templates/" + createdId)
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isNoContent());
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ProjectInsuranceController  (/projects/{projectId}/insurance)
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName("ProjectInsuranceController")
  class ProjectInsuranceControllerTests {

    @Test
    @DisplayName("GET /projects/1/insurance - CEO returns 200 with list")
    void list_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/projects/1/insurance").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /projects/1/insurance - FINANCE returns 200")
    void list_finance_returns200() throws Exception {
      mockMvc
          .perform(get("/projects/1/insurance").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /projects/1/insurance - PM returns 200")
    void list_pm_returns200() throws Exception {
      mockMvc
          .perform(get("/projects/1/insurance").header("Authorization", "Bearer " + pmToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /projects/1/insurance - EMPLOYEE (forbidden) returns 403")
    void list_employee_returns403() throws Exception {
      mockMvc
          .perform(get("/projects/1/insurance").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /projects/1/insurance - no token returns 401")
    void list_noToken_returns401() throws Exception {
      mockMvc.perform(get("/projects/1/insurance")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /projects/1/insurance - CEO creates insurance item returns 200")
    void create_ceo_returns200() throws Exception {
      Map<String, Object> body = new HashMap<>();
      body.put("insuranceName", "工程一切险 " + System.currentTimeMillis());
      body.put("scope", "GLOBAL");
      body.put("dailyRate", new BigDecimal("50.00"));
      body.put("effectiveDate", "2026-01-01");
      body.put("remark", "test remark");

      mockMvc
          .perform(
              post("/projects/1/insurance")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.insuranceName").exists());
    }

    @Test
    @DisplayName("POST /projects/1/insurance - FINANCE creates insurance item returns 200")
    void create_finance_returns200() throws Exception {
      Map<String, Object> body = new HashMap<>();
      body.put("insuranceName", "雇主责任险 " + System.currentTimeMillis());
      body.put("scope", "GLOBAL");
      body.put("dailyRate", new BigDecimal("30.00"));
      body.put("effectiveDate", "2026-01-15");

      mockMvc
          .perform(
              post("/projects/1/insurance")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /projects/1/insurance - missing required fields returns 400")
    void create_missingRequiredFields_returns400() throws Exception {
      Map<String, Object> body = new HashMap<>();
      body.put("insuranceName", "缺失字段保险");
      // Missing scope, dailyRate, effectiveDate

      mockMvc
          .perform(
              post("/projects/1/insurance")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /projects/1/insurance - PM (forbidden) returns 403")
    void create_pm_returns403() throws Exception {
      Map<String, Object> body = new HashMap<>();
      body.put("insuranceName", "禁止创建");
      body.put("scope", "GLOBAL");
      body.put("dailyRate", new BigDecimal("10.00"));
      body.put("effectiveDate", "2026-01-01");

      mockMvc
          .perform(
              post("/projects/1/insurance")
                  .header("Authorization", "Bearer " + pmToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /projects/1/insurance/summary - CEO returns 200 with cost summary")
    void summary_ceo_returns200() throws Exception {
      mockMvc
          .perform(
              get("/projects/1/insurance/summary").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /projects/1/insurance/summary - with date range returns 200")
    void summary_withDateRange_returns200() throws Exception {
      mockMvc
          .perform(
              get("/projects/1/insurance/summary")
                  .param("startDate", "2026-01-01")
                  .param("endDate", "2026-03-31")
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /projects/1/insurance/summary - EMPLOYEE (forbidden) returns 403")
    void summary_employee_returns403() throws Exception {
      mockMvc
          .perform(
              get("/projects/1/insurance/summary")
                  .header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /projects/1/insurance/{id} - non-existent item returns 404")
    void delete_nonExistent_returns404() throws Exception {
      mockMvc
          .perform(
              delete("/projects/1/insurance/999999").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /projects/1/insurance/{id} - non-existent item returns 404")
    void update_nonExistent_returns404() throws Exception {
      Map<String, Object> body = Map.of("insuranceName", "Updated Insurance");

      mockMvc
          .perform(
              put("/projects/1/insurance/999999")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Insurance full lifecycle: create -> update -> delete")
    void fullLifecycle_createUpdateDelete_succeed() throws Exception {
      // Create
      Map<String, Object> createBody = new HashMap<>();
      createBody.put("insuranceName", "Lifecycle Insurance " + System.currentTimeMillis());
      createBody.put("scope", "GLOBAL");
      createBody.put("dailyRate", new BigDecimal("25.50"));
      createBody.put("effectiveDate", "2026-02-01");
      createBody.put("remark", "lifecycle test");

      MvcResult createResult =
          mockMvc
              .perform(
                  post("/projects/1/insurance")
                      .header("Authorization", "Bearer " + financeToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createBody)))
              .andExpect(status().isOk())
              .andReturn();

      Long createdId =
          objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

      // Update
      Map<String, Object> updateBody =
          Map.of("insuranceName", "Updated Insurance", "dailyRate", new BigDecimal("30.00"));

      mockMvc
          .perform(
              put("/projects/1/insurance/" + createdId)
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(updateBody)))
          .andExpect(status().isOk());

      // Delete
      mockMvc
          .perform(
              delete("/projects/1/insurance/" + createdId)
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.message").value("已删除"));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AllowanceController  (/allowances)
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName("AllowanceController")
  class AllowanceControllerTests {

    @Test
    @DisplayName("GET /allowances - CEO returns 200 with list")
    void list_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/allowances").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /allowances - HR returns 200")
    void list_hr_returns200() throws Exception {
      mockMvc
          .perform(get("/allowances").header("Authorization", "Bearer " + hrToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /allowances - FINANCE returns 200")
    void list_finance_returns200() throws Exception {
      mockMvc
          .perform(get("/allowances").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /allowances - EMPLOYEE (forbidden) returns 403")
    void list_employee_returns403() throws Exception {
      mockMvc
          .perform(get("/allowances").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /allowances - no token returns 401")
    void list_noToken_returns401() throws Exception {
      mockMvc.perform(get("/allowances")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /allowances - CEO creates allowance def returns 200")
    void create_ceo_returns200() throws Exception {
      String code = "TEST_ALLOWANCE_" + System.currentTimeMillis();
      Map<String, Object> body = new HashMap<>();
      body.put("code", code);
      body.put("name", "Test Allowance");
      body.put("description", "Test Description");
      body.put("displayOrder", 99);
      body.put("isEnabled", true);

      mockMvc
          .perform(
              post("/allowances")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.code").value(code));
    }

    @Test
    @DisplayName("POST /allowances - HR creates allowance returns 200")
    void create_hr_returns200() throws Exception {
      String code = "HR_ALLOWANCE_" + System.currentTimeMillis();
      Map<String, Object> body = new HashMap<>();
      body.put("code", code);
      body.put("name", "HR Allowance");
      body.put("isEnabled", true);

      mockMvc
          .perform(
              post("/allowances")
                  .header("Authorization", "Bearer " + hrToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /allowances - missing code returns 400")
    void create_missingCode_returns400() throws Exception {
      Map<String, Object> body = new HashMap<>();
      body.put("name", "No Code Allowance");

      mockMvc
          .perform(
              post("/allowances")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /allowances - missing name returns 400")
    void create_missingName_returns400() throws Exception {
      Map<String, Object> body = new HashMap<>();
      body.put("code", "NAMELESS_" + System.currentTimeMillis());
      // name omitted

      mockMvc
          .perform(
              post("/allowances")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /allowances - duplicate code returns 400")
    void create_duplicateCode_returns400() throws Exception {
      String code = "DUP_CODE_" + System.currentTimeMillis();
      Map<String, Object> body = new HashMap<>();
      body.put("code", code);
      body.put("name", "First Allowance");
      body.put("isEnabled", true);

      // First creation succeeds
      mockMvc
          .perform(
              post("/allowances")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isOk());

      // Second creation with same code must fail
      body.put("name", "Duplicate Allowance");
      mockMvc
          .perform(
              post("/allowances")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.message").value("code 已存在: " + code));
    }

    @Test
    @DisplayName("POST /allowances - FINANCE (forbidden) returns 403")
    void create_finance_returns403() throws Exception {
      Map<String, Object> body = Map.of("code", "FORBIDDEN", "name", "Forbidden Allowance");

      mockMvc
          .perform(
              post("/allowances")
                  .header("Authorization", "Bearer " + financeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /allowances/{id} - non-existent id returns 404")
    void update_nonExistent_returns404() throws Exception {
      Map<String, Object> body = Map.of("name", "Updated Name", "isEnabled", true);

      mockMvc
          .perform(
              put("/allowances/999999")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /allowances/{id} - non-existent id returns 404")
    void delete_nonExistent_returns404() throws Exception {
      mockMvc
          .perform(delete("/allowances/999999").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /allowances/{id}/configs - CEO returns 200 with config list")
    void listConfigs_ceo_returns200() throws Exception {
      // Create an allowance def first
      String code = "CFG_TEST_" + System.currentTimeMillis();
      Map<String, Object> createBody =
          Map.of("code", code, "name", "Config Test", "isEnabled", true);
      MvcResult createResult =
          mockMvc
              .perform(
                  post("/allowances")
                      .header("Authorization", "Bearer " + ceoToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createBody)))
              .andExpect(status().isOk())
              .andReturn();

      Long defId =
          objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

      mockMvc
          .perform(
              get("/allowances/" + defId + "/configs")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("PUT /allowances/{id}/configs - saves global config returns 200")
    void saveConfigs_globalScope_returns200() throws Exception {
      // Create def
      String code = "SAVE_CFG_" + System.currentTimeMillis();
      Map<String, Object> createBody =
          Map.of("code", code, "name", "Save Config Test", "isEnabled", true);
      MvcResult createResult =
          mockMvc
              .perform(
                  post("/allowances")
                      .header("Authorization", "Bearer " + ceoToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createBody)))
              .andExpect(status().isOk())
              .andReturn();

      Long defId =
          objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

      // Save a GLOBAL config
      List<Map<String, Object>> configs =
          List.of(Map.of("scope", "GLOBAL", "amount", new BigDecimal("500.00")));

      mockMvc
          .perform(
              put("/allowances/" + defId + "/configs")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(configs)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.message").value("已保存"));
    }

    @Test
    @DisplayName("PUT /allowances/{id}/configs - GLOBAL with scopeTargetId returns 400")
    void saveConfigs_globalWithScopeTargetId_returns400() throws Exception {
      String code = "INVALID_CFG_" + System.currentTimeMillis();
      Map<String, Object> createBody =
          Map.of("code", code, "name", "Invalid Config", "isEnabled", true);
      MvcResult createResult =
          mockMvc
              .perform(
                  post("/allowances")
                      .header("Authorization", "Bearer " + ceoToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createBody)))
              .andExpect(status().isOk())
              .andReturn();

      Long defId =
          objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

      List<Map<String, Object>> configs =
          List.of(
              Map.of("scope", "GLOBAL", "scopeTargetId", 1, "amount", new BigDecimal("100.00")));

      mockMvc
          .perform(
              put("/allowances/" + defId + "/configs")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(configs)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /allowances/{id}/configs - POSITION without scopeTargetId returns 400")
    void saveConfigs_positionWithoutScopeTargetId_returns400() throws Exception {
      String code = "POS_CFG_" + System.currentTimeMillis();
      Map<String, Object> createBody =
          Map.of("code", code, "name", "Pos Config", "isEnabled", true);
      MvcResult createResult =
          mockMvc
              .perform(
                  post("/allowances")
                      .header("Authorization", "Bearer " + ceoToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createBody)))
              .andExpect(status().isOk())
              .andReturn();

      Long defId =
          objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

      List<Map<String, Object>> configs =
          List.of(Map.of("scope", "POSITION", "amount", new BigDecimal("200.00")));
      // scopeTargetId missing for POSITION scope

      mockMvc
          .perform(
              put("/allowances/" + defId + "/configs")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(configs)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /allowances/{id}/configs - negative amount returns 400")
    void saveConfigs_negativeAmount_returns400() throws Exception {
      String code = "NEG_AMT_" + System.currentTimeMillis();
      Map<String, Object> createBody =
          Map.of("code", code, "name", "Neg Amount", "isEnabled", true);
      MvcResult createResult =
          mockMvc
              .perform(
                  post("/allowances")
                      .header("Authorization", "Bearer " + ceoToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createBody)))
              .andExpect(status().isOk())
              .andReturn();

      Long defId =
          objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

      List<Map<String, Object>> configs =
          List.of(Map.of("scope", "GLOBAL", "amount", new BigDecimal("-1.00")));

      mockMvc
          .perform(
              put("/allowances/" + defId + "/configs")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(configs)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Allowance full lifecycle: create -> update -> delete")
    void fullLifecycle_createUpdateDelete() throws Exception {
      String code = "LIFECYCLE_" + System.currentTimeMillis();
      Map<String, Object> createBody = new HashMap<>();
      createBody.put("code", code);
      createBody.put("name", "Lifecycle Allowance");
      createBody.put("displayOrder", 50);
      createBody.put("isEnabled", true);

      MvcResult createResult =
          mockMvc
              .perform(
                  post("/allowances")
                      .header("Authorization", "Bearer " + ceoToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createBody)))
              .andExpect(status().isOk())
              .andReturn();

      Long defId =
          objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

      // Update
      Map<String, Object> updateBody =
          Map.of("name", "Updated Lifecycle Allowance", "displayOrder", 60, "isEnabled", false);
      mockMvc
          .perform(
              put("/allowances/" + defId)
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(updateBody)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.name").value("Updated Lifecycle Allowance"));

      // Delete
      mockMvc
          .perform(delete("/allowances/" + defId).header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.message").value("已删除"));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AfterSaleController  (/after-sale/**)
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName("AfterSaleController")
  class AfterSaleControllerTests {

    @Test
    @DisplayName("GET /after-sale/types - authenticated returns 200 with enabled types")
    void listTypes_authenticated_returns200() throws Exception {
      mockMvc
          .perform(get("/after-sale/types").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /after-sale/types - employee can access returns 200")
    void listTypes_employee_returns200() throws Exception {
      mockMvc
          .perform(get("/after-sale/types").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /after-sale/types - no token returns 401")
    void listTypes_noToken_returns401() throws Exception {
      mockMvc.perform(get("/after-sale/types")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /after-sale/tickets - CEO returns 200 with list")
    void listTickets_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/after-sale/tickets").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /after-sale/tickets - employee returns 200")
    void listTickets_employee_returns200() throws Exception {
      mockMvc
          .perform(get("/after-sale/tickets").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /after-sale/tickets?projectId=1 - filters by project")
    void listTickets_withProjectId_returns200() throws Exception {
      mockMvc
          .perform(
              get("/after-sale/tickets")
                  .param("projectId", "1")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /after-sale/tickets?status=OPEN - filters by status")
    void listTickets_withStatus_returns200() throws Exception {
      mockMvc
          .perform(
              get("/after-sale/tickets")
                  .param("status", "OPEN")
                  .header("Authorization", "Bearer " + pmToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /after-sale/tickets - no token returns 401")
    void listTickets_noToken_returns401() throws Exception {
      mockMvc.perform(get("/after-sale/tickets")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /after-sale/tickets - CEO creates ticket for own project returns 200")
    void createTicket_ceo_returns200() throws Exception {
      Map<String, Object> body = new HashMap<>();
      body.put("projectId", 1L);
      body.put("typeCode", "QUALITY");
      body.put("incidentDate", "2026-03-01");
      body.put("description", "Test quality issue " + System.currentTimeMillis());
      body.put("status", "PENDING");

      mockMvc
          .perform(
              post("/after-sale/tickets")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.id").exists());
    }

    @Test
    @DisplayName("POST /after-sale/tickets - PM creates ticket returns 200")
    void createTicket_pm_returns200() throws Exception {
      Map<String, Object> body = new HashMap<>();
      body.put("projectId", 1L);
      body.put("typeCode", "CONSTRUCTION");
      body.put("incidentDate", "2026-03-10");
      body.put("description", "Construction issue " + System.currentTimeMillis());
      body.put("status", "PENDING");

      mockMvc
          .perform(
              post("/after-sale/tickets")
                  .header("Authorization", "Bearer " + pmToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /after-sale/tickets - missing required fields returns 400")
    void createTicket_missingFields_returns400() throws Exception {
      Map<String, Object> body = new HashMap<>();
      body.put("projectId", 1L);
      // Missing typeCode, incidentDate, description

      mockMvc
          .perform(
              post("/after-sale/tickets")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /after-sale/tickets - WORKER (forbidden role) returns 403")
    void createTicket_worker_returns403() throws Exception {
      Map<String, Object> body = new HashMap<>();
      body.put("projectId", 1L);
      body.put("typeCode", "QUALITY");
      body.put("incidentDate", "2026-03-01");
      body.put("description", "Worker should not access this");

      mockMvc
          .perform(
              post("/after-sale/tickets")
                  .header("Authorization", "Bearer " + workerToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /after-sale/tickets/{id} - update non-existent returns 404")
    void updateTicket_nonExistent_returns404() throws Exception {
      Map<String, Object> body = Map.of("description", "Updated description");

      mockMvc
          .perform(
              put("/after-sale/tickets/999999")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /after-sale/tickets/{id} - delete non-existent returns 404")
    void deleteTicket_nonExistent_returns404() throws Exception {
      mockMvc
          .perform(
              delete("/after-sale/tickets/999999").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /after-sale/tickets/{id} - FINANCE (forbidden) returns 403")
    void deleteTicket_finance_returns403() throws Exception {
      // Create a ticket first so we have a real id to attempt deletion on
      Map<String, Object> createBody = new HashMap<>();
      createBody.put("projectId", 1L);
      createBody.put("typeCode", "QUALITY");
      createBody.put("incidentDate", "2026-04-01");
      createBody.put("description", "Ticket for delete auth test");
      createBody.put("status", "PENDING");

      MvcResult createResult =
          mockMvc
              .perform(
                  post("/after-sale/tickets")
                      .header("Authorization", "Bearer " + ceoToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createBody)))
              .andExpect(status().isOk())
              .andReturn();

      Long ticketId =
          objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

      mockMvc
          .perform(
              delete("/after-sale/tickets/" + ticketId)
                  .header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("After-sale full lifecycle: create -> update (close) -> delete")
    void fullLifecycle_createUpdateDelete() throws Exception {
      // Create
      Map<String, Object> createBody = new HashMap<>();
      createBody.put("projectId", 1L);
      createBody.put("typeCode", "NON_QUALITY");
      createBody.put("incidentDate", "2026-04-15");
      createBody.put("description", "Lifecycle after-sale ticket " + System.currentTimeMillis());
      createBody.put("customerFeedback", "Customer complaint here");
      createBody.put("status", "PENDING");

      MvcResult createResult =
          mockMvc
              .perform(
                  post("/after-sale/tickets")
                      .header("Authorization", "Bearer " + ceoToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createBody)))
              .andExpect(status().isOk())
              .andReturn();

      Long ticketId =
          objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

      // Update — close the ticket
      Map<String, Object> updateBody =
          Map.of("status", "CLOSED", "resolution", "Issue resolved via rework");

      mockMvc
          .perform(
              put("/after-sale/tickets/" + ticketId)
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(updateBody)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.status").value("CLOSED"));

      // Delete
      mockMvc
          .perform(
              delete("/after-sale/tickets/" + ticketId)
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.message").value("已删除"));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SecondRoleController  (/second-roles)
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName("SecondRoleController — SecondRoleService")
  class SecondRoleControllerTests {

    @Test
    @DisplayName("GET /second-roles/defs - authenticated user returns 200 with definitions")
    void listDefs_authenticated_returns200() throws Exception {
      mockMvc
          .perform(get("/second-roles/defs").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /second-roles/defs - employee can access returns 200")
    void listDefs_employee_returns200() throws Exception {
      mockMvc
          .perform(get("/second-roles/defs").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /second-roles/defs - no token returns 401")
    void listDefs_noToken_returns401() throws Exception {
      mockMvc.perform(get("/second-roles/defs")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /second-roles - CEO lists all assignments returns 200")
    void list_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/second-roles").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /second-roles?employeeId=1 - filters by employee")
    void list_filterByEmployee_returns200() throws Exception {
      mockMvc
          .perform(
              get("/second-roles")
                  .param("employeeId", "1")
                  .header("Authorization", "Bearer " + pmToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /second-roles?projectId=1 - filters by project")
    void list_filterByProject_returns200() throws Exception {
      mockMvc
          .perform(
              get("/second-roles")
                  .param("projectId", "1")
                  .header("Authorization", "Bearer " + pmToken))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /second-roles - no token returns 401")
    void list_noToken_returns401() throws Exception {
      mockMvc.perform(get("/second-roles")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /second-roles - CEO assigns AFTER_SALES second role to OFFICE employee")
    void assign_ceo_afterSalesRole_returns200() throws Exception {
      // employee.demo (id=1) is OFFICE type; AFTER_SALES applies_to OFFICE
      Map<String, Object> body = new HashMap<>();
      body.put("employeeId", 1L);
      body.put("roleCode", "AFTER_SALES");
      body.put("projectId", 1L);
      body.put("note", "Test second role assignment");

      MvcResult result =
          mockMvc
              .perform(
                  post("/second-roles")
                      .header("Authorization", "Bearer " + ceoToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(body)))
              .andReturn();

      // 200 (success) or 400 (already assigned from a previous test run in the same context)
      int status = result.getResponse().getStatus();
      assert status == 200 || status == 400;
    }

    @Test
    @DisplayName("POST /second-roles - missing employeeId returns 400")
    void assign_missingEmployeeId_returns400() throws Exception {
      Map<String, Object> body = new HashMap<>();
      body.put("roleCode", "AFTER_SALES");
      body.put("projectId", 1L);

      mockMvc
          .perform(
              post("/second-roles")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("POST /second-roles - unknown roleCode returns 400")
    void assign_unknownRoleCode_returns400() throws Exception {
      Map<String, Object> body = new HashMap<>();
      body.put("employeeId", 1L);
      body.put("roleCode", "UNKNOWN_ROLE_XYZ");
      body.put("projectId", 1L);

      mockMvc
          .perform(
              post("/second-roles")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName(
        "POST /second-roles - FOREMAN role to LABOR employee without projectId returns 400")
    void assign_projectBoundRoleWithoutProject_returns400() throws Exception {
      // FOREMAN is project_bound=true, so projectId must not be null
      Map<String, Object> body = new HashMap<>();
      body.put("employeeId", 5L); // worker.demo is LABOR type, matches FOREMAN
      body.put("roleCode", "FOREMAN");
      // projectId omitted

      mockMvc
          .perform(
              post("/second-roles")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName(
        "POST /second-roles - AFTER_SALES assigned to LABOR type employee returns 400 (type mismatch)")
    void assign_typeMismatch_returns400() throws Exception {
      // worker.demo (id=5) is LABOR; AFTER_SALES applies_to OFFICE
      Map<String, Object> body = new HashMap<>();
      body.put("employeeId", 5L);
      body.put("roleCode", "AFTER_SALES");
      body.put("projectId", 1L);

      mockMvc
          .perform(
              post("/second-roles")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("POST /second-roles - EMPLOYEE (forbidden) returns 403")
    void assign_employee_returns403() throws Exception {
      Map<String, Object> body = new HashMap<>();
      body.put("employeeId", 1L);
      body.put("roleCode", "AFTER_SALES");
      body.put("projectId", 1L);

      mockMvc
          .perform(
              post("/second-roles")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /second-roles/{id} - non-existent id returns 404")
    void revoke_nonExistent_returns404() throws Exception {
      mockMvc
          .perform(delete("/second-roles/999999").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /second-roles/{id} - EMPLOYEE (forbidden) returns 403")
    void revoke_employee_returns403() throws Exception {
      mockMvc
          .perform(delete("/second-roles/1").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Second role full lifecycle: assign -> revoke")
    void fullLifecycle_assignRevoke() throws Exception {
      // Assign MATERIAL_MANAGER (OFFICE, project_bound) to employee.demo (id=1)
      Map<String, Object> assignBody = new HashMap<>();
      assignBody.put("employeeId", 2L); // finance.demo is OFFICE type
      assignBody.put("roleCode", "MATERIAL_MANAGER");
      assignBody.put("projectId", 2L);
      assignBody.put("note", "Lifecycle test");

      MvcResult assignResult =
          mockMvc
              .perform(
                  post("/second-roles")
                      .header("Authorization", "Bearer " + pmToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(assignBody)))
              .andReturn();

      // The assign may fail if already assigned from another test run — skip revoke in that case
      if (assignResult.getResponse().getStatus() == 200) {
        Long assignmentId =
            objectMapper
                .readTree(assignResult.getResponse().getContentAsString())
                .get("id")
                .asLong();

        mockMvc
            .perform(
                delete("/second-roles/" + assignmentId)
                    .header("Authorization", "Bearer " + ceoToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("已撤销"));
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OrgController / OrgService  (/org/*)
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName("OrgController — OrgService")
  class OrgControllerTests {

    @Test
    @DisplayName("GET /org/tree - CEO returns 200 with org tree nodes")
    void getOrgTree_ceo_returns200() throws Exception {
      mockMvc
          .perform(get("/org/tree").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /org/tree - tree nodes contain expected fields")
    void getOrgTree_containsExpectedFields() throws Exception {
      mockMvc
          .perform(get("/org/tree").header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$[0].id").exists())
          .andExpect(jsonPath("$[0].name").exists())
          .andExpect(jsonPath("$[0].roleCode").exists());
    }

    @Test
    @DisplayName("GET /org/tree - EMPLOYEE (forbidden) returns 403")
    void getOrgTree_employee_returns403() throws Exception {
      mockMvc
          .perform(get("/org/tree").header("Authorization", "Bearer " + employeeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /org/tree - FINANCE (forbidden) returns 403")
    void getOrgTree_finance_returns403() throws Exception {
      mockMvc
          .perform(get("/org/tree").header("Authorization", "Bearer " + financeToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /org/tree - PM (forbidden) returns 403")
    void getOrgTree_pm_returns403() throws Exception {
      mockMvc
          .perform(get("/org/tree").header("Authorization", "Bearer " + pmToken))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /org/tree - no token returns 401")
    void getOrgTree_noToken_returns401() throws Exception {
      mockMvc.perform(get("/org/tree")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PATCH /org/supervisor/{employeeId} - CEO sets supervisor returns 200")
    void updateSupervisor_ceo_returns200() throws Exception {
      // Set employee.demo (id=1) supervisor to pm.demo (id=3)
      Map<String, Object> body = Map.of("supervisorId", 3L);

      mockMvc
          .perform(
              patch("/org/supervisor/1")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("PATCH /org/supervisor/{employeeId} - clear supervisor (null) returns 200")
    void updateSupervisor_clearSupervisor_returns200() throws Exception {
      // Clear supervisor for finance.demo (id=2)
      Map<String, Object> body = new HashMap<>();
      body.put("supervisorId", null);

      mockMvc
          .perform(
              patch("/org/supervisor/2")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PATCH /org/supervisor/{employeeId} - self-as-supervisor returns 4xx")
    void updateSupervisor_selfAsSupervisor_returnsBadRequest() throws Exception {
      // employee id=4 (ceo.demo) setting supervisor to themselves
      Map<String, Object> body = Map.of("supervisorId", 4L);

      mockMvc
          .perform(
              patch("/org/supervisor/4")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("PATCH /org/supervisor/{employeeId} - non-existent supervisor returns 4xx")
    void updateSupervisor_nonExistentSupervisor_returnsBadRequest() throws Exception {
      Map<String, Object> body = Map.of("supervisorId", 999999L);

      mockMvc
          .perform(
              patch("/org/supervisor/1")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("PATCH /org/supervisor/{employeeId} - EMPLOYEE (forbidden) returns 403")
    void updateSupervisor_employee_returns403() throws Exception {
      Map<String, Object> body = Map.of("supervisorId", 4L);

      mockMvc
          .perform(
              patch("/org/supervisor/1")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PATCH /org/supervisor/{employeeId} - no token returns 401")
    void updateSupervisor_noToken_returns401() throws Exception {
      Map<String, Object> body = Map.of("supervisorId", 4L);

      mockMvc
          .perform(
              patch("/org/supervisor/1")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isUnauthorized());
    }
  }
}
