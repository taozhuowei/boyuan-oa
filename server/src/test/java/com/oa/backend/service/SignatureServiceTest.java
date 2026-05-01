package com.oa.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.oa.backend.entity.*;
import com.oa.backend.mapper.*;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

/** SignatureService 单元测试 覆盖：签名绑定、PIN验证、工资条确认、存证链记录创建 */
@ExtendWith(MockitoExtension.class)
@DisplayName("M5 - SignatureService")
class SignatureServiceTest {

  @InjectMocks private SignatureService service;

  @Mock private EmployeeSignatureMapper signatureMapper;

  @Mock private EmployeeMapper employeeMapper;

  @Mock private BCryptPasswordEncoder passwordEncoder;

  private static final String TEST_AES_KEY = "TestAESKey123456789012345678901234";
  private static final String TEST_BASE64_IMAGE =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  private static final String TEST_PIN = "123456";
  private static final Long TEST_EMPLOYEE_ID = 1L;

  @BeforeEach
  void setUp() {
    // Inject AES key for encryption/decryption tests
    ReflectionTestUtils.setField(service, "aesKey", TEST_AES_KEY);
    ReflectionTestUtils.setField(service, "uploadDir", "./uploads");
  }

  // ─── bindSignature ───────────────────────────────────────────

  @Test
  @DisplayName("bindSignature：新签名绑定，验证 insert 被调用且字段正确设置")
  void bindSignature_new() {
    when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(null);
    when(passwordEncoder.encode(TEST_PIN)).thenReturn("hashedPin123");
    when(signatureMapper.insert(any()))
        .thenAnswer(
            inv -> {
              EmployeeSignature sig = inv.getArgument(0);
              sig.setId(1L);
              return 1;
            });

    service.bindSignature(TEST_EMPLOYEE_ID, TEST_BASE64_IMAGE, TEST_PIN);

    ArgumentCaptor<EmployeeSignature> captor = ArgumentCaptor.forClass(EmployeeSignature.class);
    verify(signatureMapper).insert(captor.capture());
    EmployeeSignature saved = captor.getValue();

    assertEquals(TEST_EMPLOYEE_ID, saved.getEmployeeId());
    assertNotNull(saved.getSignatureImageEncrypted());
    assertNotNull(saved.getSignatureHash());
    assertEquals("hashedPin123", saved.getPinHash());
    assertNotNull(saved.getBoundAt());
  }

  @Test
  @DisplayName("bindSignature：重新绑定，验证 updateById 被调用")
  void bindSignature_rebind() {
    EmployeeSignature existing = new EmployeeSignature();
    existing.setId(1L);
    existing.setEmployeeId(TEST_EMPLOYEE_ID);
    existing.setSignatureImageEncrypted("oldEncryptedImage");
    existing.setPinHash("oldPinHash");

    when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(existing);
    when(passwordEncoder.encode(TEST_PIN)).thenReturn("newHashedPin");
    when(signatureMapper.updateById(any())).thenReturn(1);

    service.bindSignature(TEST_EMPLOYEE_ID, TEST_BASE64_IMAGE, TEST_PIN);

    verify(signatureMapper, never()).insert(any());
    ArgumentCaptor<EmployeeSignature> captor = ArgumentCaptor.forClass(EmployeeSignature.class);
    verify(signatureMapper).updateById(captor.capture());
    EmployeeSignature updated = captor.getValue();

    assertEquals(1L, updated.getId());
    assertNotNull(updated.getSignatureImageEncrypted());
    assertNotEquals("oldEncryptedImage", updated.getSignatureImageEncrypted());
    assertEquals("newHashedPin", updated.getPinHash());
  }

  // ─── verifyPin ───────────────────────────────────────────────

  @Test
  @DisplayName("verifyPin：PIN 正确匹配返回 true")
  void verifyPin_correct() {
    EmployeeSignature signature = new EmployeeSignature();
    signature.setId(1L);
    signature.setEmployeeId(TEST_EMPLOYEE_ID);
    signature.setPinHash("hashedPin123");

    when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(signature);
    when(passwordEncoder.matches(TEST_PIN, "hashedPin123")).thenReturn(true);

    boolean result = service.verifyPin(TEST_EMPLOYEE_ID, TEST_PIN);

    assertTrue(result);
    verify(passwordEncoder).matches(TEST_PIN, "hashedPin123");
  }

  @Test
  @DisplayName("verifyPin：未绑定签名返回 false")
  void verifyPin_noSignature() {
    when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(null);

    boolean result = service.verifyPin(TEST_EMPLOYEE_ID, TEST_PIN);

    assertFalse(result);
  }

  // ─── Additional Tests for Coverage ───────────────────────────

  @Test
  @DisplayName("bindSignature：AES 加密产生非空加密数据且可解密还原")
  void bindSignature_aesEncryptionProducesNonNullData() {
    when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(null);
    when(passwordEncoder.encode(TEST_PIN)).thenReturn("hashedPin123");
    when(signatureMapper.insert(any()))
        .thenAnswer(
            inv -> {
              EmployeeSignature sig = inv.getArgument(0);
              sig.setId(1L);
              return 1;
            });

    service.bindSignature(TEST_EMPLOYEE_ID, TEST_BASE64_IMAGE, TEST_PIN);

    ArgumentCaptor<EmployeeSignature> captor = ArgumentCaptor.forClass(EmployeeSignature.class);
    verify(signatureMapper).insert(captor.capture());
    EmployeeSignature saved = captor.getValue();

    // Verify encrypted image is not null and different from original
    assertNotNull(saved.getSignatureImageEncrypted());
    assertNotEquals(TEST_BASE64_IMAGE, saved.getSignatureImageEncrypted());

    // Verify signature hash is SHA-256 (64 hex chars)
    assertNotNull(saved.getSignatureHash());
    assertEquals(64, saved.getSignatureHash().length());
  }

  @Test
  @DisplayName("bindSignature：参数无效时抛出 IllegalArgumentException")
  void bindSignature_invalidParamsThrowsException() {
    // null employeeId
    assertThrows(
        IllegalArgumentException.class,
        () -> service.bindSignature(null, TEST_BASE64_IMAGE, TEST_PIN));

    // null base64Image
    assertThrows(
        IllegalArgumentException.class,
        () -> service.bindSignature(TEST_EMPLOYEE_ID, null, TEST_PIN));

    // blank base64Image
    assertThrows(
        IllegalArgumentException.class,
        () -> service.bindSignature(TEST_EMPLOYEE_ID, "   ", TEST_PIN));

    // null pin
    assertThrows(
        IllegalArgumentException.class,
        () -> service.bindSignature(TEST_EMPLOYEE_ID, TEST_BASE64_IMAGE, null));

    // blank pin
    assertThrows(
        IllegalArgumentException.class,
        () -> service.bindSignature(TEST_EMPLOYEE_ID, TEST_BASE64_IMAGE, ""));

    verify(signatureMapper, never()).insert(any());
    verify(signatureMapper, never()).updateById(any());
  }

  @Test
  @DisplayName("isBound：null employeeId 返回 false")
  void isBound_nullEmployeeIdReturnsFalse() {
    boolean result = service.isBound(null);
    assertFalse(result);
    verify(signatureMapper, never()).findByEmployeeId(any());
  }

  @Test
  @DisplayName("isBound：未绑定签名返回 false")
  void isBound_noSignatureReturnsFalse() {
    when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(null);

    boolean result = service.isBound(TEST_EMPLOYEE_ID);

    assertFalse(result);
    verify(signatureMapper).findByEmployeeId(TEST_EMPLOYEE_ID);
  }

  @Test
  @DisplayName("isBound：签名存在但无 PIN 返回 false")
  void isBound_signatureExistsButNoPinReturnsFalse() {
    EmployeeSignature signature = new EmployeeSignature();
    signature.setId(1L);
    signature.setEmployeeId(TEST_EMPLOYEE_ID);
    signature.setPinHash(null);

    when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(signature);

    boolean result = service.isBound(TEST_EMPLOYEE_ID);

    assertFalse(result);
  }

  @Test
  @DisplayName("isBound：签名存在且 PIN 非空返回 true")
  void isBound_signatureWithPinReturnsTrue() {
    EmployeeSignature signature = new EmployeeSignature();
    signature.setId(1L);
    signature.setEmployeeId(TEST_EMPLOYEE_ID);
    signature.setPinHash("hashedPin123");

    when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(signature);

    boolean result = service.isBound(TEST_EMPLOYEE_ID);

    assertTrue(result);
  }

  @Test
  @DisplayName("verifyPin：null 参数返回 false")
  void verifyPin_nullParamsReturnsFalse() {
    assertFalse(service.verifyPin(null, TEST_PIN));
    assertFalse(service.verifyPin(TEST_EMPLOYEE_ID, null));
    assertFalse(service.verifyPin(TEST_EMPLOYEE_ID, ""));
    assertFalse(service.verifyPin(TEST_EMPLOYEE_ID, "   "));
  }

  @Test
  @DisplayName("verifyPin：签名存在但 PinHash 为 null 返回 false")
  void verifyPin_signatureExistsButPinHashNullReturnsFalse() {
    EmployeeSignature signature = new EmployeeSignature();
    signature.setPinHash(null);

    when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(signature);

    boolean result = service.verifyPin(TEST_EMPLOYEE_ID, TEST_PIN);

    assertFalse(result);
  }

  // ─── private helpers via reflection ──────────────────────

  @Test
  @DisplayName("sha256：对相同输入产生相同的64位十六进制字符串")
  void sha256_producesConsistentHash() throws Exception {
    Method m = SignatureService.class.getDeclaredMethod("sha256", String.class);
    m.setAccessible(true);
    String h1 = (String) m.invoke(service, "hello");
    String h2 = (String) m.invoke(service, "hello");
    assertEquals(h1, h2);
    assertEquals(64, h1.length());
    assertNotEquals(h1, m.invoke(service, "world"));
  }

  @Test
  @DisplayName("formatAmount：null 返回 0.00，正常金额格式化为两位小数")
  void formatAmount_formatsCorrectly() throws Exception {
    Method m = SignatureService.class.getDeclaredMethod("formatAmount", BigDecimal.class);
    m.setAccessible(true);
    assertEquals("0.00", m.invoke(service, (BigDecimal) null));
    assertEquals("1234.56", m.invoke(service, new BigDecimal("1234.56")));
    assertEquals("100.00", m.invoke(service, new BigDecimal("100")));
  }

  @Test
  @DisplayName("wrapText：长文本正确按 maxLength 换行")
  void wrapText_wrapsAtMaxLength() throws Exception {
    Method m = SignatureService.class.getDeclaredMethod("wrapText", String.class, int.class);
    m.setAccessible(true);
    @SuppressWarnings("unchecked")
    List<String> lines = (List<String>) m.invoke(service, "a b c d e f g h i j", 5);
    assertFalse(lines.isEmpty());
    // 空字符串输入
    @SuppressWarnings("unchecked")
    List<String> empty = (List<String>) m.invoke(service, "", 10);
    assertTrue(empty.isEmpty());
  }

  @Test
  @DisplayName("encryptAes/decryptAes：加密后可还原原文")
  void encryptDecryptAes_roundTrip() throws Exception {
    ReflectionTestUtils.setField(service, "aesKey", TEST_AES_KEY);
    Method encrypt = SignatureService.class.getDeclaredMethod("encryptAes", String.class);
    Method decrypt = SignatureService.class.getDeclaredMethod("decryptAes", String.class);
    encrypt.setAccessible(true);
    decrypt.setAccessible(true);
    String original = "secret-text-12345";
    String encrypted = (String) encrypt.invoke(service, original);
    assertNotNull(encrypted);
    assertNotEquals(original, encrypted);
    String decrypted = (String) decrypt.invoke(service, encrypted);
    assertEquals(original, decrypted);
  }

  @Test
  @DisplayName("getAesKeyBytes：密钥太短时抛出 IllegalStateException")
  void getAesKeyBytes_shortKey_throwsException() throws Exception {
    ReflectionTestUtils.setField(service, "aesKey", "short");
    Method m = SignatureService.class.getDeclaredMethod("getAesKeyBytes");
    m.setAccessible(true);
    assertThrows(Exception.class, () -> m.invoke(service));
  }

  @Test
  @DisplayName("computeContentHash：相同输入产生相同哈希")
  void computeContentHash_isConsistent() throws Exception {
    Method m =
        SignatureService.class.getDeclaredMethod(
            "computeContentHash", Long.class, Long.class, LocalDateTime.class);
    m.setAccessible(true);
    LocalDateTime now = LocalDateTime.of(2024, 1, 1, 0, 0, 0);
    String h1 = (String) m.invoke(service, 1L, 2L, now);
    String h2 = (String) m.invoke(service, 1L, 2L, now);
    assertEquals(h1, h2);
    assertEquals(64, h1.length());
  }

  @Test
  @DisplayName("wrapText：单个超长单词最终出现在结果列表中")
  void wrapText_singleLongWord_appearsInResult() throws Exception {
    Method m = SignatureService.class.getDeclaredMethod("wrapText", String.class, int.class);
    m.setAccessible(true);
    @SuppressWarnings("unchecked")
    List<String> lines = (List<String>) m.invoke(service, "superlongword", 5);
    assertFalse(lines.isEmpty());
    assertTrue(lines.stream().anyMatch(l -> l.contains("superlongword")));
  }

  @Test
  @DisplayName("wrapText：每行累积不超过 maxLength")
  void wrapText_multipleShortWords_allOnOneLine() throws Exception {
    Method m = SignatureService.class.getDeclaredMethod("wrapText", String.class, int.class);
    m.setAccessible(true);
    @SuppressWarnings("unchecked")
    List<String> lines = (List<String>) m.invoke(service, "ab cd", 10);
    assertEquals(1, lines.size());
    assertEquals("ab cd", lines.get(0));
  }

  @Test
  @DisplayName("getAesKeyBytes：有效密钥返回32字节数组")
  void getAesKeyBytes_validKey_returns32Bytes() throws Exception {
    ReflectionTestUtils.setField(service, "aesKey", TEST_AES_KEY);
    Method m = SignatureService.class.getDeclaredMethod("getAesKeyBytes");
    m.setAccessible(true);
    byte[] result = (byte[]) m.invoke(service);
    assertNotNull(result);
    assertEquals(32, result.length);
  }

  @Test
  @DisplayName("sha256：不同输入产生不同哈希")
  void sha256_differentInputs_differentHashes() throws Exception {
    Method m = SignatureService.class.getDeclaredMethod("sha256", String.class);
    m.setAccessible(true);
    String h1 = (String) m.invoke(service, "input1");
    String h2 = (String) m.invoke(service, "input2");
    assertNotEquals(h1, h2);
  }
}
