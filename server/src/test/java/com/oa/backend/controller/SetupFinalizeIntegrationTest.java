package com.oa.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.service.SetupService;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * /setup/finalize 端点集成测试（DEF-SETUP-04 C2 + D-M08 双写 permissions）。
 *
 * <p>覆盖场景：
 *
 * <ol>
 *   <li>finalize_success — init 取得 wizardFinalizeToken → finalize 成功 → status 显示 finalize 完成
 *   <li>finalize_invalid_token — init 后用错误 token → 401
 *   <li>finalize_partial_failure_rolls_back — roles[1].code=null 触发 4xx 且 roles[0] 在 DB 中回滚（含
 *       permissions 字段）
 *   <li>finalize_already_completed — finalize 成功后再次提交 → 409
 *   <li>finalize_role_with_permissions — D-M08：finalize 成功后 GET /roles 可见角色 + 权限列表（验证内存注入）
 * </ol>
 *
 * <p>测试隔离：直接通过 JdbcTemplate 重置 system_config + 删除 wizard 创建的种子账号 (CEO001/HR001/SYS_ADMIN001/GM001)。
 * 不依赖 @Profile("dev") 的 DevController，因测试默认无 dev profile 激活。
 *
 * <p>@AfterAll 恢复 initialized=true，避免污染后续测试用例。
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("DEF-SETUP-04 C2: /setup/finalize integration")
class SetupFinalizeIntegrationTest {

  private static final ObjectMapper MAPPER = new ObjectMapper();

  // CEO 初始密码：8 位以上含字母与数字（满足 ^(?=.*[A-Za-z])(?=.*\d)[^\s]{8,64}$）
  // 手机号选 13900000000 段以避开 R__test_accounts.sql 种子账号 (138000000xx) 的 phone UNIQUE 冲突。
  private static final String INIT_BODY =
      "{"
          + "\"ceoName\":\"测试 CEO\","
          + "\"ceoPhone\":\"13900000001\","
          + "\"ceoPassword\":\"testpass1\","
          + "\"hrName\":\"测试 HR\","
          + "\"hrPhone\":\"13900000002\""
          + "}";

  @Autowired private MockMvc mockMvc;
  @Autowired private JdbcTemplate jdbcTemplate;
  @Autowired private SetupService setupService;

  /** 每个 @Test 前重置 setup + finalize 状态 + 清理 wizard 种子账号；确保 /setup/init 可被再次调用。 */
  @BeforeEach
  void resetSetupState() {
    cleanupWizardArtifacts();
    // 让系统回到"未初始化"，使 /setup/init 可调用
    jdbcTemplate.update(
        "UPDATE system_config SET config_value = 'false' WHERE config_key = ?", "initialized");
    jdbcTemplate.update(
        "UPDATE system_config SET config_value = 'false' WHERE config_key = ?",
        "wizard_finalize_completed");
    jdbcTemplate.update(
        "UPDATE system_config SET config_value = NULL WHERE config_key = ?",
        "wizard_finalize_token");
  }

  /** 全部测试结束后恢复 initialized=true，让后续 mvn test 用例不受影响。 */
  @AfterAll
  void restoreInitializedFlag() {
    cleanupWizardArtifacts();
    setupService.markInitializedForDev();
    // 同时清掉 finalize 相关键，避免遗留状态影响 /setup/status 后续断言
    jdbcTemplate.update(
        "UPDATE system_config SET config_value = 'false' WHERE config_key = ?",
        "wizard_finalize_completed");
    jdbcTemplate.update(
        "UPDATE system_config SET config_value = NULL WHERE config_key = ?",
        "wizard_finalize_token");
  }

  private void cleanupWizardArtifacts() {
    // 删除 wizard 阶段创建的账号（区别于种子的 *.demo 账号 id 1-8）
    jdbcTemplate.update(
        "DELETE FROM employee WHERE employee_no IN ('CEO001','HR001','SYS_ADMIN001','GM001')");
    // 删除 wizard step 5 写入的非系统角色（is_system=0）
    jdbcTemplate.update("DELETE FROM sys_role WHERE is_system = 0");
    // 清理 wizard step 10 写入的保留期数据 — 顺序关键：先 reminder 后 policy（FK 依赖）
    jdbcTemplate.update("DELETE FROM retention_reminder");
    jdbcTemplate.update("DELETE FROM retention_policy");
  }

  // ─── Test 1: finalize_success ───────────────────────────────────────────

  @Test
  @DisplayName("init → finalize 成功 → status.wizardFinalizeCompleted=true")
  void finalize_success() throws Exception {
    // 1. /setup/init 获取明文 wizardFinalizeToken
    MvcResult initResult =
        mockMvc
            .perform(post("/setup/init").contentType(MediaType.APPLICATION_JSON).content(INIT_BODY))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.recoveryCode").isNotEmpty())
            .andExpect(jsonPath("$.wizardFinalizeToken").isNotEmpty())
            .andReturn();

    JsonNode initBody = MAPPER.readTree(initResult.getResponse().getContentAsString());
    String token = initBody.get("wizardFinalizeToken").asText();
    org.junit.jupiter.api.Assertions.assertNotNull(token, "token 必须返回");
    org.junit.jupiter.api.Assertions.assertFalse(token.isBlank(), "token 不能为空白");

    // 2. /setup/finalize 用全部步骤跳过的最小请求体（仅 token）
    String finalizeBody = "{\"wizardFinalizeToken\":\"" + token + "\"}";
    mockMvc
        .perform(
            post("/setup/finalize").contentType(MediaType.APPLICATION_JSON).content(finalizeBody))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("初始化向导完成"));

    // 3. /setup/status 显示 finalize 已完成
    mockMvc
        .perform(get("/setup/status"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.initialized").value(true))
        .andExpect(jsonPath("$.wizardFinalizeCompleted").value(true));
  }

  // ─── Test 2: finalize_invalid_token ─────────────────────────────────────

  @Test
  @DisplayName("init 成功 + finalize 用错误 token → 401")
  void finalize_invalid_token() throws Exception {
    // init 必须先成功（否则 wizard_finalize_token 未设置，返回 400 而非 401）
    mockMvc
        .perform(post("/setup/init").contentType(MediaType.APPLICATION_JSON).content(INIT_BODY))
        .andExpect(status().isOk());

    String wrongTokenBody = "{\"wizardFinalizeToken\":\"definitely-not-the-correct-token-xyz\"}";
    mockMvc
        .perform(
            post("/setup/finalize").contentType(MediaType.APPLICATION_JSON).content(wrongTokenBody))
        .andExpect(status().isUnauthorized());

    // 进一步确认：finalize 仍未完成
    mockMvc
        .perform(get("/setup/status"))
        .andExpect(jsonPath("$.wizardFinalizeCompleted").value(false));
  }

  // ─── Test 3: finalize_partial_failure_rolls_back ───────────────────────

  @Test
  @DisplayName("finalize roles[1].code=null → 400 + 整体事务回滚（roles[0] 不应入库）")
  void finalize_partial_failure_rolls_back() throws Exception {
    MvcResult initResult =
        mockMvc
            .perform(post("/setup/init").contentType(MediaType.APPLICATION_JSON).content(INIT_BODY))
            .andExpect(status().isOk())
            .andReturn();
    String token =
        MAPPER
            .readTree(initResult.getResponse().getContentAsString())
            .get("wizardFinalizeToken")
            .asText();

    // roles[0] 合法（rollback_test_role_a），含 permissions 字段（D-M08：双写覆盖）；
    // roles[1].code 为 null → applyRoles 抛 IllegalArgumentException → 整体事务回滚 DB 部分。
    String body =
        "{"
            + "\"wizardFinalizeToken\":\""
            + token
            + "\","
            + "\"roles\":["
            + "{\"code\":\"rollback_test_role_a\",\"name\":\"回滚测试 A\",\"description\":null,\"permissions\":[\"HR_VIEW\"]},"
            + "{\"code\":null,\"name\":\"回滚测试 B\",\"description\":null,\"permissions\":[]}"
            + "]"
            + "}";

    mockMvc
        .perform(post("/setup/finalize").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().is4xxClientError());

    // 1. 第一条 role 不应入库（@Transactional 整体回滚）
    Integer aCount =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sys_role WHERE role_code = ?",
            Integer.class,
            "rollback_test_role_a");
    org.junit.jupiter.api.Assertions.assertEquals(0, aCount, "roles[0] 必须随 roles[1] 校验失败一同回滚");

    // 2. wizard_finalize_completed 仍为 false
    String completed =
        jdbcTemplate.queryForObject(
            "SELECT config_value FROM system_config WHERE config_key = ?",
            String.class,
            "wizard_finalize_completed");
    org.junit.jupiter.api.Assertions.assertEquals(
        "false", completed, "失败时 wizard_finalize_completed 不应翻为 true");
  }

  // ─── Test 4: finalize_role_with_permissions (D-M08 双写) ──────────────

  @Test
  @DisplayName("D-M08: finalize 提交带 permissions 的角色 → GET /roles 可见角色 + 权限列表")
  void finalize_role_with_permissions() throws Exception {
    // 用动态后缀避免与同一 JVM 中其它测试遗留的内存角色冲突（AccessManagementService 不随事务回滚）
    String roleCode = "dm08_perm_role_" + System.currentTimeMillis();

    MvcResult initResult =
        mockMvc
            .perform(post("/setup/init").contentType(MediaType.APPLICATION_JSON).content(INIT_BODY))
            .andExpect(status().isOk())
            .andReturn();
    String token =
        MAPPER
            .readTree(initResult.getResponse().getContentAsString())
            .get("wizardFinalizeToken")
            .asText();

    // finalize 提交一个含 permissions 的角色；前端 RoleConfigPanel 字段名严格 "permissions"
    String body =
        "{"
            + "\"wizardFinalizeToken\":\""
            + token
            + "\","
            + "\"roles\":["
            + "{\"code\":\""
            + roleCode
            + "\",\"name\":\"D-M08 权限测试角色\",\"description\":\"双写验证\","
            + "\"permissions\":[\"HR_VIEW\",\"PROJECT_VIEW\"]}"
            + "]"
            + "}";

    mockMvc
        .perform(post("/setup/finalize").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("初始化向导完成"));

    // GET /roles 必须看到该角色（验证 AccessManagementService 内存写入成功）；
    // 用 ceo.demo 登录拿到 JWT；R__test_accounts.sql 在 init 后仍保留（init 不删 .demo 账号）。
    String ceoToken = loginAsCeoDemo();
    MvcResult rolesResult =
        mockMvc
            .perform(get("/roles").header("Authorization", "Bearer " + ceoToken))
            .andExpect(status().isOk())
            .andReturn();

    JsonNode rolesArray = MAPPER.readTree(rolesResult.getResponse().getContentAsString());
    org.junit.jupiter.api.Assertions.assertTrue(rolesArray.isArray(), "/roles 必须返回数组");

    JsonNode targetRole = null;
    for (JsonNode r : rolesArray) {
      if (roleCode.equals(r.path("roleCode").asText())) {
        targetRole = r;
        break;
      }
    }
    org.junit.jupiter.api.Assertions.assertNotNull(
        targetRole, "新建角色 " + roleCode + " 必须出现在 GET /roles（内存注入失败）");

    JsonNode permissions = targetRole.path("permissions");
    org.junit.jupiter.api.Assertions.assertTrue(permissions.isArray(), "permissions 必须是数组");
    java.util.Set<String> permCodes = new java.util.HashSet<>();
    for (JsonNode p : permissions) {
      permCodes.add(p.asText());
    }
    org.junit.jupiter.api.Assertions.assertTrue(
        permCodes.contains("HR_VIEW"), "permissions 必须含 HR_VIEW");
    org.junit.jupiter.api.Assertions.assertTrue(
        permCodes.contains("PROJECT_VIEW"), "permissions 必须含 PROJECT_VIEW");
  }

  /** 用 ceo.demo 登录获取 JWT；与 CoverageBoostTest14.login 同款逻辑，但只服务于本测试类。 */
  private String loginAsCeoDemo() throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"ceo.demo\",\"password\":\"123456\"}"))
            .andExpect(status().isOk())
            .andReturn();
    String responseBody = result.getResponse().getContentAsString();
    JsonNode tokenNode = MAPPER.readTree(responseBody).path("token");
    org.junit.jupiter.api.Assertions.assertFalse(
        tokenNode.isMissingNode() || tokenNode.asText().isBlank(), "ceo.demo 登录必须返回 token");
    return tokenNode.asText();
  }

  // ─── Test 5: finalize_already_completed ────────────────────────────────

  @Test
  @DisplayName("finalize 成功后再次提交 → 409")
  void finalize_already_completed() throws Exception {
    MvcResult initResult =
        mockMvc
            .perform(post("/setup/init").contentType(MediaType.APPLICATION_JSON).content(INIT_BODY))
            .andExpect(status().isOk())
            .andReturn();
    String token =
        MAPPER
            .readTree(initResult.getResponse().getContentAsString())
            .get("wizardFinalizeToken")
            .asText();

    String finalizeBody = "{\"wizardFinalizeToken\":\"" + token + "\"}";

    // 第一次 finalize 成功
    mockMvc
        .perform(
            post("/setup/finalize").contentType(MediaType.APPLICATION_JSON).content(finalizeBody))
        .andExpect(status().isOk());

    // 第二次提交（finalize_completed=true 应优先于 token 比对，返回 409）
    mockMvc
        .perform(
            post("/setup/finalize").contentType(MediaType.APPLICATION_JSON).content(finalizeBody))
        .andExpect(status().isConflict());
  }
}
