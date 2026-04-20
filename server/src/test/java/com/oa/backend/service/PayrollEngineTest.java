package com.oa.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.entity.*;
import com.oa.backend.exception.BusinessException;
import com.oa.backend.mapper.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/** PayrollEngine 单元测试（V5 薪资构成扩展后） 覆盖：周期创建、窗口开放、预结算、结算公式（基本+岗位+绩效+补贴+临时+社保） */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("M3 - PayrollEngine")
class PayrollEngineTest {

  @InjectMocks private PayrollEngine engine;

  @Mock private PayrollCycleMapper cycleMapper;
  @Mock private PayrollSlipMapper slipMapper;
  @Mock private PayrollSlipItemMapper slipItemMapper;
  @Mock private PayrollItemDefMapper itemDefMapper;
  @Mock private EmployeeMapper employeeMapper;
  @Mock private PositionMapper positionMapper;
  @Mock private PositionLevelMapper positionLevelMapper;
  @Mock private FormRecordMapper formRecordMapper;
  @Mock private SocialInsuranceItemMapper socialInsuranceItemMapper;
  @Mock private AllowanceResolutionService allowanceResolutionService;
  @Mock private PayrollBonusService payrollBonusService;
  @Mock private ObjectMapper objectMapper;

  private static final String TEST_PERIOD = "2026-04";
  private static final Long TEST_CYCLE_ID = 1L;

  @BeforeEach
  void setUpDefaults() {
    // 默认：所有内置工资项定义都已存在（ensureItemDef 分支跳过 insert）
    when(itemDefMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);
    // 任意 code 的 selectOne 返回一个有效 def
    when(itemDefMapper.selectOne(any(LambdaQueryWrapper.class)))
        .thenAnswer(inv -> createItemDef(1L, "ANY", "任意项", "EARNING"));
    // 默认：无固定补贴、无临时补贴
    when(allowanceResolutionService.resolveForEmployee(any())).thenReturn(List.of());
    when(payrollBonusService.listApprovedByCycleEmployee(anyLong(), anyLong()))
        .thenReturn(List.of());
    when(payrollBonusService.syncFromApprovalForms(anyLong())).thenReturn(0);
    // C+-F-12: selectForUpdate 在单元测试中委托给 selectById（同等语义，无 FOR UPDATE SQL 语法）
    when(cycleMapper.selectForUpdate(anyLong()))
        .thenAnswer(inv -> cycleMapper.selectById((Long) inv.getArgument(0)));
  }

  // ─── createCycle ─────────────────────────────────────────────

  @Test
  @DisplayName("createCycle：正常创建，status=OPEN")
  void createCycle_normal() {
    when(cycleMapper.findByPeriod(TEST_PERIOD)).thenReturn(null);
    when(cycleMapper.insert(any()))
        .thenAnswer(
            inv -> {
              PayrollCycle c = inv.getArgument(0);
              c.setId(TEST_CYCLE_ID);
              return 1;
            });

    PayrollCycle result = engine.createCycle(TEST_PERIOD);

    assertEquals("OPEN", result.getStatus());
    assertEquals(TEST_PERIOD, result.getPeriod());
    assertEquals(7, result.getWindowDays());
    verify(cycleMapper).insert(any(PayrollCycle.class));
  }

  @Test
  @DisplayName("createCycle：周期重复抛异常")
  void createCycle_duplicate() {
    PayrollCycle existing = new PayrollCycle();
    existing.setId(TEST_CYCLE_ID);
    existing.setPeriod(TEST_PERIOD);
    when(cycleMapper.findByPeriod(TEST_PERIOD)).thenReturn(existing);

    IllegalStateException ex =
        assertThrows(IllegalStateException.class, () -> engine.createCycle(TEST_PERIOD));
    assertTrue(ex.getMessage().contains("已存在"));
    verify(cycleMapper, never()).insert(any());
  }

  // ─── openWindow ──────────────────────────────────────────────

  @Test
  @DisplayName("openWindow：OPEN → WINDOW_OPEN")
  void openWindow_fromOpen() {
    PayrollCycle cycle = createCycleWithStatus("OPEN");
    cycle.setWindowDays(7);
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);

    PayrollCycle result = engine.openWindow(TEST_CYCLE_ID);

    assertEquals("WINDOW_OPEN", result.getStatus());
    assertEquals("OPEN", result.getWindowStatus());
  }

  @Test
  @DisplayName("openWindow：非 OPEN 抛异常")
  void openWindow_wrongStatus() {
    PayrollCycle cycle = createCycleWithStatus("SETTLED");
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);

    assertThrows(IllegalStateException.class, () -> engine.openWindow(TEST_CYCLE_ID));
  }

  @Test
  @DisplayName("openWindow：null windowDays 使用默认 7 天")
  void openWindow_nullWindowDays_usesDefault() {
    PayrollCycle cycle = createCycleWithStatus("OPEN");
    cycle.setWindowDays(null);
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);

    PayrollCycle result = engine.openWindow(TEST_CYCLE_ID);

    assertNotNull(result.getWindowEndDate());
    assertEquals(result.getWindowStartDate().plusDays(6), result.getWindowEndDate());
  }

  // ─── precheck ────────────────────────────────────────────────

  @Test
  @DisplayName("precheck：无 PUBLISHED 且无并发 → 两项均通过")
  void precheck_allPass() {
    PayrollCycle cycle = createCycleWithStatus("OPEN");
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);
    when(slipMapper.countByStatus(TEST_CYCLE_ID, "PUBLISHED")).thenReturn(0);
    when(cycleMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

    List<PayrollEngine.PrecheckItem> result = engine.precheck(TEST_CYCLE_ID);

    assertEquals(2, result.size());
    assertTrue(result.get(0).pass());
    assertTrue(result.get(1).pass());
  }

  @Test
  @DisplayName("precheck：存在 PUBLISHED → 首项失败")
  void precheck_publishedFail() {
    PayrollCycle cycle = createCycleWithStatus("OPEN");
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);
    when(slipMapper.countByStatus(TEST_CYCLE_ID, "PUBLISHED")).thenReturn(1);
    when(cycleMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

    List<PayrollEngine.PrecheckItem> result = engine.precheck(TEST_CYCLE_ID);

    assertFalse(result.get(0).pass());
    assertTrue(result.get(1).pass());
  }

  // ─── settle：既有覆盖 ────────────────────────────────────────

  @Test
  @DisplayName("settle：已结算状态抛 BusinessException 409（C+-F-12 幂等检查）")
  void settle_requiresAllowedState() {
    PayrollCycle cycle = createCycleWithStatus("SETTLED");
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);

    // C+-F-12: SETTLED 状态现在抛出 BusinessException(409) 而非 IllegalStateException
    BusinessException ex =
        assertThrows(BusinessException.class, () -> engine.settle(TEST_CYCLE_ID));
    assertEquals(409, ex.getCode());
    assertTrue(ex.getMessage().contains("已结算"));
  }

  @Test
  @DisplayName("settle：WINDOW_CLOSED，两名员工分别生成工资条")
  void settle_windowClosed_twoEmployees() {
    PayrollCycle cycle = defaultSettleCycle();
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);
    mockPrecheckPass();

    Employee emp1 = createEmployee(1L, 10L);
    Employee emp2 = createEmployee(2L, 20L);
    when(employeeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(emp1, emp2));
    when(positionMapper.selectById(10L)).thenReturn(createPosition(10L, new BigDecimal("5000.00")));
    when(positionMapper.selectById(20L)).thenReturn(createPosition(20L, new BigDecimal("8000.00")));
    when(formRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
    mockSlipInsert();

    PayrollCycle result = engine.settle(TEST_CYCLE_ID);

    assertEquals("SETTLED", result.getStatus());
    verify(slipMapper, times(2)).insert(any(PayrollSlip.class));
  }

  @Test
  @DisplayName("settle：员工无岗位 → netPay = 0")
  void settle_employeeWithoutPosition_zero() {
    PayrollCycle cycle = defaultSettleCycle();
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);
    mockPrecheckPass();
    when(employeeMapper.selectList(any(LambdaQueryWrapper.class)))
        .thenReturn(List.of(createEmployee(1L, null)));
    when(formRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
    mockSlipInsert();

    engine.settle(TEST_CYCLE_ID);

    ArgumentCaptor<PayrollSlip> slipCap = ArgumentCaptor.forClass(PayrollSlip.class);
    verify(slipMapper).insert(slipCap.capture());
    assertEquals(0, BigDecimal.ZERO.compareTo(slipCap.getValue().getNetPay()));
  }

  @Test
  @DisplayName("settle：从 OPEN 状态可结算")
  void settle_fromOpen() {
    PayrollCycle cycle = createCycleWithStatus("OPEN");
    cycle.setStartDate(LocalDate.of(2026, 4, 1));
    cycle.setEndDate(LocalDate.of(2026, 4, 30));
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);
    mockPrecheckPass();
    when(employeeMapper.selectList(any(LambdaQueryWrapper.class)))
        .thenReturn(Collections.emptyList());

    PayrollCycle result = engine.settle(TEST_CYCLE_ID);
    assertEquals("SETTLED", result.getStatus());
  }

  // ─── settle：V5 新公式 ──────────────────────────────────────

  @Test
  @DisplayName("settle V5：基本+岗位+绩效 三项求和")
  void settle_v5_fixedComponents() {
    PayrollCycle cycle = defaultSettleCycle();
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);
    mockPrecheckPass();

    Employee emp = createEmployee(1L, 10L);
    Position pos = createPosition(10L, new BigDecimal("5000"));
    pos.setPositionSalary(new BigDecimal("2000"));
    pos.setHasPerformanceBonus(true);
    pos.setDefaultPerformanceBonus(new BigDecimal("1500"));
    when(employeeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(emp));
    when(positionMapper.selectById(10L)).thenReturn(pos);
    when(formRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
    mockSlipInsert();

    engine.settle(TEST_CYCLE_ID);

    ArgumentCaptor<PayrollSlip> slipCap = ArgumentCaptor.forClass(PayrollSlip.class);
    verify(slipMapper).insert(slipCap.capture());
    // 5000 + 2000 + 1500 = 8500
    assertEquals(0, new BigDecimal("8500").compareTo(slipCap.getValue().getNetPay()));
  }

  @Test
  @DisplayName("settle V5：岗位等级覆盖 岗位工资 + 绩效")
  void settle_v5_levelOverrides() {
    PayrollCycle cycle = defaultSettleCycle();
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);
    mockPrecheckPass();

    Employee emp = createEmployee(1L, 10L);
    emp.setLevelId(100L);
    Position pos = createPosition(10L, new BigDecimal("5000"));
    pos.setPositionSalary(new BigDecimal("2000"));
    pos.setHasPerformanceBonus(true);
    pos.setDefaultPerformanceBonus(new BigDecimal("1500"));
    PositionLevel level = new PositionLevel();
    level.setId(100L);
    level.setPositionId(10L);
    level.setPositionSalaryOverride(new BigDecimal("3000")); // 覆盖岗位工资
    level.setPerformanceBonusOverride(new BigDecimal("2500")); // 覆盖绩效
    level.setDeleted(0);

    when(employeeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(emp));
    when(positionMapper.selectById(10L)).thenReturn(pos);
    when(positionLevelMapper.selectById(100L)).thenReturn(level);
    when(formRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
    mockSlipInsert();

    engine.settle(TEST_CYCLE_ID);

    ArgumentCaptor<PayrollSlip> slipCap = ArgumentCaptor.forClass(PayrollSlip.class);
    verify(slipMapper).insert(slipCap.capture());
    // 5000 + 3000 + 2500 = 10500
    assertEquals(0, new BigDecimal("10500").compareTo(slipCap.getValue().getNetPay()));
  }

  @Test
  @DisplayName("settle V5：has_performance_bonus=false 时，绩效不计入")
  void settle_v5_performanceDisabled() {
    PayrollCycle cycle = defaultSettleCycle();
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);
    mockPrecheckPass();

    Employee emp = createEmployee(1L, 10L);
    Position pos = createPosition(10L, new BigDecimal("5000"));
    pos.setHasPerformanceBonus(false);
    pos.setDefaultPerformanceBonus(new BigDecimal("1500"));
    when(employeeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(emp));
    when(positionMapper.selectById(10L)).thenReturn(pos);
    when(formRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
    mockSlipInsert();

    engine.settle(TEST_CYCLE_ID);

    ArgumentCaptor<PayrollSlip> slipCap = ArgumentCaptor.forClass(PayrollSlip.class);
    verify(slipMapper).insert(slipCap.capture());
    // 5000 + 0 + 0 = 5000
    assertEquals(0, new BigDecimal("5000").compareTo(slipCap.getValue().getNetPay()));
  }

  @Test
  @DisplayName("settle V5：固定补贴按三级覆盖结果计入")
  void settle_v5_allowances() {
    PayrollCycle cycle = defaultSettleCycle();
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);
    mockPrecheckPass();

    Employee emp = createEmployee(1L, 10L);
    Position pos = createPosition(10L, new BigDecimal("5000"));
    when(employeeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(emp));
    when(positionMapper.selectById(10L)).thenReturn(pos);
    when(formRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

    AllowanceDef mealDef = new AllowanceDef();
    mealDef.setId(1L);
    mealDef.setCode("MEAL");
    mealDef.setName("餐补");
    mealDef.setDisplayOrder(1);
    AllowanceDef transportDef = new AllowanceDef();
    transportDef.setId(2L);
    transportDef.setCode("TRANSPORT");
    transportDef.setName("交通补");
    transportDef.setDisplayOrder(2);
    when(allowanceResolutionService.resolveForEmployee(emp))
        .thenReturn(
            List.of(
                new AllowanceResolutionService.Resolved(mealDef, new BigDecimal("500")),
                new AllowanceResolutionService.Resolved(transportDef, new BigDecimal("300"))));

    mockSlipInsert();

    engine.settle(TEST_CYCLE_ID);

    ArgumentCaptor<PayrollSlip> slipCap = ArgumentCaptor.forClass(PayrollSlip.class);
    verify(slipMapper).insert(slipCap.capture());
    // 5000 + 500 + 300 = 5800
    assertEquals(0, new BigDecimal("5800").compareTo(slipCap.getValue().getNetPay()));
  }

  @Test
  @DisplayName("settle V5：临时补贴 EARNING 增加 / DEDUCTION 扣减")
  void settle_v5_temporaryBonuses() {
    PayrollCycle cycle = defaultSettleCycle();
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);
    mockPrecheckPass();

    Employee emp = createEmployee(1L, 10L);
    Position pos = createPosition(10L, new BigDecimal("5000"));
    when(employeeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(emp));
    when(positionMapper.selectById(10L)).thenReturn(pos);
    when(formRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

    PayrollBonus earn = new PayrollBonus();
    earn.setType("EARNING");
    earn.setAmount(new BigDecimal("2000"));
    earn.setName("春节奖金");
    PayrollBonus deduct = new PayrollBonus();
    deduct.setType("DEDUCTION");
    deduct.setAmount(new BigDecimal("500"));
    deduct.setName("罚款");
    when(payrollBonusService.listApprovedByCycleEmployee(TEST_CYCLE_ID, 1L))
        .thenReturn(List.of(earn, deduct));

    mockSlipInsert();

    engine.settle(TEST_CYCLE_ID);

    ArgumentCaptor<PayrollSlip> slipCap = ArgumentCaptor.forClass(PayrollSlip.class);
    verify(slipMapper).insert(slipCap.capture());
    // 5000 + 2000 − 500 = 6500
    assertEquals(0, new BigDecimal("6500").compareTo(slipCap.getValue().getNetPay()));
  }

  @Test
  @DisplayName("settle V5：社保 COMPANY_PAID 模式 → 净额不扣，补贴项记录")
  void settle_v5_socialInsuranceCompanyPaid() {
    PayrollCycle cycle = defaultSettleCycle();
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);
    mockPrecheckPass();

    Employee emp = createEmployee(1L, 10L);
    Position pos = createPosition(10L, new BigDecimal("5000"));
    pos.setSocialInsuranceMode("COMPANY_PAID");
    when(employeeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(emp));
    when(positionMapper.selectById(10L)).thenReturn(pos);
    when(formRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

    SocialInsuranceItem si = new SocialInsuranceItem();
    si.setEmployeeRate(new BigDecimal("0.1"));
    si.setIsEnabled(true);
    si.setDeleted(0);
    when(socialInsuranceItemMapper.selectList(any(LambdaQueryWrapper.class)))
        .thenReturn(List.of(si));

    mockSlipInsert();

    engine.settle(TEST_CYCLE_ID);

    ArgumentCaptor<PayrollSlip> slipCap = ArgumentCaptor.forClass(PayrollSlip.class);
    verify(slipMapper).insert(slipCap.capture());
    // COMPANY_PAID 模式：净额不扣社保，仅 5000
    assertEquals(0, new BigDecimal("5000").compareTo(slipCap.getValue().getNetPay()));
  }

  @Test
  @DisplayName("settle V5：社保 MERGED 模式 → 净额扣个人部分")
  void settle_v5_socialInsuranceMerged() {
    PayrollCycle cycle = defaultSettleCycle();
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);
    mockPrecheckPass();

    Employee emp = createEmployee(1L, 10L);
    Position pos = createPosition(10L, new BigDecimal("5000"));
    pos.setSocialInsuranceMode("MERGED");
    when(employeeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(emp));
    when(positionMapper.selectById(10L)).thenReturn(pos);
    when(formRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

    SocialInsuranceItem si = new SocialInsuranceItem();
    si.setEmployeeRate(new BigDecimal("0.1"));
    si.setIsEnabled(true);
    si.setDeleted(0);
    when(socialInsuranceItemMapper.selectList(any(LambdaQueryWrapper.class)))
        .thenReturn(List.of(si));

    mockSlipInsert();

    engine.settle(TEST_CYCLE_ID);

    ArgumentCaptor<PayrollSlip> slipCap = ArgumentCaptor.forClass(PayrollSlip.class);
    verify(slipMapper).insert(slipCap.capture());
    // 5000 − 500 (10%) = 4500
    assertEquals(0, new BigDecimal("4500").compareTo(slipCap.getValue().getNetPay()));
  }

  // ─── autoCloseExpiredWindows ─────────────────────────────────

  @Test
  @DisplayName("autoCloseExpiredWindows：关闭所有过期窗口")
  void autoCloseExpired_multiple() {
    PayrollCycle c1 = createCycleWithStatus("WINDOW_OPEN");
    c1.setId(1L);
    c1.setWindowEndDate(LocalDate.now().minusDays(1));
    PayrollCycle c2 = createCycleWithStatus("WINDOW_OPEN");
    c2.setId(2L);
    c2.setWindowEndDate(LocalDate.now().minusDays(2));
    when(cycleMapper.findExpiredOpenWindows()).thenReturn(List.of(c1, c2));

    engine.autoCloseExpiredWindows();
    verify(cycleMapper, times(2)).updateById(any(PayrollCycle.class));
  }

  @Test
  @DisplayName("autoCloseExpiredWindows：空列表无操作")
  void autoCloseExpired_none() {
    when(cycleMapper.findExpiredOpenWindows()).thenReturn(Collections.emptyList());
    engine.autoCloseExpiredWindows();
    verify(cycleMapper, never()).updateById(any());
  }

  // ─── Edge Cases ──────────────────────────────────────────────

  @Test
  @DisplayName("createCycle：非法 period 格式抛异常")
  void createCycle_invalidPeriod() {
    assertThrows(Exception.class, () -> engine.createCycle("invalid"));
  }

  @Test
  @DisplayName("precheck：周期不存在抛异常")
  void precheck_notFound() {
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(null);
    assertThrows(IllegalStateException.class, () -> engine.precheck(TEST_CYCLE_ID));
  }

  @Test
  @DisplayName("settle：周期不存在抛异常")
  void settle_notFound() {
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(null);
    assertThrows(IllegalStateException.class, () -> engine.settle(TEST_CYCLE_ID));
  }

  @Test
  @DisplayName("settle：周期已删除抛异常")
  void settle_deleted() {
    PayrollCycle cycle = createCycleWithStatus("WINDOW_CLOSED");
    cycle.setDeleted(1);
    when(cycleMapper.selectById(TEST_CYCLE_ID)).thenReturn(cycle);
    assertThrows(IllegalStateException.class, () -> engine.settle(TEST_CYCLE_ID));
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

  private PayrollCycle defaultSettleCycle() {
    PayrollCycle c = createCycleWithStatus("WINDOW_CLOSED");
    c.setStartDate(LocalDate.of(2026, 4, 1));
    c.setEndDate(LocalDate.of(2026, 4, 30));
    return c;
  }

  private void mockPrecheckPass() {
    when(slipMapper.countByStatus(TEST_CYCLE_ID, "PUBLISHED")).thenReturn(0);
    when(cycleMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
  }

  private void mockSlipInsert() {
    when(slipMapper.insert(any()))
        .thenAnswer(
            inv -> {
              PayrollSlip slip = inv.getArgument(0);
              slip.setId(slip.getEmployeeId() == null ? 999L : slip.getEmployeeId() + 100L);
              return 1;
            });
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
