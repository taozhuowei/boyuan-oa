package com.oa.backend.service;

import com.oa.backend.dto.PositionResponse;
import com.oa.backend.dto.PositionUpsertRequest;
import com.oa.backend.entity.Position;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.PositionLevelMapper;
import com.oa.backend.mapper.PositionMapper;
import com.oa.backend.mapper.SocialInsuranceItemMapper;
import com.oa.backend.service.impl.PositionServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * PositionServiceImpl 单元测试
 * 覆盖：创建岗位、参数校验、默认值填充、不存在岗位的更新
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("M2 - PositionServiceImpl")
class PositionServiceImplTest {

    @InjectMocks
    private PositionServiceImpl service;

    @Mock
    private PositionMapper positionMapper;

    @Mock
    private PositionLevelMapper positionLevelMapper;

    @Mock
    private SocialInsuranceItemMapper socialInsuranceItemMapper;

    @Mock
    private EmployeeMapper employeeMapper;

    // ─── createPosition ──────────────────────────────────────

    @Test
    @DisplayName("createPosition：名称为空时抛出 IllegalArgumentException")
    void createPosition_blankName_throwsException() {
        PositionUpsertRequest req = emptyReqWithName("");
        assertThrows(IllegalArgumentException.class, () -> service.createPosition(req));
        verify(positionMapper, never()).insert(any());
    }

    @Test
    @DisplayName("createPosition：名称为 null 时抛出 IllegalArgumentException")
    void createPosition_nullName_throwsException() {
        PositionUpsertRequest req = emptyReqWithName(null);
        assertThrows(IllegalArgumentException.class, () -> service.createPosition(req));
    }

    @Test
    @DisplayName("createPosition：默认 employeeCategory=OFFICE、加班倍率填充默认值")
    void createPosition_defaults_areApplied() {
        when(positionMapper.insert(any())).thenReturn(1);
        when(positionMapper.selectOne(any())).thenReturn(null); // generatePositionCode: 无已有岗位

        PositionUpsertRequest req = emptyReqWithName("管理岗");
        PositionResponse result = service.createPosition(req);

        assertNotNull(result);
        assertEquals("管理岗", result.positionName());
        assertEquals("OFFICE", result.employeeCategory());
        assertEquals(new BigDecimal("1.5"), result.overtimeRateWeekday());
        assertEquals(new BigDecimal("2.0"), result.overtimeRateWeekend());
        assertEquals(new BigDecimal("3.0"), result.overtimeRateHoliday());
        assertFalse(result.requiresConstructionLog());
        assertFalse(result.hasPerformanceBonus());
    }

    @Test
    @DisplayName("createPosition：显式传入的值优先于默认值")
    void createPosition_explicitValues_override_defaults() {
        when(positionMapper.insert(any())).thenReturn(1);
        when(positionMapper.selectOne(any())).thenReturn(null); // generatePositionCode: 无已有岗位

        PositionUpsertRequest req = new PositionUpsertRequest(
            "施工岗", "LABOR", "worker",
            new BigDecimal("6000"), null, null,
            new BigDecimal("1.8"), new BigDecimal("2.5"), new BigDecimal("3.5"),
            null, 5, null, null, true, true
        );

        PositionResponse result = service.createPosition(req);

        assertEquals("LABOR", result.employeeCategory());
        assertEquals(new BigDecimal("1.8"), result.overtimeRateWeekday());
        assertTrue(result.requiresConstructionLog());
        assertTrue(result.hasPerformanceBonus());
    }

    // ─── updatePosition ──────────────────────────────────────

    @Test
    @DisplayName("updatePosition：岗位不存在时抛出 IllegalArgumentException")
    void updatePosition_notFound_throwsException() {
        when(positionMapper.selectById(99L)).thenReturn(null);

        PositionUpsertRequest req = emptyReqWithName("新名称");
        assertThrows(IllegalArgumentException.class, () -> service.updatePosition(99L, req));
        verify(positionMapper, never()).updateById(any());
    }

    @Test
    @DisplayName("updatePosition：软删除的岗位抛出 IllegalArgumentException")
    void updatePosition_deletedPosition_throwsException() {
        Position deleted = position(1L, "旧名称");
        deleted.setDeleted(1);
        when(positionMapper.selectById(1L)).thenReturn(deleted);

        assertThrows(IllegalArgumentException.class,
            () -> service.updatePosition(1L, emptyReqWithName("新名称")));
    }

    @Test
    @DisplayName("updatePosition：仅更新传入的非 null 字段")
    void updatePosition_partialUpdate_onlyChangesNonNullFields() {
        Position existing = position(1L, "原名称");
        existing.setEmployeeCategory("OFFICE");
        when(positionMapper.selectById(1L)).thenReturn(existing);
        when(positionLevelMapper.selectList(any())).thenReturn(List.of());
        when(socialInsuranceItemMapper.selectList(any())).thenReturn(List.of());

        // 只传 positionName，其余均 null
        PositionUpsertRequest req = emptyReqWithName("新名称");
        service.updatePosition(1L, req);

        ArgumentCaptor<Position> captor = ArgumentCaptor.forClass(Position.class);
        verify(positionMapper).updateById(captor.capture());
        assertEquals("新名称", captor.getValue().getPositionName());
        // employeeCategory 未传 null，应保持原值
        assertEquals("OFFICE", captor.getValue().getEmployeeCategory());
    }

    // ─── helpers ─────────────────────────────────────────────

    private PositionUpsertRequest emptyReqWithName(String name) {
        return new PositionUpsertRequest(
            name, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null
        );
    }

    private Position position(Long id, String name) {
        Position p = new Position();
        p.setId(id);
        p.setPositionCode("POS001");
        p.setPositionName(name);
        p.setDeleted(0);
        return p;
    }
}
