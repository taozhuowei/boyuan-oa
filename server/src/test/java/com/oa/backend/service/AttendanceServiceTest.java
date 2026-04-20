package com.oa.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.oa.backend.entity.Employee;
import com.oa.backend.mapper.EmployeeMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

/**
 * AttendanceService 单元测试
 *
 * <p>覆盖：resolveEmployeeId（三分支） + resolveRoleCode（三分支）。 SecurityUtils.getEmployeeFromUsername 内部调用
 * employeeMapper.selectOne(any())， 通过 Mock EmployeeMapper 控制返回值即可覆盖所有路径。
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AttendanceService 单元测试")
class AttendanceServiceTest {

  @InjectMocks private AttendanceService service;

  @Mock private EmployeeMapper employeeMapper;

  // ─── resolveEmployeeId ───────────────────────────────────────

  @Test
  @DisplayName("resolveEmployeeId：authentication 为 null，直接返回 null，不调用 mapper")
  void resolveEmployeeId_nullAuthentication_returnsNullWithoutMapperCall() {
    Long result = service.resolveEmployeeId(null);

    assertNull(result);
    verifyNoInteractions(employeeMapper);
  }

  @Test
  @DisplayName("resolveEmployeeId：authentication 非 null 且员工存在，返回员工 ID")
  void resolveEmployeeId_employeeFound_returnsEmployeeId() {
    Employee employee = new Employee();
    employee.setId(42L);
    employee.setEmployeeNo("employee.demo");

    Authentication authentication = mock(Authentication.class);
    when(authentication.getName()).thenReturn("employee.demo");
    when(employeeMapper.selectOne(any())).thenReturn(employee);

    Long result = service.resolveEmployeeId(authentication);

    assertEquals(42L, result);
    verify(employeeMapper).selectOne(any());
  }

  @Test
  @DisplayName("resolveEmployeeId：authentication 非 null 但员工不存在（selectOne 返回 null），返回 null")
  void resolveEmployeeId_employeeNotFound_returnsNull() {
    Authentication authentication = mock(Authentication.class);
    when(authentication.getName()).thenReturn("employee.demo");
    when(employeeMapper.selectOne(any())).thenReturn(null);

    Long result = service.resolveEmployeeId(authentication);

    assertNull(result);
    verify(employeeMapper).selectOne(any());
  }

  // ─── resolveRoleCode ─────────────────────────────────────────

  @Test
  @DisplayName("resolveRoleCode：authentication 为 null，直接返回 null，不调用 mapper")
  void resolveRoleCode_nullAuthentication_returnsNullWithoutMapperCall() {
    String result = service.resolveRoleCode(null);

    assertNull(result);
    verifyNoInteractions(employeeMapper);
  }

  @Test
  @DisplayName("resolveRoleCode：authentication 非 null 且员工存在，返回员工角色代码")
  void resolveRoleCode_employeeFound_returnsRoleCode() {
    Employee employee = new Employee();
    employee.setId(10L);
    employee.setEmployeeNo("employee.demo");
    employee.setRoleCode("employee");

    Authentication authentication = mock(Authentication.class);
    when(authentication.getName()).thenReturn("employee.demo");
    when(employeeMapper.selectOne(any())).thenReturn(employee);

    String result = service.resolveRoleCode(authentication);

    assertEquals("employee", result);
    verify(employeeMapper).selectOne(any());
  }

  @Test
  @DisplayName("resolveRoleCode：authentication 非 null 但员工不存在（selectOne 返回 null），返回 null")
  void resolveRoleCode_employeeNotFound_returnsNull() {
    Authentication authentication = mock(Authentication.class);
    when(authentication.getName()).thenReturn("employee.demo");
    when(employeeMapper.selectOne(any())).thenReturn(null);

    String result = service.resolveRoleCode(authentication);

    assertNull(result);
    verify(employeeMapper).selectOne(any());
  }
}
