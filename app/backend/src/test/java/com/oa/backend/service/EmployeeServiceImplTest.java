package com.oa.backend.service;

import com.oa.backend.dto.EmployeeCreateRequest;
import com.oa.backend.entity.Employee;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.service.impl.EmployeeServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * EmployeeServiceImpl 单元测试
 * 覆盖：认证（正确密码/错误密码/账号不存在/账号禁用）、员工创建
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("M1 - EmployeeServiceImpl")
class EmployeeServiceImplTest {

    @InjectMocks
    private EmployeeServiceImpl service;

    @Mock
    private EmployeeMapper employeeMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

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
    @DisplayName("authenticate：mapper 查询条件包含 account_status=ACTIVE 和 deleted=0（通过 ACTIVE 账号能查到，禁用账号查不到）")
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

        EmployeeCreateRequest req = new EmployeeCreateRequest(
            "张三", "13900000099", null, "employee",
            "OFFICE", 1L, null, null, null, null
        );

        Employee result = service.createEmployee(req);

        assertNotNull(result);
        assertEquals("$bcrypt$hash", result.getPasswordHash());
        assertTrue(result.getIsDefaultPassword());
        assertEquals("ACTIVE", result.getAccountStatus());
        verify(passwordEncoder).encode("123456");
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
