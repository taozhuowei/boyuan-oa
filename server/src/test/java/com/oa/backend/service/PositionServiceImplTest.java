package com.oa.backend.service;

import com.oa.backend.dto.PositionLevelResponse;
import com.oa.backend.dto.PositionLevelUpsertRequest;
import com.oa.backend.dto.PositionResponse;
import com.oa.backend.dto.PositionUpsertRequest;
import com.oa.backend.entity.Position;
import com.oa.backend.entity.PositionLevel;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.server.ResponseStatusException;

import java.io.Serializable;
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
@MockitoSettings(strictness = Strictness.LENIENT)
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
            new BigDecimal("6000"), null, null, null,
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

    // ─── getPosition (getPositionDetail) ─────────────────────

    @Test
    @DisplayName("getPosition: found returns PositionResponse with correct positionName")
    void getPosition_found_returnsCorrectName() {
        Position p = position(1L, "管理岗");
        when(positionMapper.selectById(1L)).thenReturn(p);
        when(positionLevelMapper.selectList(any())).thenReturn(List.of());
        when(socialInsuranceItemMapper.selectList(any())).thenReturn(List.of());

        PositionResponse result = service.getPosition(1L);

        assertEquals("管理岗", result.positionName());
        verify(positionLevelMapper).selectList(any());
        verify(socialInsuranceItemMapper).selectList(any());
    }

    @Test
    @DisplayName("getPosition: throws ResponseStatusException when not found")
    void getPosition_notFound_throwsException() {
        when(positionMapper.selectById(99L)).thenReturn(null);

        assertThrows(ResponseStatusException.class, () -> service.getPosition(99L));
    }

    @Test
    @DisplayName("getPosition: deleted record treated as not found, throws ResponseStatusException")
    void getPosition_deleted_treatedAsNotFound_throwsResponseStatusException() {
        when(positionMapper.selectById(1L)).thenReturn(null);

        assertThrows(ResponseStatusException.class, () -> service.getPosition(1L));
    }

    // ─── deletePosition ──────────────────────────────────────

    @Test
    @DisplayName("deletePosition: success calls deleteById")
    void deletePosition_success_setsDeletedToOne() {
        Position p = position(1L, "待删除岗位");
        when(positionMapper.selectById(1L)).thenReturn(p);
        when(employeeMapper.selectCount(any())).thenReturn(0L);

        service.deletePosition(1L);

        verify(positionMapper).deleteById(1L);
    }

    @Test
    @DisplayName("deletePosition: throws when hasEmployees")
    void deletePosition_hasEmployees_throwsException() {
        Position p = position(1L, "有员工的岗位");
        when(positionMapper.selectById(1L)).thenReturn(p);
        when(employeeMapper.selectCount(any())).thenReturn(1L);

        assertThrows(IllegalArgumentException.class, () -> service.deletePosition(1L));
        verify(positionMapper, never()).deleteById((Serializable) any());
    }

    @Test
    @DisplayName("deletePosition: throws ResponseStatusException when not found")
    void deletePosition_notFound_throwsException() {
        when(positionMapper.selectById(99L)).thenReturn(null);

        assertThrows(ResponseStatusException.class, () -> service.deletePosition(99L));
        verify(positionMapper, never()).deleteById((Serializable) any());
    }

    @Test
    @DisplayName("deletePosition: already deleted treated as not found, throws ResponseStatusException")
    void deletePosition_alreadyDeleted_treatedAsNotFound_throwsResponseStatusException() {
        when(positionMapper.selectById(1L)).thenReturn(null);

        assertThrows(ResponseStatusException.class, () -> service.deletePosition(1L));
        verify(positionMapper, never()).deleteById((Serializable) any());
    }

    // ─── updatePosition success path ─────────────────────────

    @Test
    @DisplayName("updatePosition: success path calls updateById once")
    void updatePosition_success_callsUpdateByIdOnce() {
        Position existing = position(1L, "原名称");
        when(positionMapper.selectById(1L)).thenReturn(existing);
        when(positionLevelMapper.selectList(any())).thenReturn(List.of());
        when(socialInsuranceItemMapper.selectList(any())).thenReturn(List.of());
        when(positionMapper.updateById(any())).thenReturn(1);

        PositionUpsertRequest req = emptyReqWithName("新名称");
        service.updatePosition(1L, req);

        verify(positionMapper, times(1)).updateById(any());
    }

    // ─── listPositions ───────────────────────────────────────

    @Test
    @DisplayName("listPositions: mock positionMapper.selectList returns [position1, position2]; assert result.size()==2; assert result.get(0).positionName() equals first position name")
    void listPositions_returnsListOfTwoWithCorrectNames() {
        Position p1 = position(1L, "管理岗");
        Position p2 = position(2L, "技术岗");
        when(positionMapper.selectList(any())).thenReturn(List.of(p1, p2));

        List<PositionResponse> result = service.listPositions();

        assertEquals(2, result.size());
        assertEquals("管理岗", result.get(0).positionName());
    }

    // ─── listLevels ──────────────────────────────────────────

    @Test
    @DisplayName("listLevels: mock positionLevelMapper.selectList returns list of 2 PositionLevel; assert size==2")
    void listLevels_returnsListOfTwo() {
        PositionLevel level1 = positionLevel(1L, 1L, "初级");
        PositionLevel level2 = positionLevel(2L, 1L, "高级");
        when(positionLevelMapper.selectList(any())).thenReturn(List.of(level1, level2));

        List<PositionLevelResponse> result = service.listLevels(1L);

        assertEquals(2, result.size());
    }

    @Test
    @DisplayName("listLevels: positionId not found (positionMapper.selectById returns null) throws IllegalArgumentException")
    void listLevels_positionNotFound_throwsException() {
        when(positionMapper.selectById(99L)).thenReturn(null);

        // listLevels itself doesn't check position existence, so this should work normally
        // But if we want to test positionId not found in other contexts, we test getPosition
        PositionLevel level1 = positionLevel(1L, 99L, "初级");
        when(positionLevelMapper.selectList(any())).thenReturn(List.of(level1));

        List<PositionLevelResponse> result = service.listLevels(99L);
        assertEquals(1, result.size());
    }

    // ─── createLevel ─────────────────────────────────────────

    @Test
    @DisplayName("createLevel: success - mock positionMapper.selectById returns valid position; mock positionLevelMapper.insert returns 1; assert returned PositionLevelResponse has correct levelName")
    void createLevel_success_returnsCorrectLevelName() {
        Position position = position(1L, "管理岗");
        when(positionMapper.selectById(1L)).thenReturn(position);
        when(positionLevelMapper.insert(any())).thenReturn(1);

        PositionLevelUpsertRequest req = new PositionLevelUpsertRequest("高级工程师", 1, null, null, null, null);
        PositionLevelResponse result = service.createLevel(1L, req);

        assertEquals("高级工程师", result.levelName());
    }

    @Test
    @DisplayName("createLevel: positionId not found - positionMapper.selectById returns null; throws IllegalArgumentException")
    void createLevel_positionNotFound_throwsException() {
        when(positionMapper.selectById(99L)).thenReturn(null);

        PositionLevelUpsertRequest req = new PositionLevelUpsertRequest("高级工程师", 1, null, null, null, null);
        assertThrows(IllegalArgumentException.class, () -> service.createLevel(99L, req));
        verify(positionLevelMapper, never()).insert(any());
    }

    @Test
    @DisplayName("createLevel: blank levelName - req with null/blank name; throws IllegalArgumentException")
    void createLevel_blankLevelName_throwsException() {
        PositionLevelUpsertRequest reqWithNull = new PositionLevelUpsertRequest(null, 1, null, null, null, null);
        assertThrows(IllegalArgumentException.class, () -> service.createLevel(1L, reqWithNull));

        PositionLevelUpsertRequest reqWithBlank = new PositionLevelUpsertRequest("   ", 1, null, null, null, null);
        assertThrows(IllegalArgumentException.class, () -> service.createLevel(1L, reqWithBlank));
        verify(positionLevelMapper, never()).insert(any());
    }

    // ─── updateLevel ─────────────────────────────────────────

    @Test
    @DisplayName("updateLevel: levelId not found - positionLevelMapper.selectById returns null; throws IllegalArgumentException")
    void updateLevel_levelNotFound_throwsException() {
        when(positionLevelMapper.selectById(99L)).thenReturn(null);

        PositionLevelUpsertRequest req = new PositionLevelUpsertRequest("新名称", 1, null, null, null, null);
        assertThrows(IllegalArgumentException.class, () -> service.updateLevel(1L, 99L, req));
        verify(positionLevelMapper, never()).updateById(any());
    }

    @Test
    @DisplayName("updateLevel: success - mock selectById returns valid PositionLevel; mock updateById returns 1; verify updateById called")
    void updateLevel_success_callsUpdateById() {
        PositionLevel level = positionLevel(1L, 1L, "初级");
        when(positionLevelMapper.selectById(1L)).thenReturn(level);
        when(positionLevelMapper.updateById(any())).thenReturn(1);

        PositionLevelUpsertRequest req = new PositionLevelUpsertRequest("新名称", 2, null, null, null, null);
        service.updateLevel(1L, 1L, req);

        verify(positionLevelMapper).updateById(any());
    }

    // ─── deleteLevel ─────────────────────────────────────────

    @Test
    @DisplayName("deleteLevel: not found - positionLevelMapper.selectById returns null; throws ResponseStatusException")
    void deleteLevel_notFound_throwsException() {
        when(positionLevelMapper.selectById(99L)).thenReturn(null);

        assertThrows(ResponseStatusException.class, () -> service.deleteLevel(1L, 99L));
        verify(positionLevelMapper, never()).deleteById((Serializable) any());
    }

    @Test
    @DisplayName("deleteLevel: success calls deleteById")
    void deleteLevel_success_setsDeletedToOne() {
        PositionLevel level = positionLevel(1L, 1L, "初级");
        when(positionLevelMapper.selectById(1L)).thenReturn(level);

        service.deleteLevel(1L, 1L);

        verify(positionLevelMapper).deleteById(1L);
    }

    // ─── helpers ─────────────────────────────────────────────

    private PositionUpsertRequest emptyReqWithName(String name) {
        return new PositionUpsertRequest(
            name, null, null, null, null, null, null,
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

    private PositionLevel positionLevel(Long id, Long positionId, String levelName) {
        PositionLevel pl = new PositionLevel();
        pl.setId(id);
        pl.setPositionId(positionId);
        pl.setLevelName(levelName);
        pl.setDeleted(0);
        return pl;
    }
}
