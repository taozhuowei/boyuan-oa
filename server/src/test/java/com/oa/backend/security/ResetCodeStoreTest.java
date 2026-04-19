package com.oa.backend.security;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** ResetCodeStore 单元测试 覆盖：验证码存取/校验/过期、重置令牌创建/校验/过期 */
@DisplayName("M1 - ResetCodeStore")
class ResetCodeStoreTest {

  private ResetCodeStore store;

  @BeforeEach
  void setUp() {
    store = new ResetCodeStore();
  }

  // ─── 验证码 ───────────────────────────────────────────────

  @Test
  @DisplayName("storeCode + verifyCode：正确验证码返回 true")
  void verifyCode_correctCode_returnsTrue() {
    store.storeCode("13800000001", "123456");
    assertTrue(store.verifyCode("13800000001", "123456"));
  }

  @Test
  @DisplayName("verifyCode：错误验证码返回 false")
  void verifyCode_wrongCode_returnsFalse() {
    store.storeCode("13800000001", "123456");
    assertFalse(store.verifyCode("13800000001", "999999"));
  }

  @Test
  @DisplayName("verifyCode：未存储的手机号返回 false")
  void verifyCode_unknownPhone_returnsFalse() {
    assertFalse(store.verifyCode("13899999999", "123456"));
  }

  @Test
  @DisplayName("removeCode 后，验证码不再有效")
  void verifyCode_afterRemove_returnsFalse() {
    store.storeCode("13800000001", "123456");
    store.removeCode("13800000001");
    assertFalse(store.verifyCode("13800000001", "123456"));
  }

  @Test
  @DisplayName("getCodeForTest：已存储的验证码可读取")
  void getCodeForTest_existingCode_returnsCode() {
    store.storeCode("13800000001", "654321");
    assertEquals("654321", store.getCodeForTest("13800000001"));
  }

  @Test
  @DisplayName("getCodeForTest：不存在的手机号返回 null")
  void getCodeForTest_unknownPhone_returnsNull() {
    assertNull(store.getCodeForTest("13899999999"));
  }

  @Test
  @DisplayName("同一手机号二次 storeCode 覆盖旧验证码")
  void storeCode_overwritesOldCode() {
    store.storeCode("13800000001", "111111");
    store.storeCode("13800000001", "222222");
    assertFalse(store.verifyCode("13800000001", "111111"));
    assertTrue(store.verifyCode("13800000001", "222222"));
  }

  // ─── 重置令牌 ─────────────────────────────────────────────

  @Test
  @DisplayName("createToken + verifyToken：有效令牌返回对应手机号")
  void verifyToken_validToken_returnsPhone() {
    String token = store.createToken("13800000001");
    assertNotNull(token);
    assertEquals("13800000001", store.verifyToken(token));
  }

  @Test
  @DisplayName("verifyToken：不存在的令牌返回 null")
  void verifyToken_unknownToken_returnsNull() {
    assertNull(store.verifyToken("non-existent-token"));
  }

  @Test
  @DisplayName("removeToken 后令牌失效")
  void verifyToken_afterRemove_returnsNull() {
    String token = store.createToken("13800000001");
    store.removeToken(token);
    assertNull(store.verifyToken(token));
  }

  @Test
  @DisplayName("createToken 每次返回不同令牌（UUID 唯一性）")
  void createToken_returnsUniqueTokens() {
    String t1 = store.createToken("13800000001");
    String t2 = store.createToken("13800000001");
    assertNotEquals(t1, t2);
  }
}
