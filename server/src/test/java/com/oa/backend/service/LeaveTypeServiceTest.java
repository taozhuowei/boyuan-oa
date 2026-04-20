package com.oa.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.oa.backend.entity.LeaveTypeDef;
import com.oa.backend.mapper.LeaveTypeDefMapper;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** LeaveTypeService 单元测试 覆盖：启用类型查询、全量查询、编码存在性检查、创建、查找、更新、软删除 */
@ExtendWith(MockitoExtension.class)
@DisplayName("M6 - LeaveTypeService")
class LeaveTypeServiceTest {

  @InjectMocks private LeaveTypeService service;

  @Mock private LeaveTypeDefMapper leaveTypeDefMapper;

  // ─── listEnabledLeaveTypes ───────────────────────────────────

  @Test
  @DisplayName("listEnabledLeaveTypes：调用 selectList，返回 mapper 结果")
  void listEnabledLeaveTypes_returnsMapperResult() {
    LeaveTypeDef def = new LeaveTypeDef();
    def.setId(1L);
    def.setCode("ANNUAL");
    def.setIsEnabled(true);
    def.setDeleted(0);
    when(leaveTypeDefMapper.selectList(any())).thenReturn(List.of(def));

    List<LeaveTypeDef> result = service.listEnabledLeaveTypes();

    assertNotNull(result);
    assertEquals(1, result.size());
    assertEquals("ANNUAL", result.get(0).getCode());
    verify(leaveTypeDefMapper).selectList(any());
  }

  // ─── listAllLeaveTypes ───────────────────────────────────────

  @Test
  @DisplayName("listAllLeaveTypes：调用 selectList，返回包含禁用项的完整列表")
  void listAllLeaveTypes_returnsAllLeaveTypes() {
    LeaveTypeDef enabled = new LeaveTypeDef();
    enabled.setId(1L);
    enabled.setIsEnabled(true);
    enabled.setDeleted(0);

    LeaveTypeDef disabled = new LeaveTypeDef();
    disabled.setId(2L);
    disabled.setIsEnabled(false);
    disabled.setDeleted(0);

    when(leaveTypeDefMapper.selectList(any())).thenReturn(List.of(enabled, disabled));

    List<LeaveTypeDef> result = service.listAllLeaveTypes();

    assertEquals(2, result.size());
    verify(leaveTypeDefMapper).selectList(any());
  }

  // ─── existsByCode ────────────────────────────────────────────

  @Test
  @DisplayName("existsByCode：count > 0 返回 true")
  void existsByCode_countPositive_returnsTrue() {
    when(leaveTypeDefMapper.selectCount(any())).thenReturn(1L);

    assertTrue(service.existsByCode("ANNUAL"));
    verify(leaveTypeDefMapper).selectCount(any());
  }

  @Test
  @DisplayName("existsByCode：count == 0 返回 false")
  void existsByCode_countZero_returnsFalse() {
    when(leaveTypeDefMapper.selectCount(any())).thenReturn(0L);

    assertFalse(service.existsByCode("NONEXISTENT"));
    verify(leaveTypeDefMapper).selectCount(any());
  }

  // ─── createLeaveType ─────────────────────────────────────────

  @Test
  @DisplayName("createLeaveType：存在前序记录时 displayOrder = 前序 displayOrder + 1")
  void createLeaveType_withPreviousEntry_displayOrderIncremented() {
    LeaveTypeDef last = new LeaveTypeDef();
    last.setDisplayOrder(5);
    // selectOne returns last entry (LIMIT 1 by displayOrder desc)
    when(leaveTypeDefMapper.selectOne(any())).thenReturn(last);
    when(leaveTypeDefMapper.insert(any())).thenReturn(1);

    LeaveTypeDef result =
        service.createLeaveType("SICK", "病假", 10, new BigDecimal("0.5"), "BASIC_SALARY");

    ArgumentCaptor<LeaveTypeDef> captor = ArgumentCaptor.forClass(LeaveTypeDef.class);
    verify(leaveTypeDefMapper).insert(captor.capture());
    LeaveTypeDef inserted = captor.getValue();

    assertEquals(6, inserted.getDisplayOrder());
    assertFalse(inserted.getIsSystem());
    assertTrue(inserted.getIsEnabled());
    assertEquals(0, inserted.getDeleted());
    assertNotNull(inserted.getCreatedAt());
    assertNotNull(inserted.getUpdatedAt());
    assertEquals("SICK", inserted.getCode());
    assertEquals("病假", inserted.getName());
    assertEquals(10, inserted.getQuotaDays());
    assertEquals(new BigDecimal("0.5"), inserted.getDeductionRate());
    assertEquals("BASIC_SALARY", inserted.getDeductionBasis());

    assertSame(inserted, result);
  }

  @Test
  @DisplayName("createLeaveType：无前序记录时 displayOrder = 1")
  void createLeaveType_noPreviousEntry_displayOrderIsOne() {
    when(leaveTypeDefMapper.selectOne(any())).thenReturn(null);
    when(leaveTypeDefMapper.insert(any())).thenReturn(1);

    service.createLeaveType("ANNUAL", "年假", null, null, null);

    ArgumentCaptor<LeaveTypeDef> captor = ArgumentCaptor.forClass(LeaveTypeDef.class);
    verify(leaveTypeDefMapper).insert(captor.capture());
    assertEquals(1, captor.getValue().getDisplayOrder());
  }

  @Test
  @DisplayName("createLeaveType：前序记录 displayOrder 为 null 时 displayOrder = 1")
  void createLeaveType_previousEntryNullDisplayOrder_displayOrderIsOne() {
    LeaveTypeDef last = new LeaveTypeDef();
    last.setDisplayOrder(null); // null displayOrder edge case
    when(leaveTypeDefMapper.selectOne(any())).thenReturn(last);
    when(leaveTypeDefMapper.insert(any())).thenReturn(1);

    service.createLeaveType("COMP", "调休", null, null, null);

    ArgumentCaptor<LeaveTypeDef> captor = ArgumentCaptor.forClass(LeaveTypeDef.class);
    verify(leaveTypeDefMapper).insert(captor.capture());
    assertEquals(1, captor.getValue().getDisplayOrder());
  }

  // ─── findActiveById ──────────────────────────────────────────

  @Test
  @DisplayName("findActiveById：记录存在且 deleted==0，返回实体")
  void findActiveById_existsAndNotDeleted_returnsEntity() {
    LeaveTypeDef def = new LeaveTypeDef();
    def.setId(10L);
    def.setDeleted(0);
    when(leaveTypeDefMapper.selectById(10L)).thenReturn(def);

    LeaveTypeDef result = service.findActiveById(10L);

    assertNotNull(result);
    assertEquals(10L, result.getId());
  }

  @Test
  @DisplayName("findActiveById：selectById 返回 null，返回 null")
  void findActiveById_notFound_returnsNull() {
    when(leaveTypeDefMapper.selectById(99L)).thenReturn(null);

    assertNull(service.findActiveById(99L));
  }

  @Test
  @DisplayName("findActiveById：记录存在但 deleted != 0，返回 null")
  void findActiveById_deletedRecord_returnsNull() {
    LeaveTypeDef def = new LeaveTypeDef();
    def.setId(10L);
    def.setDeleted(1);
    when(leaveTypeDefMapper.selectById(10L)).thenReturn(def);

    assertNull(service.findActiveById(10L));
  }

  // ─── updateLeaveType ─────────────────────────────────────────

  @Test
  @DisplayName("updateLeaveType：非 null 字段全部更新，null 字段跳过")
  void updateLeaveType_nonNullFieldsUpdated_nullFieldsSkipped() {
    LeaveTypeDef entity = new LeaveTypeDef();
    entity.setId(1L);
    entity.setName("旧名称");
    entity.setQuotaDays(5);
    entity.setDeductionRate(new BigDecimal("0.3"));
    entity.setDeductionBasis("BASIC_SALARY");
    entity.setIsEnabled(true);

    when(leaveTypeDefMapper.updateById(any())).thenReturn(1);

    service.updateLeaveType(entity, "新名称", null, new BigDecimal("0.5"), null, false);

    ArgumentCaptor<LeaveTypeDef> captor = ArgumentCaptor.forClass(LeaveTypeDef.class);
    verify(leaveTypeDefMapper).updateById(captor.capture());
    LeaveTypeDef updated = captor.getValue();

    assertEquals("新名称", updated.getName()); // updated
    assertEquals(5, updated.getQuotaDays()); // unchanged (null passed)
    assertEquals(new BigDecimal("0.5"), updated.getDeductionRate()); // updated
    assertEquals("BASIC_SALARY", updated.getDeductionBasis()); // unchanged (null passed)
    assertFalse(updated.getIsEnabled()); // updated
    assertNotNull(updated.getUpdatedAt()); // always set
  }

  @Test
  @DisplayName("updateLeaveType：全部参数为 null 时只更新 updatedAt")
  void updateLeaveType_allNullParams_onlyUpdatedAtChanged() {
    LeaveTypeDef entity = new LeaveTypeDef();
    entity.setId(2L);
    entity.setName("原名");
    entity.setQuotaDays(10);
    entity.setIsEnabled(true);

    when(leaveTypeDefMapper.updateById(any())).thenReturn(1);

    service.updateLeaveType(entity, null, null, null, null, null);

    ArgumentCaptor<LeaveTypeDef> captor = ArgumentCaptor.forClass(LeaveTypeDef.class);
    verify(leaveTypeDefMapper).updateById(captor.capture());
    LeaveTypeDef updated = captor.getValue();

    assertEquals("原名", updated.getName());
    assertEquals(10, updated.getQuotaDays());
    assertTrue(updated.getIsEnabled());
    assertNotNull(updated.getUpdatedAt());
  }

  // ─── deleteLeaveType ─────────────────────────────────────────

  @Test
  @DisplayName("deleteLeaveType：调用 deleteById 并传入正确 id")
  void deleteLeaveType_callsDeleteById() {
    when(leaveTypeDefMapper.deleteById(7L)).thenReturn(1);

    service.deleteLeaveType(7L);

    verify(leaveTypeDefMapper).deleteById(7L);
  }
}
