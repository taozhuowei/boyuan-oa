package com.oa.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.oa.backend.dto.ExpenseClaimResponse;
import com.oa.backend.dto.ExpenseItemDto;
import com.oa.backend.dto.ExpenseSubmitRequest;
import com.oa.backend.dto.ExpenseTypeResponse;
import com.oa.backend.dto.FormRecordResponse;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.ExpenseClaim;
import com.oa.backend.entity.ExpenseItem;
import com.oa.backend.entity.ExpenseTypeDef;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.ExpenseClaimMapper;
import com.oa.backend.mapper.ExpenseItemMapper;
import com.oa.backend.mapper.ExpenseTypeDefMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

/** ExpenseService 单元测试 覆盖：费用类型查询、用户名解析（ID/角色）、报销详情、提交（含明细/无明细/JSON 序列化失败）、我的报销列表 */
@ExtendWith(MockitoExtension.class)
@DisplayName("M9 - ExpenseService")
class ExpenseServiceTest {

  @InjectMocks private ExpenseService service;

  @Mock private ExpenseClaimMapper expenseClaimMapper;

  @Mock private ExpenseItemMapper expenseItemMapper;

  @Mock private ExpenseTypeDefMapper expenseTypeDefMapper;

  @Mock private EmployeeMapper employeeMapper;

  @Mock private FormService formService;

  // Real ObjectMapper with JavaTimeModule — supports LocalDate/LocalDateTime in request records.
  // Declared as @Spy so individual tests can inject failures via doThrow().
  @Spy private ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

  @BeforeEach
  void setUp() {
    // Re-inject the spy (with JavaTimeModule) into the service after Mockito initialises mocks.
    org.springframework.test.util.ReflectionTestUtils.setField(
        service, "objectMapper", objectMapper);
  }

  // ─── getExpenseTypes ─────────────────────────────────────────

  @Test
  @DisplayName("getExpenseTypes：findAllEnabled 返回列表，DTO 字段正确映射")
  void getExpenseTypes_returnsMappedDtos() {
    ExpenseTypeDef def = new ExpenseTypeDef();
    def.setId(1L);
    def.setCode("TRAVEL");
    def.setName("差旅费");
    def.setDescription("出差相关费用");
    def.setRequireInvoice(true);
    def.setDailyLimit(new BigDecimal("500"));
    def.setDisplayOrder(1);
    when(expenseTypeDefMapper.findAllEnabled()).thenReturn(List.of(def));

    List<ExpenseTypeResponse> result = service.getExpenseTypes();

    assertNotNull(result);
    assertEquals(1, result.size());
    ExpenseTypeResponse dto = result.get(0);
    assertEquals(1L, dto.id());
    assertEquals("TRAVEL", dto.code());
    assertEquals("差旅费", dto.name());
    assertEquals("出差相关费用", dto.description());
    assertTrue(dto.requireInvoice());
    assertEquals(new BigDecimal("500"), dto.dailyLimit());
    assertEquals(1, dto.displayOrder());
    verify(expenseTypeDefMapper).findAllEnabled();
  }

  // ─── resolveEmployeeIdByUsername ─────────────────────────────

  @Test
  @DisplayName("resolveEmployeeIdByUsername：username 为 null 直接返回 null，不调用 mapper")
  void resolveEmployeeIdByUsername_nullInput_returnsNull() {
    Long result = service.resolveEmployeeIdByUsername(null);

    assertNull(result);
    verifyNoInteractions(employeeMapper);
  }

  @Test
  @DisplayName("resolveEmployeeIdByUsername：员工找到时返回 employee.getId()")
  void resolveEmployeeIdByUsername_employeeFound_returnsId() {
    Employee emp = new Employee();
    emp.setId(7L);
    emp.setEmployeeNo("emp.demo");
    when(employeeMapper.selectOne(any())).thenReturn(emp);

    Long result = service.resolveEmployeeIdByUsername("emp.demo");

    assertEquals(7L, result);
    verify(employeeMapper).selectOne(any());
  }

  @Test
  @DisplayName("resolveEmployeeIdByUsername：员工不存在（selectOne 返回 null）返回 null")
  void resolveEmployeeIdByUsername_employeeNotFound_returnsNull() {
    when(employeeMapper.selectOne(any())).thenReturn(null);

    Long result = service.resolveEmployeeIdByUsername("unknown");

    assertNull(result);
    verify(employeeMapper).selectOne(any());
  }

  // ─── resolveRoleCodeByUsername ───────────────────────────────

  @Test
  @DisplayName("resolveRoleCodeByUsername：username 为 null 直接返回 null，不调用 mapper")
  void resolveRoleCodeByUsername_nullInput_returnsNull() {
    String result = service.resolveRoleCodeByUsername(null);

    assertNull(result);
    verifyNoInteractions(employeeMapper);
  }

  @Test
  @DisplayName("resolveRoleCodeByUsername：员工找到时返回 employee.getRoleCode()")
  void resolveRoleCodeByUsername_employeeFound_returnsRoleCode() {
    Employee emp = new Employee();
    emp.setId(3L);
    emp.setRoleCode("employee");
    when(employeeMapper.selectOne(any())).thenReturn(emp);

    String result = service.resolveRoleCodeByUsername("emp.demo");

    assertEquals("employee", result);
    verify(employeeMapper).selectOne(any());
  }

  @Test
  @DisplayName("resolveRoleCodeByUsername：员工不存在时返回 null")
  void resolveRoleCodeByUsername_employeeNotFound_returnsNull() {
    when(employeeMapper.selectOne(any())).thenReturn(null);

    String result = service.resolveRoleCodeByUsername("ghost");

    assertNull(result);
  }

  // ─── getExpenseDetail ────────────────────────────────────────

  @Test
  @DisplayName("getExpenseDetail：findByFormId 返回 null 时抛出 IllegalStateException")
  void getExpenseDetail_claimNotFound_throwsIllegalStateException() {
    // formService.getDetail succeeds (returns a valid response)
    FormRecordResponse formResponse =
        new FormRecordResponse(
            1L,
            "EXP-001",
            "EXPENSE",
            "报销",
            "emp",
            "技术部",
            LocalDateTime.now(),
            "PENDING",
            "审批中",
            Map.of(),
            List.of(),
            null);
    when(formService.getDetail(1L, 10L)).thenReturn(formResponse);
    when(expenseClaimMapper.findByFormId(1L)).thenReturn(null);

    IllegalStateException ex =
        assertThrows(IllegalStateException.class, () -> service.getExpenseDetail(1L, 10L));
    assertTrue(ex.getMessage().contains("报销记录不存在"));
  }

  @Test
  @DisplayName("getExpenseDetail：claim 存在且员工存在时返回含 employeeName 的完整响应")
  void getExpenseDetail_claimAndEmployeeFound_returnsFullResponse() {
    FormRecordResponse formResponse =
        new FormRecordResponse(
            5L,
            "EXP-005",
            "EXPENSE",
            "报销",
            "emp",
            "技术部",
            LocalDateTime.now(),
            "APPROVED",
            "已完成",
            Map.of(),
            List.of(),
            null);
    when(formService.getDetail(5L, 10L)).thenReturn(formResponse);

    ExpenseClaim claim = new ExpenseClaim();
    claim.setId(20L);
    claim.setFormId(5L);
    claim.setEmployeeId(10L);
    claim.setExpenseType("TRAVEL");
    claim.setTotalAmount(new BigDecimal("1200"));
    claim.setIncludedInPayroll(false);
    claim.setCreatedAt(LocalDateTime.now());
    when(expenseClaimMapper.findByFormId(5L)).thenReturn(claim);
    when(expenseItemMapper.findByExpenseClaimId(20L)).thenReturn(List.of());

    Employee emp = new Employee();
    emp.setId(10L);
    emp.setName("张三");
    when(employeeMapper.selectById(10L)).thenReturn(emp);

    ExpenseClaimResponse result = service.getExpenseDetail(5L, 10L);

    assertNotNull(result);
    assertEquals("张三", result.employeeName());
    assertEquals("差旅费", result.expenseTypeName());
    assertEquals(new BigDecimal("1200"), result.totalAmount());
  }

  @Test
  @DisplayName("getExpenseDetail：claim 存在但员工为 null 时 employeeName 为空字符串")
  void getExpenseDetail_claimFoundEmployeeNull_employeeNameIsEmpty() {
    FormRecordResponse formResponse =
        new FormRecordResponse(
            6L,
            "EXP-006",
            "EXPENSE",
            "报销",
            "emp",
            "技术部",
            LocalDateTime.now(),
            "PENDING",
            "审批中",
            Map.of(),
            List.of(),
            null);
    when(formService.getDetail(6L, 11L)).thenReturn(formResponse);

    ExpenseClaim claim = new ExpenseClaim();
    claim.setId(21L);
    claim.setFormId(6L);
    claim.setEmployeeId(11L);
    claim.setExpenseType("MEAL");
    claim.setTotalAmount(new BigDecimal("300"));
    claim.setIncludedInPayroll(false);
    claim.setCreatedAt(LocalDateTime.now());
    when(expenseClaimMapper.findByFormId(6L)).thenReturn(claim);
    when(expenseItemMapper.findByExpenseClaimId(21L)).thenReturn(List.of());
    when(employeeMapper.selectById(11L)).thenReturn(null);

    ExpenseClaimResponse result = service.getExpenseDetail(6L, 11L);

    assertNotNull(result);
    assertEquals("", result.employeeName());
  }

  // ─── submitExpense ───────────────────────────────────────────

  @Test
  @DisplayName("submitExpense：items 为 null 时不调用 expenseItemMapper.insert")
  void submitExpense_nullItems_noItemInserted() {
    ExpenseSubmitRequest request =
        new ExpenseSubmitRequest(
            "TRAVEL",
            null,
            null,
            null,
            null,
            new BigDecimal("500"),
            null,
            null,
            null,
            null /* items = null */);

    FormRecordResponse formResponse =
        new FormRecordResponse(
            100L,
            "EXP-100",
            "EXPENSE",
            "报销",
            "emp",
            "技术部",
            LocalDateTime.now(),
            "PENDING",
            "审批中",
            Map.of(),
            List.of(),
            null);
    when(formService.submitForm(eq(1L), eq("EXPENSE"), anyString(), any(), any()))
        .thenReturn(formResponse);
    when(expenseClaimMapper.insert(any())).thenReturn(1);
    when(formService.getDetail(100L, 1L)).thenReturn(formResponse);

    service.submitExpense(1L, request);

    verify(expenseItemMapper, never()).insert(any());
  }

  @Test
  @DisplayName("submitExpense：items 非空时每条明细调用一次 expenseItemMapper.insert")
  void submitExpense_withItems_insertsEachItem() {
    ExpenseItemDto item1 =
        new ExpenseItemDto(
            null, "TRANSPORT", LocalDate.now(), new BigDecimal("100"), null, "地铁", null);
    ExpenseItemDto item2 =
        new ExpenseItemDto(
            null, "MEAL", LocalDate.now(), new BigDecimal("80"), "INV-001", "工作餐", null);
    ExpenseSubmitRequest request =
        new ExpenseSubmitRequest(
            "TRAVEL",
            LocalDate.now(),
            LocalDate.now(),
            "北京",
            "项目会议",
            new BigDecimal("180"),
            null,
            null,
            null,
            List.of(item1, item2));

    FormRecordResponse formResponse =
        new FormRecordResponse(
            200L,
            "EXP-200",
            "EXPENSE",
            "报销",
            "emp",
            "技术部",
            LocalDateTime.now(),
            "PENDING",
            "审批中",
            Map.of(),
            List.of(),
            null);
    when(formService.submitForm(eq(2L), eq("EXPENSE"), anyString(), any(), any()))
        .thenReturn(formResponse);
    when(expenseClaimMapper.insert(any())).thenReturn(1);
    when(formService.getDetail(200L, 2L)).thenReturn(formResponse);

    service.submitExpense(2L, request);

    // One insert per item
    verify(expenseItemMapper, times(2)).insert(any(ExpenseItem.class));
  }

  @Test
  @DisplayName("submitExpense：ObjectMapper 序列化失败时抛出 RuntimeException")
  void submitExpense_jsonSerializationFailure_throwsRuntimeException()
      throws JsonProcessingException {
    ExpenseSubmitRequest request =
        new ExpenseSubmitRequest(
            "TRAVEL", null, null, null, null, new BigDecimal("100"), null, null, null, List.of());

    // Force ObjectMapper to throw JsonProcessingException
    doThrow(new com.fasterxml.jackson.core.JsonParseException(null, "forced"))
        .when(objectMapper)
        .writeValueAsString(any());

    assertThrows(RuntimeException.class, () -> service.submitExpense(1L, request));

    // Confirm no downstream calls were made
    verifyNoInteractions(formService);
    verifyNoInteractions(expenseClaimMapper);
    verifyNoInteractions(expenseItemMapper);
  }

  // ─── getMyExpenses ───────────────────────────────────────────

  @Test
  @DisplayName("getMyExpenses：委托给 formService.getHistory，返回其结果")
  void getMyExpenses_delegatesToFormService() {
    FormRecordResponse r1 =
        new FormRecordResponse(
            1L,
            "EXP-001",
            "EXPENSE",
            "报销",
            "emp",
            "技术部",
            LocalDateTime.now(),
            "APPROVED",
            "已完成",
            Map.of(),
            List.of(),
            null);
    when(formService.getHistory(eq(5L), eq("employee"), eq(List.of("EXPENSE"))))
        .thenReturn(List.of(r1));

    List<FormRecordResponse> result = service.getMyExpenses(5L, "employee");

    assertEquals(1, result.size());
    assertEquals(1L, result.get(0).id());
    verify(formService).getHistory(5L, "employee", List.of("EXPENSE"));
  }
}
