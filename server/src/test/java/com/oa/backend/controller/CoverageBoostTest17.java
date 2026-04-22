package com.oa.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.entity.RetentionReminder;
import com.oa.backend.mapper.RetentionReminderMapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Coverage boost integration test 17.
 *
 * <p>Targets previously uncovered branches in:
 *
 * <ul>
 *   <li>SignatureService.confirmPayrollSlip() — wrong PIN (400), slip not found (403), wrong state
 *       (400), success (200 + evidenceId)
 *   <li>PayrollBonusService.syncFromApprovalForms() — exercised via PayrollEngine.settle(); covers
 *       both the no-op (0 PENDING bonuses) and the sync-happened (synced > 0) log branches
 *   <li>RetentionService.dismissReminder() — already-IGNORED branch (double dismiss → 400) and
 *       pre-seeded IGNORED status branch
 * </ul>
 *
 * <p>Test DB: PostgreSQL (oa_test), seeded by Flyway migrations + R__test_accounts.sql. Auth: POST
 * /auth/login (password 123456). All test accounts: ceo.demo, finance.demo, employee.demo.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@DisplayName(
    "Coverage Boost 17 — confirmPayrollSlip / syncFromApprovalForms / dismissReminder branches")
class CoverageBoostTest17 {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

  /** Direct mapper injection for inserting RetentionReminder rows in dismiss tests. */
  @Autowired private RetentionReminderMapper reminderMapper;

  @Autowired private JdbcTemplate jdbcTemplate;

  private String ceoToken;
  private String financeToken;
  private String employeeToken;

  @BeforeEach
  void setupEach() throws Exception {
    // 清理本 class 使用的固定 period，保证测试幂等
    deletePayrollCyclesByPeriod("2018-01", "2018-02", "2018-03", "2018-04", "2018-05");
    ceoToken = login("ceo.demo");
    financeToken = login("finance.demo");
    employeeToken = login("employee.demo");
  }

  // ── auth helper ───────────────────────────────────────────────────────────

  /**
   * Obtains a JWT from the real /auth/login endpoint.
   *
   * @param username employee_no (password fixed at "123456")
   * @return raw JWT string
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

  // ── cleanup helpers ───────────────────────────────────────────────────────

  /**
   * Deletes all payroll data for the given periods in dependency order: payroll_slip_item /
   * payroll_confirmation / evidence_chain → payroll_slip → payroll_adjustment / payroll_bonus →
   * payroll_cycle.
   */
  private void deletePayrollCyclesByPeriod(String... periods) {
    String cycleIds =
        "SELECT id FROM payroll_cycle WHERE period IN ("
            + "?,".repeat(periods.length).replaceAll(",$", "")
            + ")";
    String slipIds = "SELECT id FROM payroll_slip WHERE cycle_id IN (" + cycleIds + ")";
    jdbcTemplate.update(
        "DELETE FROM payroll_slip_item WHERE slip_id IN (" + slipIds + ")", (Object[]) periods);
    jdbcTemplate.update(
        "DELETE FROM payroll_confirmation WHERE slip_id IN (" + slipIds + ")", (Object[]) periods);
    jdbcTemplate.update(
        "DELETE FROM evidence_chain WHERE slip_id IN (" + slipIds + ")", (Object[]) periods);
    jdbcTemplate.update(
        "DELETE FROM payroll_slip WHERE cycle_id IN (" + cycleIds + ")", (Object[]) periods);
    jdbcTemplate.update(
        "DELETE FROM payroll_adjustment WHERE cycle_id IN (" + cycleIds + ")", (Object[]) periods);
    jdbcTemplate.update(
        "DELETE FROM payroll_bonus WHERE cycle_id IN (" + cycleIds + ")", (Object[]) periods);
    jdbcTemplate.update(
        "DELETE FROM payroll_cycle WHERE period IN ("
            + "?,".repeat(periods.length).replaceAll(",$", "")
            + ")",
        (Object[]) periods);
  }

  // ── payroll helpers ───────────────────────────────────────────────────────

  /**
   * Creates a payroll cycle with the given period string and immediately settles it. Settle is
   * allowed from OPEN status (the initial status after createCycle). Returns the settled cycle
   * JSON.
   *
   * @param period e.g. "2018-01"; must not already exist in the DB
   */
  private JsonNode createAndSettleCycle(String period) throws Exception {
    // 1. Create cycle
    Map<String, String> createBody = Map.of("period", period);
    MvcResult createResult =
        mockMvc
            .perform(
                post("/payroll/cycles")
                    .header("Authorization", "Bearer " + financeToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createBody)))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode cycleNode = objectMapper.readTree(createResult.getResponse().getContentAsString());
    long cycleId = cycleNode.get("id").asLong();

    // 2. Settle directly (OPEN is an accepted pre-settle status)
    MvcResult settleResult =
        mockMvc
            .perform(
                post("/payroll/cycles/" + cycleId + "/settle")
                    .header("Authorization", "Bearer " + financeToken))
            .andExpect(status().isOk())
            .andReturn();
    return objectMapper.readTree(settleResult.getResponse().getContentAsString());
  }

  /**
   * Finds the cycleId from a settled cycle JSON node and returns the first PayrollSlip ID belonging
   * to the employee.demo account. Returns -1 if none found.
   */
  private long findEmployeeSlipId(long cycleId) throws Exception {
    MvcResult result =
        mockMvc
            .perform(get("/payroll/slips").header("Authorization", "Bearer " + employeeToken))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode slips = objectMapper.readTree(result.getResponse().getContentAsString());
    if (slips.isArray()) {
      for (JsonNode slip : slips) {
        if (slip.has("cycleId") && slip.get("cycleId").asLong() == cycleId) {
          return slip.get("id").asLong();
        }
      }
    }
    return -1L;
  }

  /**
   * Binds an electronic signature for employee.demo using a minimal valid PNG image and the given
   * PIN. Asserts 200 OK.
   *
   * @param pin 4-6 digit PIN string
   */
  private void bindSignatureForEmployee(String pin) throws Exception {
    // 1x1 transparent PNG encoded in base64 (valid PNG magic bytes; AES accepts any non-blank)
    String pngBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    Map<String, String> bindBody =
        Map.of(
            "signatureImage", "data:image/png;base64," + pngBase64, "pin", pin, "confirmPin", pin);
    mockMvc
        .perform(
            post("/signature/bind")
                .header("Authorization", "Bearer " + employeeToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(bindBody)))
        .andExpect(status().isOk());
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SignatureService.confirmPayrollSlip() branches
  //
  // Endpoint: POST /payroll/slips/{id}/confirm  (EMPLOYEE, WORKER)
  //
  // Controller flow:
  //   1. getOwnSlip(id, auth) — if null → 403 (before service call)
  //   2. isBound(employeeId) — if not → 400
  //   3. signatureService.confirmPayrollSlip(employeeId, id, pin)
  //      a. verifyPin fails → IllegalArgumentException → GlobalExceptionHandler → 400
  //      b. slip not PUBLISHED → IllegalStateException → controller catches →
  // BusinessException(400) → 400
  //      c. success → 200 with evidenceId
  //
  // Note: "slip not found" and "unauthorized employee" are controller-level (getOwnSlip), not
  // service-level, so they surface as 403 before reaching confirmPayrollSlip().
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName("SignatureService.confirmPayrollSlip() — all branches")
  @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
  class ConfirmPayrollSlipBranches {

    /** Unique periods per test, using distant past years to avoid collision with other tests. */
    private static final String PERIOD_WRONG_PIN = "2018-01";

    private static final String PERIOD_WRONG_STATE = "2018-02";
    private static final String PERIOD_SUCCESS = "2018-03";
    private static final String KNOWN_PIN = "1234";
    private static final String WRONG_PIN = "9999";

    @Test
    @Order(1)
    @DisplayName("Slip not found — controller getOwnSlip returns null — 403 before service")
    void confirmSlip_slipNotFound_returns403() throws Exception {
      // Slip 999777 does not exist; getOwnSlip returns null → 403
      Map<String, String> body = Map.of("pin", KNOWN_PIN);
      mockMvc
          .perform(
              post("/payroll/slips/999777/confirm")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isForbidden());
    }

    @Test
    @Order(2)
    @DisplayName(
        "Wrong PIN — verifyPin returns false — IllegalArgumentException — GlobalExceptionHandler → 400")
    void confirmSlip_wrongPin_returns400() throws Exception {
      // Setup: create settled cycle + bind signature with KNOWN_PIN
      JsonNode cycle = createAndSettleCycle(PERIOD_WRONG_PIN);
      long cycleId = cycle.get("id").asLong();
      long slipId = findEmployeeSlipId(cycleId);
      org.junit.jupiter.api.Assertions.assertTrue(
          slipId > 0, "employee.demo must have a PUBLISHED slip in cycle " + PERIOD_WRONG_PIN);

      bindSignatureForEmployee(KNOWN_PIN);

      // Send wrong PIN — SignatureService.verifyPin returns false → throws IAE → 400
      Map<String, String> body = Map.of("pin", WRONG_PIN);
      mockMvc
          .perform(
              post("/payroll/slips/" + slipId + "/confirm")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(body)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @Order(3)
    @DisplayName(
        "Wrong state — slip already CONFIRMED — IllegalStateException — controller wraps → 400")
    void confirmSlip_wrongState_alreadyConfirmed_returns400() throws Exception {
      // Setup: new settled cycle for this test
      JsonNode cycle = createAndSettleCycle(PERIOD_WRONG_STATE);
      long cycleId = cycle.get("id").asLong();
      long slipId = findEmployeeSlipId(cycleId);
      org.junit.jupiter.api.Assertions.assertTrue(
          slipId > 0, "employee.demo must have a PUBLISHED slip in cycle " + PERIOD_WRONG_STATE);

      // Ensure signature is bound with KNOWN_PIN (bind is idempotent — re-binding updates record)
      bindSignatureForEmployee(KNOWN_PIN);

      Map<String, String> confirmBody = Map.of("pin", KNOWN_PIN);

      // First confirm: PUBLISHED → CONFIRMED, should succeed
      mockMvc
          .perform(
              post("/payroll/slips/" + slipId + "/confirm")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(confirmBody)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.message").value("已确认"));

      // Second confirm on same slip: status == CONFIRMED, not PUBLISHED
      // Service throws IllegalStateException("工资条状态为 [CONFIRMED], 仅 PUBLISHED 状态可确认")
      // Controller catches IllegalStateException → BusinessException(400) → 400
      mockMvc
          .perform(
              post("/payroll/slips/" + slipId + "/confirm")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(confirmBody)))
          .andExpect(status().isBadRequest());
    }

    @Test
    @Order(4)
    @DisplayName("Success — valid PIN + PUBLISHED slip + correct employee — 200 OK with evidenceId")
    void confirmSlip_success_returns200WithEvidenceId() throws Exception {
      // Settle a fresh cycle exclusively for this success test
      JsonNode cycle = createAndSettleCycle(PERIOD_SUCCESS);
      long cycleId = cycle.get("id").asLong();
      long slipId = findEmployeeSlipId(cycleId);
      org.junit.jupiter.api.Assertions.assertTrue(
          slipId > 0, "employee.demo must have a PUBLISHED slip in cycle " + PERIOD_SUCCESS);

      // Bind (or re-bind) with KNOWN_PIN
      bindSignatureForEmployee(KNOWN_PIN);

      Map<String, String> confirmBody = Map.of("pin", KNOWN_PIN);
      mockMvc
          .perform(
              post("/payroll/slips/" + slipId + "/confirm")
                  .header("Authorization", "Bearer " + employeeToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(confirmBody)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.message").value("已确认"))
          .andExpect(jsonPath("$.slipId").value(slipId))
          .andExpect(jsonPath("$.evidenceId").isNumber());
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PayrollBonusService.syncFromApprovalForms()
  //
  // This method is called internally by PayrollEngine.settle() at:
  //   int synced = payrollBonusService.syncFromApprovalForms(cycleId);
  //   if (synced > 0) { log.info("临时补贴审批状态已同步 ..."); }
  //
  // Two branches:
  //   1. No PENDING bonuses → synced == 0 → the "if (synced > 0)" body is skipped
  //   2. Has PENDING bonus with APPROVED FormRecord → synced > 0 → log line executed
  //
  // Both are exercised by calling POST /payroll/cycles/{id}/settle.
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName("PayrollBonusService.syncFromApprovalForms() — exercised via PayrollEngine.settle()")
  class SyncFromApprovalFormsBranches {

    @Test
    @DisplayName("No PENDING bonuses — synced == 0 branch — settle still succeeds with 200")
    void syncFromApprovalForms_noPendingBonuses_settleSucceeds() throws Exception {
      // settle() always calls syncFromApprovalForms(cycleId). With no bonus rows the method
      // iterates an empty list and returns 0 — the "synced == 0 / no-op" branch.
      JsonNode settled = createAndSettleCycle("2018-04");
      org.junit.jupiter.api.Assertions.assertEquals(
          "SETTLED", settled.get("status").asText(), "Cycle must reach SETTLED after settle()");
    }

    @Test
    @DisplayName("PENDING bonus with APPROVED FormRecord — synced > 0 branch — settle syncs status")
    void syncFromApprovalForms_withApprovedForm_syncHappensDuringSettle() throws Exception {
      // Step 1: Enable approval requirement so a bonus submission creates a PENDING bonus with
      // a FormRecord
      Map<String, Boolean> enableApproval = Map.of("approvalRequired", true);
      mockMvc
          .perform(
              put("/payroll/bonus-approval-config")
                  .header("Authorization", "Bearer " + ceoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(enableApproval)))
          .andExpect(status().isOk());

      try {
        // Step 2: Create a cycle in OPEN state (ready for settlement)
        Map<String, String> createCycleBody = Map.of("period", "2018-05");
        MvcResult createResult =
            mockMvc
                .perform(
                    post("/payroll/cycles")
                        .header("Authorization", "Bearer " + financeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createCycleBody)))
                .andExpect(status().isOk())
                .andReturn();
        long cycleId =
            objectMapper
                .readTree(createResult.getResponse().getContentAsString())
                .get("id")
                .asLong();

        // Step 3: employee.demo has a fixed numeric ID of 1 per seed data.sql (MERGE INTO employee
        // KEY(id) with id=1 for employee.demo). This is stable across all test runs.
        long empId = 1L;

        // Step 4: Create a PENDING bonus (approval required) → PayrollBonusService.create()
        // stores status=PENDING and creates a FormRecord via FormService.submitForm()
        Map<String, Object> bonusBody =
            Map.of("employeeId", empId, "name", "SyncTest Bonus", "amount", 100, "type", "EARNING");
        MvcResult bonusResult =
            mockMvc
                .perform(
                    post("/payroll/cycles/" + cycleId + "/bonuses")
                        .header("Authorization", "Bearer " + financeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bonusBody)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode bonusNode = objectMapper.readTree(bonusResult.getResponse().getContentAsString());
        org.junit.jupiter.api.Assertions.assertEquals(
            "PENDING",
            bonusNode.get("status").asText(),
            "Bonus must be PENDING when approvalRequired=true");
        long formId = bonusNode.get("formId").asLong();
        org.junit.jupiter.api.Assertions.assertTrue(
            formId > 0, "PENDING bonus must reference a FormRecord via formId");

        // Step 5: CEO approves the form → FormRecord.status becomes APPROVED
        Map<String, String> approveBody = Map.of("action", "APPROVE", "comment", "approved");
        mockMvc
            .perform(
                post("/forms/" + formId + "/approve")
                    .header("Authorization", "Bearer " + ceoToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(approveBody)))
            .andExpect(status().isOk());

        // Step 6: Settle the cycle → PayrollEngine.settle() calls syncFromApprovalForms(cycleId)
        // which finds the PENDING bonus with formId pointing to an APPROVED FormRecord,
        // sets bonus.status = APPROVED, and returns synced=1 → the "synced > 0" log branch is hit.
        MvcResult settleResult =
            mockMvc
                .perform(
                    post("/payroll/cycles/" + cycleId + "/settle")
                        .header("Authorization", "Bearer " + financeToken))
                .andExpect(status().isOk())
                .andReturn();
        org.junit.jupiter.api.Assertions.assertEquals(
            "SETTLED",
            objectMapper
                .readTree(settleResult.getResponse().getContentAsString())
                .get("status")
                .asText(),
            "Cycle must be SETTLED");

        // Step 7: Verify the bonus transitioned from PENDING to APPROVED during settle
        MvcResult bonusListResult =
            mockMvc
                .perform(
                    get("/payroll/cycles/" + cycleId + "/bonuses")
                        .header("Authorization", "Bearer " + financeToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode bonusList =
            objectMapper.readTree(bonusListResult.getResponse().getContentAsString());
        boolean foundApproved = false;
        if (bonusList.isArray()) {
          for (JsonNode b : bonusList) {
            if ("APPROVED".equals(b.get("status").asText())) {
              foundApproved = true;
              break;
            }
          }
        }
        org.junit.jupiter.api.Assertions.assertTrue(
            foundApproved,
            "After settle(), the PENDING bonus whose FormRecord is APPROVED must be synced to APPROVED");

      } finally {
        // Restore approval config so other tests are not affected
        Map<String, Boolean> disableApproval = Map.of("approvalRequired", false);
        mockMvc.perform(
            put("/payroll/bonus-approval-config")
                .header("Authorization", "Bearer " + ceoToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(disableApproval)));
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RetentionService.dismissReminder()
  //
  // Endpoint: POST /retention/reminders/{id}/dismiss  (CEO only)
  //
  // Controller: service.dismissReminder(id) returns boolean;
  //   true  → 200 {"message":"提醒已忽略","id":<id>}
  //   false → 400 {"message":"忽略失败，提醒不存在或状态不正确"}
  //
  // Service branches:
  //   1. reminder == null || deleted == 1 → return false
  //   2. status != PENDING → return false   ← THIS IS THE UNCOVERED BRANCH
  //   3. success: PENDING → IGNORED, return true
  //
  // Branch 2 is hit when status is already IGNORED (double-dismiss) or any non-PENDING state.
  // ─────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName(
      "RetentionService.dismissReminder() — already-IGNORED and pre-IGNORED status branches")
  class DismissReminderAlreadyIgnoredBranches {

    @Test
    @DisplayName("Dismiss same reminder twice — first 200, second 400 (status == IGNORED)")
    void dismissReminder_doubleDismiss_secondCallReturns400() throws Exception {
      // Insert a PENDING reminder directly; policyId=1 exists in seed data (PAYROLL_SLIP policy)
      RetentionReminder reminder = new RetentionReminder();
      reminder.setPolicyId(1L);
      reminder.setDataType("PAYROLL_SLIP");
      reminder.setExpectedDeleteDate(LocalDate.now().plusDays(10));
      reminder.setStatus("PENDING");
      reminder.setCreatedAt(LocalDateTime.now());
      reminder.setUpdatedAt(LocalDateTime.now());
      reminder.setDeleted(0);
      reminderMapper.insert(reminder);
      long reminderId = reminder.getId();

      // First dismiss: PENDING → IGNORED, service returns true → 200
      mockMvc
          .perform(
              post("/retention/reminders/" + reminderId + "/dismiss")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.message").value("提醒已忽略"))
          .andExpect(jsonPath("$.id").value(reminderId));

      // Second dismiss: status is now IGNORED (not PENDING)
      // Service branch: !STATUS_PENDING.equals("IGNORED") → return false → controller 400
      mockMvc
          .perform(
              post("/retention/reminders/" + reminderId + "/dismiss")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.message").value("忽略失败，提醒不存在或状态不正确"));
    }

    @Test
    @DisplayName("Dismiss reminder with pre-existing IGNORED status — service returns false — 400")
    void dismissReminder_preExistingIgnoredStatus_returns400() throws Exception {
      // Insert a reminder directly in IGNORED state — simulates an already-dismissed record
      RetentionReminder reminder = new RetentionReminder();
      reminder.setPolicyId(2L);
      reminder.setDataType("FORM_RECORD");
      reminder.setExpectedDeleteDate(LocalDate.now().plusDays(5));
      reminder.setStatus("IGNORED");
      reminder.setCreatedAt(LocalDateTime.now());
      reminder.setUpdatedAt(LocalDateTime.now());
      reminder.setDeleted(0);
      reminderMapper.insert(reminder);
      long reminderId = reminder.getId();

      // Service: !STATUS_PENDING.equals("IGNORED") → returns false → controller 400
      mockMvc
          .perform(
              post("/retention/reminders/" + reminderId + "/dismiss")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.message").value("忽略失败，提醒不存在或状态不正确"));
    }

    @Test
    @DisplayName("Dismiss non-existent reminder — service returns false — 400")
    void dismissReminder_notFound_returns400() throws Exception {
      // Reminder 777888 does not exist in the DB
      mockMvc
          .perform(
              post("/retention/reminders/777888/dismiss")
                  .header("Authorization", "Bearer " + ceoToken))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.message").value("忽略失败，提醒不存在或状态不正确"));
    }
  }
}
