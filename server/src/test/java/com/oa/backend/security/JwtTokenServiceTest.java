package com.oa.backend.security;

import static org.junit.jupiter.api.Assertions.*;

import com.auth0.jwt.interfaces.DecodedJWT;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** JwtTokenService 单元测试 覆盖：token 生成、解析、过期、签名篡改、角色规范化 */
@DisplayName("M1 - JwtTokenService")
class JwtTokenServiceTest {

  private JwtTokenService service;

  @BeforeEach
  void setUp() {
    // 直接构造，不依赖 Spring 上下文
    service = new JwtTokenService("test-secret-key-32-chars-minimum!!", 86400000L, "oa-backend");
  }

  @Test
  @DisplayName("generateToken(5参数) 生成的 token 可被正确解析，payload 字段一致")
  void generateAndVerify_fullParams_shouldMatchClaims() {
    String token = service.generateToken("emp.001", 42L, "finance", "OFFICE", "李静");

    Optional<DecodedJWT> result = service.verify(token);

    assertTrue(result.isPresent());
    DecodedJWT jwt = result.get();
    assertEquals("emp.001", jwt.getSubject());
    assertEquals(42L, jwt.getClaim("userId").asLong());
    assertEquals("finance", jwt.getClaim("role").asString());
    assertEquals("OFFICE", jwt.getClaim("employeeType").asString());
    assertEquals("李静", jwt.getClaim("displayName").asString());
  }

  @Test
  @DisplayName("generateToken(3参数) 兼容旧版签名，role/displayName 正确")
  void generateAndVerify_shortParams_shouldMatchClaims() {
    String token = service.generateToken("ceo.demo", "ceo", "陈明远");

    Optional<DecodedJWT> result = service.verify(token);

    assertTrue(result.isPresent());
    assertEquals("ceo.demo", result.get().getSubject());
    assertEquals("ceo", result.get().getClaim("role").asString());
    assertEquals("陈明远", result.get().getClaim("displayName").asString());
  }

  @Test
  @DisplayName("role 为 null 时，规范化为 'employee'")
  void generateToken_nullRole_defaultsToEmployee() {
    String token = service.generateToken("emp.001", null, null, null, "测试");
    Optional<DecodedJWT> result = service.verify(token);

    assertTrue(result.isPresent());
    assertEquals("employee", result.get().getClaim("role").asString());
  }

  @Test
  @DisplayName("role 为大写时，规范化为小写")
  void generateToken_uppercaseRole_isLowercased() {
    String token = service.generateToken("emp.001", null, "FINANCE", null, "测试");
    Optional<DecodedJWT> result = service.verify(token);

    assertTrue(result.isPresent());
    assertEquals("finance", result.get().getClaim("role").asString());
  }

  @Test
  @DisplayName("token 过期后 verify 返回 empty")
  void verify_expiredToken_returnsEmpty() throws InterruptedException {
    JwtTokenService shortExpiry =
        new JwtTokenService("test-secret-key-32-chars-minimum!!", 1L, "oa-backend");
    String token = shortExpiry.generateToken("emp.001", "employee", "测试");

    Thread.sleep(50); // 等待 token 过期

    Optional<DecodedJWT> result = shortExpiry.verify(token);
    assertTrue(result.isEmpty());
  }

  @Test
  @DisplayName("签名被篡改后 verify 返回 empty")
  void verify_tamperedSignature_returnsEmpty() {
    String token = service.generateToken("emp.001", "employee", "测试");
    // 替换最后几个字符篡改签名
    String tampered = token.substring(0, token.length() - 5) + "XXXXX";

    Optional<DecodedJWT> result = service.verify(tampered);
    assertTrue(result.isEmpty());
  }

  @Test
  @DisplayName("格式错误的字符串 verify 返回 empty")
  void verify_malformedToken_returnsEmpty() {
    Optional<DecodedJWT> result = service.verify("not.a.valid.jwt");
    assertTrue(result.isEmpty());
  }

  @Test
  @DisplayName("不同 issuer 签发的 token 验证失败")
  void verify_differentIssuer_returnsEmpty() {
    JwtTokenService otherIssuer =
        new JwtTokenService("test-secret-key-32-chars-minimum!!", 86400000L, "other-app");
    String token = otherIssuer.generateToken("emp.001", "employee", "测试");

    Optional<DecodedJWT> result = service.verify(token);
    assertTrue(result.isEmpty());
  }
}
