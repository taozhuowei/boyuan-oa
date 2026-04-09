package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * PayrollEngine 单元测试
 * 覆盖：工资周期创建、申报窗口开放、预结算检查、正式结算
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("M3 - PayrollEngine")
class PayrollEngineTest {

    @InjectMocks
    private PayrollEngine engine;

    @Mock
    private PayrollCycleMapper cycleMapper;

    @Mock
    private PayrollSlipMapper slipMapper;

    @Mock
    private PayrollSlipItemMapper slipItemMapper;

    @Mock
    private PayrollItemDefMapper itemDefMapper;

    @Mock
    private EmployeeMapper employeeMapper;

    @Mock
    private PositionMapper positionMapper;

    @Mock
    private FormRecordMapper formRecordMapper;

    @Mock
    private ObjectMapper objectMapper;

    private static final String TEST_PERIOD = "2026-04";
    private static final Long TEST_CYCLE_ID = 1L;

    // ─── createCycle ─────────────────────────────────────────────

    @Test
    @DisplayName("createCycle：正常创建，status=OPEN，period正确")
    void createCycle_normal() {
        when(cycleMapper.findByPeriod(TEST_PERIOD)).thenReturn(null);
        when(cycleMapper.insert(any())).thenAnswer(inv -> {
            PayrollCycle c = inv.getArgument(0);
            c.setId(TEST_CYCLE_ID);
            return 1;
        });

        PayrollCycle result = engine.createCycle(TEST_PERIOD);

        assertEquals("OPEN", result.getStatus());
        assertEquals(TEST_PERIOD, result.getPeriod());
        assertEquals("MONTHLY", result.getSettlementType());
        assertNotNull(result.getStartDate());
        assertNotNull(result.getEndDate());
        assertNotNull(result.getPayDate());
        assertEquals(7, result.getWindowDays());
        assertEquals(1, result.getVersion());
        assertEquals(0, result.getDeleted());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getUpdatedAt());

        verify(cycleMapper).insert(any(PayrollCycle.class));
    }

    @Test
    @DisplayName("createCycle：周期已存在时抛出 IllegalStateException")
    void createCycle_duplicate() {
        PayrollCycle existing = new PayrollCycle();
        existing.setId(TEST_CYCLE_ID);
        existing.setPeriod(TEST_PERIOD);
        when(cycleMapper.findByPeriod(TEST_PERIOD)).thenReturn(existing);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> engine.createCycle(TEST_PERIOD));
        assertTrue(ex.getMessage().contains("已存在"));

        verify(cycleMapper, never()).insert(any());
    }

    // ─── openWindow ──────────────────────────────────────────────

    @Test
    @DisplayName("openWindow：从 OPEN 状态成功开放窗口")
    void openWindow_fromOpen() {
        PayrollCycle cycle = createCycleWithStatus("OPEN");
        cycle.setWindowDays(7);
        when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);

        PayrollCycle result = engine.openWindow(TEST_CYCLE_ID);

        assertEquals("WINDOW_OPEN", result.getStatus());
        assertEquals("OPEN", result.getWindowStatus());
        assertNotNull(result.getWindowStartDate());
        assertNotNull(result.getWindowEndDate());

        ArgumentCaptor<PayrollCycle> captor = ArgumentCaptor.forClass(PayrollCycle.class);
        verify(cycleMapper).updateById(captor.capture());
        assertEquals("WINDOW_OPEN", captor.getValue().getStatus());
        assertEquals("OPEN", captor.getValue().getWindowStatus());
    }

    @Test
    @DisplayName("openWindow：非 OPEN 状态抛出 IllegalStateException")
    void openWindow_wrongStatus() {
        PayrollCycle cycle = createCycleWithStatus("SETTLED");
        when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> engine.openWindow(TEST_CYCLE_ID));
        assertTrue(ex.getMessage().contains("无法开放申报窗口"));
    }

    // ─── precheck ────────────────────────────────────────────────

    @Test
    @DisplayName("precheck：无 PUBLISHED 工资条且无并发结算，两项检查通过")
    void precheck_noPublishedSlips_and_noConcurrent() {
        PayrollCycle cycle = createCycleWithStatus("OPEN");
        when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);
        when(slipMapper.countByStatus(TEST_CYCLE_ID, "PUBLISHED")).thenReturn(0);
        when(cycleMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

        List<PayrollEngine.PrecheckItem> result = engine.precheck(TEST_CYCLE_ID);

        assertEquals(2, result.size());
        assertTrue(result.get(0).pass());
        assertTrue(result.get(1).pass());
        assertEquals("no_pending_slips", result.get(0).key());
        assertEquals("no_concurrent_settlement", result.get(1).key());
    }

    @Test
    @DisplayName("precheck：存在 PUBLISHED 工资条，第一项检查不通过")
    void precheck_hasPublishedSlips() {
        PayrollCycle cycle = createCycleWithStatus("OPEN");
        when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);
        when(slipMapper.countByStatus(TEST_CYCLE_ID, "PUBLISHED")).thenReturn(1);
        when(cycleMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

        List<PayrollEngine.PrecheckItem> result = engine.precheck(TEST_CYCLE_ID);

        assertEquals(2, result.size());
        assertFalse(result.get(0).pass());
        assertTrue(result.get(1).pass());
        assertNotNull(result.get(0).message());
    }

    // ─── settle ──────────────────────────────────────────────────

    @Test
    @DisplayName("settle：非允许状态(如SETTLED)抛出 IllegalStateException")
    void settle_requiresWindowClosed() {
        PayrollCycle cycle = createCycleWithStatus("SETTLED");
        when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> engine.settle(TEST_CYCLE_ID));
        assertTrue(ex.getMessage().contains("无法执行结算"));
    }

    @Test
    @DisplayName("settle：WINDOW_CLOSED 状态，为2个员工创建工资条")
    void settle_windowClosed_createsSlips() {
        // Setup cycle
        PayrollCycle cycle = createCycleWithStatus("WINDOW_CLOSED");
        cycle.setStartDate(LocalDate.of(2026, 4, 1));
        cycle.setEndDate(LocalDate.of(2026, 4, 30));
        when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);

        // Precheck mocks
        when(slipMapper.countByStatus(TEST_CYCLE_ID, "PUBLISHED")).thenReturn(0);
        when(cycleMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

        // ItemDef mocks - ensureItemDef finds existing
        when(itemDefMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);
        PayrollItemDef baseDef = createItemDef(1L, "BASE_SALARY", "基本工资", "EARNING");
        PayrollItemDef overtimeDef = createItemDef(2L, "OVERTIME_PAY", "加班费", "EARNING");
        PayrollItemDef leaveDef = createItemDef(3L, "LEAVE_DEDUCT", "请假扣款", "DEDUCTION");
        when(itemDefMapper.selectOne(any(LambdaQueryWrapper.class)))
                .thenReturn(baseDef)
                .thenReturn(overtimeDef)
                .thenReturn(leaveDef);

        // Employee mocks - 2 employees
        Employee emp1 = createEmployee(1L, 10L);
        Employee emp2 = createEmployee(2L, 20L);
        when(employeeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(emp1, emp2));

        // Position mocks
        Position pos1 = createPosition(10L, new BigDecimal("5000.00"));
        Position pos2 = createPosition(20L, new BigDecimal("8000.00"));
        when(positionMapper.selectById(10L)).thenReturn(pos1);
        when(positionMapper.selectById(20L)).thenReturn(pos2);

        // FormRecord mocks (no overtime/leave records)
        when(formRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

        // Slip insert mock
        when(slipMapper.insert(any())).thenAnswer(inv -> {
            PayrollSlip slip = inv.getArgument(0);
            slip.setId(slip.getEmployeeId() + 100L);
            return 1;
        });

        PayrollCycle result = engine.settle(TEST_CYCLE_ID);

        assertEquals("SETTLED", result.getStatus());
        assertNotNull(result.getLockedAt());

        // Verify 2 slips were inserted
        ArgumentCaptor<PayrollSlip> slipCaptor = ArgumentCaptor.forClass(PayrollSlip.class);
        verify(slipMapper, times(2)).insert(slipCaptor.capture());
        List<PayrollSlip> capturedSlips = slipCaptor.getAllValues();
        assertEquals(2, capturedSlips.size());
        assertEquals("PUBLISHED", capturedSlips.get(0).getStatus());
        assertEquals("PUBLISHED", capturedSlips.get(1).getStatus());

        verify(cycleMapper).updateById(cycle);
    }

    // ─── helpers ─────────────────────────────────────────────────

    private PayrollCycle createCycleWithStatus(String status) {
        PayrollCycle cycle = new PayrollCycle();
        cycle.setId(TEST_CYCLE_ID);
        cycle.setPeriod(TEST_PERIOD);
        cycle.setStatus(status);
        cycle.setSettlementType("MONTHLY");
        cycle.setStartDate(LocalDate.of(2026, 4, 1));
        cycle.setEndDate(LocalDate.of(2026, 4, 30));
        cycle.setPayDate(LocalDate.of(2026, 5, 15));
        cycle.setWindowDays(7);
        cycle.setVersion(1);
        cycle.setDeleted(0);
        cycle.setCreatedAt(LocalDateTime.now());
        cycle.setUpdatedAt(LocalDateTime.now());
        return cycle;
    }

    private Employee createEmployee(Long id, Long positionId) {
        Employee emp = new Employee();
        emp.setId(id);
        emp.setPositionId(positionId);
        emp.setEmployeeNo("EMP" + id);
        emp.setName("员工" + id);
        emp.setAccountStatus("ACTIVE");
        emp.setDeleted(0);
        return emp;
    }

    private Position createPosition(Long id, BigDecimal baseSalary) {
        Position pos = new Position();
        pos.setId(id);
        pos.setPositionCode("POS" + id);
        pos.setPositionName("岗位" + id);
        pos.setBaseSalary(baseSalary);
        pos.setDeleted(0);
        return pos;
    }

    private PayrollItemDef createItemDef(Long id, String code, String name, String type) {
        PayrollItemDef def = new PayrollItemDef();
        def.setId(id);
        def.setCode(code);
        def.setName(name);
        def.setType(type);
        def.setIsEnabled(true);
        def.setIsSystem(true);
        return def;
    }
}
