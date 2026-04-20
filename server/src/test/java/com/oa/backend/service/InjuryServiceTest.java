package com.oa.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.oa.backend.entity.FormRecord;
import com.oa.backend.entity.InjuryClaim;
import com.oa.backend.mapper.FormRecordMapper;
import com.oa.backend.mapper.InjuryClaimMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** InjuryService 单元测试 覆盖：全量查询、插入、表单记录推断员工 ID（三种路径） */
@ExtendWith(MockitoExtension.class)
@DisplayName("M8 - InjuryService")
class InjuryServiceTest {

  @InjectMocks private InjuryService service;

  @Mock private InjuryClaimMapper injuryClaimMapper;

  @Mock private FormRecordMapper formRecordMapper;

  // ─── listAllClaims ───────────────────────────────────────────

  @Test
  @DisplayName("listAllClaims：调用 selectList，返回 mapper 结果")
  void listAllClaims_returnsMapperResult() {
    InjuryClaim claim = new InjuryClaim();
    claim.setId(1L);
    claim.setEmployeeId(10L);
    claim.setInjuryDate(LocalDate.of(2024, 1, 15));
    claim.setCompensationAmount(new BigDecimal("5000"));
    claim.setStatus("PENDING");
    claim.setDeleted(0);

    when(injuryClaimMapper.selectList(any())).thenReturn(List.of(claim));

    List<InjuryClaim> result = service.listAllClaims();

    assertNotNull(result);
    assertEquals(1, result.size());
    assertEquals(1L, result.get(0).getId());
    verify(injuryClaimMapper).selectList(any());
    // formRecordMapper must not be touched in a plain list query
    verifyNoInteractions(formRecordMapper);
  }

  // ─── saveClaim ───────────────────────────────────────────────

  @Test
  @DisplayName("saveClaim：调用 mapper.insert 并传入相同 claim 对象")
  void saveClaim_callsMapperInsert() {
    InjuryClaim claim = new InjuryClaim();
    claim.setEmployeeId(20L);
    claim.setInjuryDate(LocalDate.of(2024, 3, 10));
    claim.setStatus("PENDING");
    claim.setDeleted(0);
    when(injuryClaimMapper.insert(claim)).thenReturn(1);

    service.saveClaim(claim);

    verify(injuryClaimMapper).insert(claim);
  }

  // ─── resolveEmployeeIdFromFormRecord ─────────────────────────

  @Test
  @DisplayName("resolveEmployeeIdFromFormRecord：formRecordId 为 null，直接返回 null，不调用 mapper")
  void resolveEmployeeIdFromFormRecord_nullId_returnsNullWithoutMapperCall() {
    Long result = service.resolveEmployeeIdFromFormRecord(null);

    assertNull(result);
    verifyNoInteractions(formRecordMapper);
  }

  @Test
  @DisplayName("resolveEmployeeIdFromFormRecord：FormRecord 存在，返回 submitterId")
  void resolveEmployeeIdFromFormRecord_recordFound_returnsSubmitterId() {
    FormRecord fr = new FormRecord();
    fr.setId(5L);
    fr.setSubmitterId(42L);
    when(formRecordMapper.selectById(5L)).thenReturn(fr);

    Long result = service.resolveEmployeeIdFromFormRecord(5L);

    assertEquals(42L, result);
    verify(formRecordMapper).selectById(5L);
  }

  @Test
  @DisplayName("resolveEmployeeIdFromFormRecord：selectById 返回 null，返回 null")
  void resolveEmployeeIdFromFormRecord_recordNotFound_returnsNull() {
    when(formRecordMapper.selectById(99L)).thenReturn(null);

    Long result = service.resolveEmployeeIdFromFormRecord(99L);

    assertNull(result);
    verify(formRecordMapper).selectById(99L);
  }
}
