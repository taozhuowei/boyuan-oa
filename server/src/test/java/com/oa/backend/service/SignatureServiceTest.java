package com.oa.backend.service;

import com.oa.backend.entity.*;
import com.oa.backend.mapper.*;
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

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * SignatureService 单元测试
 * 覆盖：签名绑定、PIN验证、工资条确认、存证链记录创建
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("M5 - SignatureService")
class SignatureServiceTest {

    @InjectMocks
    private SignatureService service;

    @Mock
    private EmployeeSignatureMapper signatureMapper;

    @Mock
    private EvidenceChainMapper evidenceChainMapper;

    @Mock
    private PayrollSlipMapper slipMapper;

    @Mock
    private PayrollSlipItemMapper slipItemMapper;

    @Mock
    private PayrollItemDefMapper itemDefMapper;

    @Mock
    private EmployeeMapper employeeMapper;

    @Mock
    private SalaryConfirmationAgreementMapper agreementMapper;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    private static final String TEST_AES_KEY = "TestAESKey123456789012345678901234";
    private static final String TEST_BASE64_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    private static final String TEST_PIN = "123456";
    private static final Long TEST_EMPLOYEE_ID = 1L;
    private static final Long TEST_SLIP_ID = 100L;

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
        when(signatureMapper.insert(any())).thenAnswer(inv -> {
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

    // ─── confirmPayrollSlip ──────────────────────────────────────

    @Test
    @DisplayName("confirmPayrollSlip：PIN 错误抛出 IllegalArgumentException")
    void confirmPayrollSlip_wrongPin() {
        when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.confirmPayrollSlip(TEST_EMPLOYEE_ID, TEST_SLIP_ID, "wrongPin"));
        assertTrue(ex.getMessage().contains("PIN 码错误") || ex.getMessage().contains("未绑定签名"));
    }

    @Test
    @DisplayName("confirmPayrollSlip：工资条非 PUBLISHED 状态抛出 IllegalStateException")
    void confirmPayrollSlip_slipNotPublished() {
        // Setup signature for PIN verification
        EmployeeSignature signature = new EmployeeSignature();
        signature.setPinHash("hashedPin123");
        when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(signature);
        when(passwordEncoder.matches(TEST_PIN, "hashedPin123")).thenReturn(true);

        // Setup slip with wrong status
        PayrollSlip slip = new PayrollSlip();
        slip.setId(TEST_SLIP_ID);
        slip.setEmployeeId(TEST_EMPLOYEE_ID);
        slip.setStatus("CONFIRMED"); // Already confirmed
        slip.setDeleted(0);
        when(slipMapper.selectById(TEST_SLIP_ID)).thenReturn(slip);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.confirmPayrollSlip(TEST_EMPLOYEE_ID, TEST_SLIP_ID, TEST_PIN));
        assertTrue(ex.getMessage().contains("PUBLISHED") || ex.getMessage().contains("状态"));
    }

    @Test
    @DisplayName("confirmPayrollSlip：正常确认，工资条状态更新，存证链记录创建")
    void confirmPayrollSlip_success() {
        // Setup signature for PIN verification
        EmployeeSignature signature = new EmployeeSignature();
        signature.setPinHash("hashedPin123");
        when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(signature);
        when(passwordEncoder.matches(TEST_PIN, "hashedPin123")).thenReturn(true);

        // Setup slip
        PayrollSlip slip = new PayrollSlip();
        slip.setId(TEST_SLIP_ID);
        slip.setEmployeeId(TEST_EMPLOYEE_ID);
        slip.setStatus("PUBLISHED");
        slip.setCycleId(10L);
        slip.setDeleted(0);
        when(slipMapper.selectById(TEST_SLIP_ID)).thenReturn(slip);

        // Setup agreement
        SalaryConfirmationAgreement agreement = new SalaryConfirmationAgreement();
        agreement.setId(1L);
        agreement.setVersion("v1.0");
        when(agreementMapper.findActive()).thenReturn(agreement);

        // Setup evidence chain insert
        when(evidenceChainMapper.insert(any())).thenAnswer(inv -> {
            EvidenceChain ev = inv.getArgument(0);
            ev.setId(999L);
            return 1;
        });

        Long evidenceId = service.confirmPayrollSlip(TEST_EMPLOYEE_ID, TEST_SLIP_ID, TEST_PIN);

        // Verify slip updated
        ArgumentCaptor<PayrollSlip> slipCaptor = ArgumentCaptor.forClass(PayrollSlip.class);
        verify(slipMapper).updateById(slipCaptor.capture());
        PayrollSlip updatedSlip = slipCaptor.getValue();
        assertEquals("CONFIRMED", updatedSlip.getStatus());
        assertNotNull(updatedSlip.getUpdatedAt());

        // Verify evidence chain created
        ArgumentCaptor<EvidenceChain> evidenceCaptor = ArgumentCaptor.forClass(EvidenceChain.class);
        verify(evidenceChainMapper).insert(evidenceCaptor.capture());
        EvidenceChain evidence = evidenceCaptor.getValue();
        assertEquals(TEST_SLIP_ID, evidence.getSlipId());
        assertEquals(TEST_EMPLOYEE_ID, evidence.getEmployeeId());
        assertNotNull(evidence.getContentHash());
        assertNotNull(evidence.getConfirmedAt());
        assertEquals("v1.0", evidence.getAgreementVersion());

        // Verify returned ID
        assertNotNull(evidenceId);
        assertEquals(999L, evidenceId);
    }

    @Test
    @DisplayName("confirmPayrollSlip：无活跃协议时使用默认版本 v1.0")
    void confirmPayrollSlip_noActiveAgreement() {
        // Setup signature
        EmployeeSignature signature = new EmployeeSignature();
        signature.setPinHash("hashedPin123");
        when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(signature);
        when(passwordEncoder.matches(TEST_PIN, "hashedPin123")).thenReturn(true);

        // Setup slip
        PayrollSlip slip = new PayrollSlip();
        slip.setId(TEST_SLIP_ID);
        slip.setEmployeeId(TEST_EMPLOYEE_ID);
        slip.setStatus("PUBLISHED");
        slip.setDeleted(0);
        when(slipMapper.selectById(TEST_SLIP_ID)).thenReturn(slip);

        // No active agreement
        when(agreementMapper.findActive()).thenReturn(null);

        // Setup evidence chain insert
        when(evidenceChainMapper.insert(any())).thenAnswer(inv -> {
            EvidenceChain ev = inv.getArgument(0);
            ev.setId(888L);
            return 1;
        });

        service.confirmPayrollSlip(TEST_EMPLOYEE_ID, TEST_SLIP_ID, TEST_PIN);

        ArgumentCaptor<EvidenceChain> evidenceCaptor = ArgumentCaptor.forClass(EvidenceChain.class);
        verify(evidenceChainMapper).insert(evidenceCaptor.capture());
        assertEquals("v1.0", evidenceCaptor.getValue().getAgreementVersion());
    }

    @Test
    @DisplayName("confirmPayrollSlip：无权操作他人工资条抛出 IllegalArgumentException")
    void confirmPayrollSlip_notOwner() {
        // Setup signature
        EmployeeSignature signature = new EmployeeSignature();
        signature.setPinHash("hashedPin123");
        when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(signature);
        when(passwordEncoder.matches(TEST_PIN, "hashedPin123")).thenReturn(true);

        // Setup slip owned by different employee
        PayrollSlip slip = new PayrollSlip();
        slip.setId(TEST_SLIP_ID);
        slip.setEmployeeId(999L); // Different employee
        slip.setStatus("PUBLISHED");
        slip.setDeleted(0);
        when(slipMapper.selectById(TEST_SLIP_ID)).thenReturn(slip);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.confirmPayrollSlip(TEST_EMPLOYEE_ID, TEST_SLIP_ID, TEST_PIN));
        assertTrue(ex.getMessage().contains("无权"));
    }

    // ─── Additional Tests for Coverage ───────────────────────────

    @Test
    @DisplayName("bindSignature：AES 加密产生非空加密数据且可解密还原")
    void bindSignature_aesEncryptionProducesNonNullData() {
        when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(null);
        when(passwordEncoder.encode(TEST_PIN)).thenReturn("hashedPin123");
        when(signatureMapper.insert(any())).thenAnswer(inv -> {
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
        assertThrows(IllegalArgumentException.class,
                () -> service.bindSignature(null, TEST_BASE64_IMAGE, TEST_PIN));

        // null base64Image
        assertThrows(IllegalArgumentException.class,
                () -> service.bindSignature(TEST_EMPLOYEE_ID, null, TEST_PIN));

        // blank base64Image
        assertThrows(IllegalArgumentException.class,
                () -> service.bindSignature(TEST_EMPLOYEE_ID, "   ", TEST_PIN));

        // null pin
        assertThrows(IllegalArgumentException.class,
                () -> service.bindSignature(TEST_EMPLOYEE_ID, TEST_BASE64_IMAGE, null));

        // blank pin
        assertThrows(IllegalArgumentException.class,
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

    @Test
    @DisplayName("confirmPayrollSlip：工资条不存在抛出 IllegalArgumentException")
    void confirmPayrollSlip_slipNotFoundThrowsException() {
        // Setup signature for PIN verification
        EmployeeSignature signature = new EmployeeSignature();
        signature.setPinHash("hashedPin123");
        when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(signature);
        when(passwordEncoder.matches(TEST_PIN, "hashedPin123")).thenReturn(true);

        // Slip not found
        when(slipMapper.selectById(TEST_SLIP_ID)).thenReturn(null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.confirmPayrollSlip(TEST_EMPLOYEE_ID, TEST_SLIP_ID, TEST_PIN));
        assertTrue(ex.getMessage().contains("不存在"));
    }

    @Test
    @DisplayName("confirmPayrollSlip：工资条已逻辑删除抛出 IllegalArgumentException")
    void confirmPayrollSlip_slipDeletedThrowsException() {
        // Setup signature for PIN verification
        EmployeeSignature signature = new EmployeeSignature();
        signature.setPinHash("hashedPin123");
        when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(signature);
        when(passwordEncoder.matches(TEST_PIN, "hashedPin123")).thenReturn(true);

        // Slip is logically deleted
        PayrollSlip slip = new PayrollSlip();
        slip.setId(TEST_SLIP_ID);
        slip.setEmployeeId(TEST_EMPLOYEE_ID);
        slip.setStatus("PUBLISHED");
        slip.setDeleted(1);
        when(slipMapper.selectById(TEST_SLIP_ID)).thenReturn(slip);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.confirmPayrollSlip(TEST_EMPLOYEE_ID, TEST_SLIP_ID, TEST_PIN));
        assertTrue(ex.getMessage().contains("不存在"));
    }

    @Test
    @DisplayName("generateEvidencePdf：工资条不存在抛出 IllegalArgumentException")
    void generateEvidencePdf_slipNotFoundThrowsException() {
        when(slipMapper.selectById(TEST_SLIP_ID)).thenReturn(null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.generateEvidencePdf(TEST_SLIP_ID));
        assertTrue(ex.getMessage().contains("不存在"));
    }

    @Test
    @DisplayName("generateEvidencePdf：工资条已逻辑删除抛出 IllegalArgumentException")
    void generateEvidencePdf_slipDeletedThrowsException() {
        PayrollSlip slip = new PayrollSlip();
        slip.setId(TEST_SLIP_ID);
        slip.setDeleted(1);
        when(slipMapper.selectById(TEST_SLIP_ID)).thenReturn(slip);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.generateEvidencePdf(TEST_SLIP_ID));
        assertTrue(ex.getMessage().contains("不存在"));
    }

    @Test
    @DisplayName("generateEvidencePdf：员工不存在抛出 IllegalArgumentException")
    void generateEvidencePdf_employeeNotFoundThrowsException() {
        PayrollSlip slip = new PayrollSlip();
        slip.setId(TEST_SLIP_ID);
        slip.setEmployeeId(TEST_EMPLOYEE_ID);
        slip.setDeleted(0);
        when(slipMapper.selectById(TEST_SLIP_ID)).thenReturn(slip);
        when(employeeMapper.selectById(TEST_EMPLOYEE_ID)).thenReturn(null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.generateEvidencePdf(TEST_SLIP_ID));
        assertTrue(ex.getMessage().contains("员工不存在"));
    }

    @Test
    @DisplayName("generateEvidencePdf：员工未绑定签名抛出 IllegalArgumentException")
    void generateEvidencePdf_noSignatureThrowsException() {
        Employee employee = new Employee();
        employee.setId(TEST_EMPLOYEE_ID);
        employee.setName("Test Employee");

        PayrollSlip slip = new PayrollSlip();
        slip.setId(TEST_SLIP_ID);
        slip.setEmployeeId(TEST_EMPLOYEE_ID);
        slip.setDeleted(0);

        when(slipMapper.selectById(TEST_SLIP_ID)).thenReturn(slip);
        when(employeeMapper.selectById(TEST_EMPLOYEE_ID)).thenReturn(employee);
        when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.generateEvidencePdf(TEST_SLIP_ID));
        assertTrue(ex.getMessage().contains("未绑定签名"));
    }

    @Test
    @DisplayName("generateEvidencePdf：无存证记录抛出 IllegalArgumentException")
    void generateEvidencePdf_noEvidenceThrowsException() {
        Employee employee = new Employee();
        employee.setId(TEST_EMPLOYEE_ID);
        employee.setName("Test Employee");

        EmployeeSignature signature = new EmployeeSignature();
        signature.setId(1L);
        signature.setEmployeeId(TEST_EMPLOYEE_ID);
        signature.setSignatureImageEncrypted("encryptedData");

        PayrollSlip slip = new PayrollSlip();
        slip.setId(TEST_SLIP_ID);
        slip.setEmployeeId(TEST_EMPLOYEE_ID);
        slip.setDeleted(0);

        when(slipMapper.selectById(TEST_SLIP_ID)).thenReturn(slip);
        when(employeeMapper.selectById(TEST_EMPLOYEE_ID)).thenReturn(employee);
        when(signatureMapper.findByEmployeeId(TEST_EMPLOYEE_ID)).thenReturn(signature);
        when(evidenceChainMapper.findBySlipId(TEST_SLIP_ID)).thenReturn(null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.generateEvidencePdf(TEST_SLIP_ID));
        assertTrue(ex.getMessage().contains("尚未确认"));
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
    @DisplayName("formatPeriod：返回包含 cycleId 的字符串")
    void formatPeriod_returnsCycleInfo() throws Exception {
        Method m = SignatureService.class.getDeclaredMethod("formatPeriod", PayrollSlip.class);
        m.setAccessible(true);
        PayrollSlip slip = new PayrollSlip();
        slip.setCycleId(42L);
        String result = (String) m.invoke(service, slip);
        assertTrue(result.contains("42"));
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
        Method m = SignatureService.class.getDeclaredMethod(
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
