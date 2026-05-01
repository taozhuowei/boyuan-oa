package com.oa.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.oa.backend.dto.EmployeeCreateRequest;
import com.oa.backend.dto.EmployeeUpdateRequest;
import com.oa.backend.entity.Employee;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.service.impl.EmployeeServiceImpl;
import java.util.Arrays;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

/** EmployeeServiceImpl 单元测试 覆盖：认证（正确密码/错误密码/账号不存在/账号禁用）、员工创建 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("M1 - EmployeeServiceImpl")
class EmployeeServiceImplTest {

  @InjectMocks private EmployeeServiceImpl service;

  @Mock private EmployeeMapper employeeMapper;

  @Mock private PasswordEncoder passwordEncoder;

  @Mock private EmployeeStatusCache employeeStatusCache;

  // ─── authenticate ────────────────────────────────────────

  @Test
  @DisplayName("authenticate：正确账号密码返回 Optional.of(employee)")
  void authenticate_validCredentials_returnsEmployee() {
    Employee emp = activeEmployee("emp.001", "hashed");
    when(employeeMapper.selectOne(any())).thenReturn(emp);
    when(passwordEncoder.matches("123456", "hashed")).thenReturn(true);

    Optional<Employee> result = service.authenticate("emp.001", "123456");

    assertTrue(result.isPresent());
    assertEquals("emp.001", result.get().getEmployeeNo());
  }

  @Test
  @DisplayName("authenticate：密码错误返回 Optional.empty()")
  void authenticate_wrongPassword_returnsEmpty() {
    Employee emp = activeEmployee("emp.001", "hashed");
    when(employeeMapper.selectOne(any())).thenReturn(emp);
    when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

    Optional<Employee> result = service.authenticate("emp.001", "wrong");

    assertTrue(result.isEmpty());
  }

  @Test
  @DisplayName("authenticate：账号不存在返回 Optional.empty()")
  void authenticate_nonExistentAccount_returnsEmpty() {
    when(employeeMapper.selectOne(any())).thenReturn(null);

    Optional<Employee> result = service.authenticate("ghost.user", "123456");

    assertTrue(result.isEmpty());
    // 账号不存在时不应调用密码校验
    verify(passwordEncoder, never()).matches(any(), any());
  }

  @Test
  @DisplayName(
      "authenticate：mapper 查询条件包含 account_status=ACTIVE 和 deleted=0（通过 ACTIVE 账号能查到，禁用账号查不到）")
  void authenticate_queryFiltersActiveAndNotDeleted() {
    // 禁用账号不会被 mapper 返回（mapper 按 ACTIVE + deleted=0 过滤）
    when(employeeMapper.selectOne(any())).thenReturn(null);

    Optional<Employee> result = service.authenticate("disabled.user", "123456");

    assertTrue(result.isEmpty());
  }

  // ─── createEmployee ──────────────────────────────────────

  @Test
  @DisplayName("createEmployee：正常创建，初始密码 123456 被 bcrypt 编码")
  void createEmployee_normal_encodesPassword() {
    when(passwordEncoder.encode("123456")).thenReturn("$bcrypt$hash");
    when(employeeMapper.insert(any())).thenReturn(1);
    // generateEmployeeNo 内部调用 selectOne 判断工号是否重复
    when(employeeMapper.selectOne(any())).thenReturn(null);

    // C+-F-16: employeeType 字段已从 EmployeeCreateRequest 移除
    EmployeeCreateRequest req =
        new EmployeeCreateRequest(
            "张三",
            "13900000099",
            null,
            "employee",
            1L,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null);

    Employee result = service.createEmployee(req);

    assertNotNull(result);
    assertEquals("$bcrypt$hash", result.getPasswordHash());
    assertTrue(result.getIsDefaultPassword());
    assertEquals("ACTIVE", result.getAccountStatus());
    verify(passwordEncoder).encode("123456");
  }

  // ─── findById ────────────────────────────────────────────

  @Test
  @DisplayName("findById：找到员工返回 Optional.of(emp)")
  void findById_found_returnsEmployee() {
    Employee emp = activeEmployee("emp.001", "hashed");
    when(employeeMapper.selectOne(any())).thenReturn(emp);

    Optional<Employee> result = service.findById(1L);

    assertTrue(result.isPresent());
    assertEquals("emp.001", result.get().getEmployeeNo());
  }

  @Test
  @DisplayName("findById：未找到员工返回 Optional.empty()")
  void findById_notFound_returnsEmpty() {
    when(employeeMapper.selectOne(any())).thenReturn(null);

    Optional<Employee> result = service.findById(999L);

    assertTrue(result.isEmpty());
  }

  // ─── findByPhone ─────────────────────────────────────────

  @Test
  @DisplayName("findByPhone：找到员工返回 Optional.of(emp)")
  void findByPhone_found_returnsEmployee() {
    Employee emp = activeEmployee("emp.001", "hashed");
    emp.setPhone("13900000001");
    when(employeeMapper.selectOne(any())).thenReturn(emp);

    Optional<Employee> result = service.findByPhone("13900000001");

    assertTrue(result.isPresent());
    assertEquals("13900000001", result.get().getPhone());
  }

  @Test
  @DisplayName("findByPhone：未找到员工返回 Optional.empty()")
  void findByPhone_notFound_returnsEmpty() {
    when(employeeMapper.selectOne(any())).thenReturn(null);

    Optional<Employee> result = service.findByPhone("13999999999");

    assertTrue(result.isEmpty());
  }

  // ─── listEmployees ───────────────────────────────────────

  @Test
  @DisplayName("listEmployees：正常调用 keyword=null 返回 IPage 结果")
  void listEmployees_normal_returnsIPage() {
    Employee emp1 = activeEmployee("emp.001", "hash1");
    Employee emp2 = activeEmployee("emp.002", "hash2");
    Page<Employee> pageResult = new Page<>();
    pageResult.setRecords(Arrays.asList(emp1, emp2));
    pageResult.setTotal(2);
    when(employeeMapper.selectPage(any(Page.class), any())).thenReturn(pageResult);

    // C+-F-16: employeeType 参数已移除（原7参数→6参数）
    IPage<Employee> result = service.listEmployees(1, 10, null, null, null, null);

    assertNotNull(result);
    assertEquals(2, result.getTotal());
    assertEquals(2, result.getRecords().size());
  }

  // ─── updateEmployee ──────────────────────────────────────

  @Test
  @DisplayName("updateEmployee：成功更新 name/phone/roleCode/positionId")
  void updateEmployee_success_updatesFields() {
    Employee emp = activeEmployee("emp.001", "hashed");
    when(employeeMapper.selectOne(any())).thenReturn(emp);
    when(employeeMapper.updateById(any())).thenReturn(1);

    // C+-F-16: employeeType 字段已从 EmployeeUpdateRequest 移除（原20参数→19参数）
    EmployeeUpdateRequest req =
        new EmployeeUpdateRequest(
            "新名字",
            "13900001111",
            null,
            "admin",
            null,
            2L,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null);

    Employee result = service.updateEmployee(1L, req);

    assertEquals("新名字", result.getName());
    assertEquals("13900001111", result.getPhone());
    assertEquals("admin", result.getRoleCode());
    assertEquals(2L, result.getPositionId());
    verify(employeeMapper).updateById(emp);
  }

  @Test
  @DisplayName("updateEmployee：员工不存在抛出 IllegalArgumentException")
  void updateEmployee_notFound_throwsException() {
    when(employeeMapper.selectOne(any())).thenReturn(null);

    // C+-F-16: employeeType 字段已移除，19 参数
    EmployeeUpdateRequest req =
        new EmployeeUpdateRequest(
            "新名字", null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null);

    assertThrows(IllegalArgumentException.class, () -> service.updateEmployee(999L, req));
  }

  @Test
  @DisplayName("updateEmployee：已删除员工抛出 IllegalArgumentException")
  void updateEmployee_deleted_throwsException() {
    when(employeeMapper.selectOne(any())).thenReturn(null);

    // C+-F-16: employeeType 字段已移除，19 参数
    EmployeeUpdateRequest req =
        new EmployeeUpdateRequest(
            "新名字", null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null);

    assertThrows(IllegalArgumentException.class, () -> service.updateEmployee(1L, req));
  }

  // ─── deleteEmployee ──────────────────────────────────────

  @Test
  @DisplayName("deleteEmployee：调用 updateById 设置 deleted=1")
  void deleteEmployee_success_setsDeleted() {
    Employee emp = activeEmployee("emp.001", "hashed");
    when(employeeMapper.selectOne(any())).thenReturn(emp);
    when(employeeMapper.updateById(any())).thenReturn(1);

    service.deleteEmployee(1L);

    assertEquals(1, emp.getDeleted());
    verify(employeeMapper).updateById(emp);
  }

  @Test
  @DisplayName("deleteEmployee：员工不存在抛出 IllegalArgumentException")
  void deleteEmployee_notFound_throwsException() {
    when(employeeMapper.selectOne(any())).thenReturn(null);

    assertThrows(IllegalArgumentException.class, () -> service.deleteEmployee(999L));
  }

  // ─── generateEmployeeNo ──────────────────────────────────

  @Test
  @DisplayName("generateEmployeeNo：返回 EMP 前缀的唯一字符串")
  void generateEmployeeNo_returnsEmpPrefixedString() {
    when(employeeMapper.selectOne(any())).thenReturn(null);

    String result = service.generateEmployeeNo();

    assertNotNull(result);
    assertTrue(result.startsWith("EMP"));
  }

  @Test
  @DisplayName("generateEmployeeNo：基于现有最大序号生成下一个工号")
  void generateEmployeeNo_generatesNextSequence() {
    Employee existing = new Employee();
    existing.setEmployeeNo("EMP2026040005");
    when(employeeMapper.selectOne(any())).thenReturn(existing);

    String result = service.generateEmployeeNo();

    assertNotNull(result);
    assertTrue(result.startsWith("EMP202604"));
    // 应生成 0006（0005 + 1）
    assertTrue(result.endsWith("0006"));
  }

  // ─── updateAccountStatus ─────────────────────────────────

  @Test
  @DisplayName("updateAccountStatus：成功更新状态字段")
  void updateAccountStatus_success_updatesStatus() {
    Employee emp = activeEmployee("emp.001", "hashed");
    when(employeeMapper.selectOne(any())).thenReturn(emp);
    when(employeeMapper.updateById(any())).thenReturn(1);

    Employee result = service.updateAccountStatus(1L, "DISABLED");

    assertEquals("DISABLED", result.getAccountStatus());
    verify(employeeMapper).updateById(emp);
  }

  @Test
  @DisplayName("updateAccountStatus：员工不存在抛出 IllegalArgumentException")
  void updateAccountStatus_notFound_throwsException() {
    when(employeeMapper.selectOne(any())).thenReturn(null);

    assertThrows(
        IllegalArgumentException.class, () -> service.updateAccountStatus(999L, "DISABLED"));
  }

  // ─── resetPassword ───────────────────────────────────────

  @Test
  @DisplayName("resetPassword：调用 passwordEncoder.encode('123456') 并设置 isDefaultPassword=true")
  void resetPassword_success_encodesAndSetsDefault() {
    Employee emp = activeEmployee("emp.001", "oldhash");
    when(employeeMapper.selectOne(any())).thenReturn(emp);
    when(passwordEncoder.encode("123456")).thenReturn("$new$hash");
    when(employeeMapper.updateById(any())).thenReturn(1);

    service.resetPassword(1L);

    assertEquals("$new$hash", emp.getPasswordHash());
    assertTrue(emp.getIsDefaultPassword());
    verify(passwordEncoder).encode("123456");
    verify(employeeMapper).updateById(emp);
  }

  // ─── updatePassword ──────────────────────────────────────

  @Test
  @DisplayName("updatePassword：调用 passwordEncoder.encode 并更新密码")
  void updatePassword_success_encodesAndUpdates() {
    Employee emp = activeEmployee("emp.001", "oldhash");
    when(employeeMapper.selectById(1L)).thenReturn(emp);
    when(passwordEncoder.encode("newpass")).thenReturn("$new$hash");
    when(employeeMapper.updateById(any())).thenReturn(1);

    service.updatePassword(1L, "$new$hash", false);

    assertEquals("$new$hash", emp.getPasswordHash());
    assertFalse(emp.getIsDefaultPassword());
    verify(employeeMapper).updateById(emp);
  }

  @Test
  @DisplayName("updatePassword：设置 isDefaultPassword 基于参数")
  void updatePassword_setsIsDefaultPasswordBasedOnParam() {
    Employee emp = activeEmployee("emp.001", "oldhash");
    when(employeeMapper.selectById(1L)).thenReturn(emp);
    when(employeeMapper.updateById(any())).thenReturn(1);

    service.updatePassword(1L, "newhash", true);

    assertTrue(emp.getIsDefaultPassword());
  }

  // ─── updatePhone ─────────────────────────────────────────

  @Test
  @DisplayName("updatePhone：调用 updateById 更新手机号")
  void updatePhone_success_updatesPhone() {
    Employee emp = activeEmployee("emp.001", "hashed");
    emp.setPhone("13900000001");
    when(employeeMapper.selectOne(any())).thenReturn(emp);
    when(employeeMapper.updateById(any())).thenReturn(1);

    service.updatePhone(1L, "13900002222");

    assertEquals("13900002222", emp.getPhone());
    verify(employeeMapper).updateById(emp);
  }

  // ─── helpers ─────────────────────────────────────────────

  private Employee activeEmployee(String no, String hash) {
    Employee e = new Employee();
    e.setId(1L);
    e.setEmployeeNo(no);
    e.setPasswordHash(hash);
    e.setAccountStatus("ACTIVE");
    e.setDeleted(0);
    e.setRoleCode("employee");
    e.setEmployeeType("OFFICE");
    return e;
  }
}
