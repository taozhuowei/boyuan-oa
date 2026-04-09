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

import java.time.LocalDateTime;

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
}
