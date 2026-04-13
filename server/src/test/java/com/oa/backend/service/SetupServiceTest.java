package com.oa.backend.service;

import com.oa.backend.entity.Employee;
import com.oa.backend.entity.Role;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.RoleMapper;
import com.oa.backend.mapper.SystemConfigMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * SetupService 单元测试
 * 覆盖：初始化状态检查、系统初始化、恢复码管理、CEO密码重置
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("M3 - SetupService")
class SetupServiceTest {

    @InjectMocks
    private SetupService setupService;

    @Mock
    private SystemConfigMapper systemConfigMapper;

    @Mock
    private EmployeeMapper employeeMapper;

    @Mock
    private RoleMapper roleMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    // ─── isInitialized ────────────────────────────────────────────

    @Test
    @DisplayName("isInitialized: returns true when config value is 'true'")
    void isInitialized_whenTrue() {
        when(systemConfigMapper.getValue("initialized")).thenReturn("true");

        boolean result = setupService.isInitialized();

        assertTrue(result);
        verify(systemConfigMapper).getValue("initialized");
    }

    @Test
    @DisplayName("isInitialized: returns false when config value is 'false'")
    void isInitialized_whenFalse() {
        when(systemConfigMapper.getValue("initialized")).thenReturn("false");

        boolean result = setupService.isInitialized();

        assertFalse(result);
    }

    @Test
    @DisplayName("isInitialized: returns false when config value is null")
    void isInitialized_whenNull() {
        when(systemConfigMapper.getValue("initialized")).thenReturn(null);

        boolean result = setupService.isInitialized();

        assertFalse(result);
    }

    @Test
    @DisplayName("isInitialized: returns false when config value is empty")
    void isInitialized_whenEmpty() {
        when(systemConfigMapper.getValue("initialized")).thenReturn("");

        boolean result = setupService.isInitialized();

        assertFalse(result);
    }

    @Test
    @DisplayName("isInitialized: returns false for any non-true value")
    void isInitialized_whenOther() {
        when(systemConfigMapper.getValue("initialized")).thenReturn("yes");

        boolean result = setupService.isInitialized();

        assertFalse(result);
    }

    // ─── initialize ───────────────────────────────────────────────

    @Test
    @DisplayName("initialize: creates CEO and HR, returns SetupResult with recovery code")
    void initialize_success() {
        // Setup - not initialized
        when(systemConfigMapper.getValue("initialized")).thenReturn(null);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        
        // Employee insert mocks - simulate ID generation
        when(employeeMapper.insert(any())).thenAnswer(inv -> {
            Employee emp = inv.getArgument(0);
            emp.setId(emp.getEmployeeNo().equals("CEO001") ? 1L : 2L);
            return 1;
        });

        // Role doesn't exist
        when(roleMapper.selectOne(any())).thenReturn(null);
        when(roleMapper.insert(any())).thenAnswer(inv -> {
            Role role = inv.getArgument(0);
            role.setId(role.getRoleCode().equals("ceo") ? 10L : 20L);
            return 1;
        });

        // Execute
        SetupService.SetupRequest request = new SetupService.SetupRequest(
                "CEO Name", "13800138000", "password123",
                "HR Name", "13800138001",
                null, null, null, null, null
        );

        SetupService.SetupResult result = setupService.initialize(request);

        // Verify
        assertNotNull(result);
        assertNotNull(result.recoveryCode());
        assertEquals(32, result.recoveryCode().length()); // UUID without dashes, first 32 chars
        assertEquals("系统初始化成功", result.message());

        // Verify CEO created
        ArgumentCaptor<Employee> empCaptor = ArgumentCaptor.forClass(Employee.class);
        verify(employeeMapper, times(2)).insert(empCaptor.capture());
        List<Employee> employees = empCaptor.getAllValues();
        
        Employee ceo = employees.get(0);
        assertEquals("CEO001", ceo.getEmployeeNo());
        assertEquals("CEO Name", ceo.getName());
        assertEquals("13800138000", ceo.getPhone());
        assertEquals("ceo", ceo.getRoleCode());
        assertEquals("ACTIVE", ceo.getAccountStatus());
        assertFalse(ceo.getIsDefaultPassword());

        // Verify HR created
        Employee hr = employees.get(1);
        assertEquals("HR001", hr.getEmployeeNo());
        assertEquals("HR Name", hr.getName());
        assertEquals("13800138001", hr.getPhone());
        assertEquals("hr", hr.getRoleCode());
        assertTrue(hr.getIsDefaultPassword());

        // Verify roles created
        verify(roleMapper, times(2)).insert(any(Role.class));

        // Verify config updated
        verify(systemConfigMapper).setValue("initialized", "true", "系统初始化状态");
        verify(systemConfigMapper).setValue(eq("initialized_at"), anyString(), eq("系统初始化时间"));
        verify(systemConfigMapper).setValue(eq("recovery_code_hash"), anyString(), anyString());
    }

    @Test
    @DisplayName("initialize: creates optional OPS and GM accounts when provided")
    void initialize_withOptionalAccounts() {
        when(systemConfigMapper.getValue("initialized")).thenReturn(null);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(employeeMapper.insert(any())).thenAnswer(inv -> {
            Employee emp = inv.getArgument(0);
            switch (emp.getEmployeeNo()) {
                case "CEO001" -> emp.setId(1L);
                case "HR001" -> emp.setId(2L);
                case "OPS001" -> emp.setId(3L);
                case "GM001" -> emp.setId(4L);
            }
            return 1;
        });
        when(roleMapper.selectOne(any())).thenReturn(null);
        when(roleMapper.insert(any())).thenReturn(1);

        SetupService.SetupRequest request = new SetupService.SetupRequest(
                "CEO", "13800000001", "password123",
                "HR", "13800000002",
                "OPS", "13800000003",
                "GM", "13800000004",
                null
        );

        SetupService.SetupResult result = setupService.initialize(request);

        assertNotNull(result);
        verify(employeeMapper, times(4)).insert(any(Employee.class));
        verify(roleMapper, times(4)).insert(any(Role.class));
    }

    @Test
    @DisplayName("initialize: creates custom roles when provided")
    void initialize_withCustomRoles() {
        when(systemConfigMapper.getValue("initialized")).thenReturn(null);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(employeeMapper.insert(any())).thenAnswer(inv -> {
            Employee emp = inv.getArgument(0);
            emp.setId(emp.getEmployeeNo().equals("CEO001") ? 1L : 2L);
            return 1;
        });
        when(roleMapper.selectOne(any())).thenReturn(null);
        when(roleMapper.insert(any())).thenReturn(1);

        List<SetupService.CustomRoleRequest> customRoles = java.util.Arrays.asList(
                new SetupService.CustomRoleRequest("manager", "经理", "部门经理"),
                new SetupService.CustomRoleRequest("staff", "员工", "普通员工")
        );

        SetupService.SetupRequest request = new SetupService.SetupRequest(
                "CEO", "13800000001", "password123",
                "HR", "13800000002",
                null, null, null, null,
                customRoles
        );

        SetupService.SetupResult result = setupService.initialize(request);

        assertNotNull(result);
        // 2 system roles (ceo, hr) + 2 custom roles
        verify(roleMapper, times(4)).insert(any(Role.class));
        
        ArgumentCaptor<Role> roleCaptor = ArgumentCaptor.forClass(Role.class);
        verify(roleMapper, times(4)).insert(roleCaptor.capture());
        
        java.util.List<Role> roles = roleCaptor.getAllValues();
        Role customRole1 = roles.stream().filter(r -> "manager".equals(r.getRoleCode())).findFirst().orElse(null);
        assertNotNull(customRole1);
        assertEquals("经理", customRole1.getRoleName());
        assertEquals("部门经理", customRole1.getDescription());
        assertEquals(0, customRole1.getIsSystem());
    }

    @Test
    @DisplayName("initialize: skips invalid custom roles")
    void initialize_skipsInvalidCustomRoles() {
        when(systemConfigMapper.getValue("initialized")).thenReturn(null);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(employeeMapper.insert(any())).thenAnswer(inv -> {
            Employee emp = inv.getArgument(0);
            emp.setId(emp.getEmployeeNo().equals("CEO001") ? 1L : 2L);
            return 1;
        });
        when(roleMapper.selectOne(any())).thenReturn(null);
        when(roleMapper.insert(any())).thenReturn(1);

        java.util.List<SetupService.CustomRoleRequest> customRoles = java.util.Arrays.asList(
                new SetupService.CustomRoleRequest("", "", "Invalid"),
                new SetupService.CustomRoleRequest("valid", "有效", "有效角色")
        );

        SetupService.SetupRequest request = new SetupService.SetupRequest(
                "CEO", "13800000001", "password123",
                "HR", "13800000002",
                null, null, null, null,
                customRoles
        );

        setupService.initialize(request);

        // 2 system roles + 1 valid custom role
        verify(roleMapper, times(3)).insert(any(Role.class));
    }

    @Test
    @DisplayName("initialize: throws exception when already initialized")
    void initialize_alreadyInitialized() {
        when(systemConfigMapper.getValue("initialized")).thenReturn("true");

        SetupService.SetupRequest request = new SetupService.SetupRequest(
                "CEO", "13800000001", "password123",
                "HR", "13800000002",
                null, null, null, null, null
        );

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> setupService.initialize(request));

        assertTrue(ex.getMessage().contains("已初始化"));
        verify(employeeMapper, never()).insert(any());
    }

    @Test
    @DisplayName("initialize: throws exception when request is null")
    void initialize_nullRequest() {
        // No stubbing needed - null check happens before mapper call

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> setupService.initialize(null));

        assertTrue(ex.getMessage().contains("不能为空"));
    }

    @Test
    @DisplayName("initialize: throws exception when CEO password too short")
    void initialize_shortPassword() {
        when(systemConfigMapper.getValue("initialized")).thenReturn(null);

        SetupService.SetupRequest request = new SetupService.SetupRequest(
                "CEO", "13800000001", "short",
                "HR", "13800000002",
                null, null, null, null, null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> setupService.initialize(request));

        assertTrue(ex.getMessage().contains("密码长度"));
    }

    @Test
    @DisplayName("initialize: throws exception when required fields missing")
    void initialize_missingFields() {
        when(systemConfigMapper.getValue("initialized")).thenReturn(null);

        SetupService.SetupRequest request = new SetupService.SetupRequest(
                "", "13800000001", "password123",
                "HR", "13800000002",
                null, null, null, null, null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> setupService.initialize(request));

        assertTrue(ex.getMessage().contains("不能为空"));
    }

    // ─── resetForDev ──────────────────────────────────────────────

    @Test
    @DisplayName("resetForDev: updates initialized to false")
    void resetForDev_success() {
        setupService.resetForDev();

        verify(systemConfigMapper).updateValue("initialized", "false");
    }

    // ─── verifyAndRotateRecoveryCode ──────────────────────────────

    @Test
    @DisplayName("verifyAndRotateRecoveryCode: returns new code when valid")
    void verifyAndRotateRecoveryCode_success() {
        when(systemConfigMapper.getValue("recovery_code_hash")).thenReturn("stored_hash");
        when(passwordEncoder.matches("valid_code", "stored_hash")).thenReturn(true);
        when(passwordEncoder.encode(anyString())).thenReturn("new_hash");

        String newCode = setupService.verifyAndRotateRecoveryCode("valid_code");

        assertNotNull(newCode);
        assertEquals(32, newCode.length());
        verify(systemConfigMapper).updateValue(eq("recovery_code_hash"), eq("new_hash"));
    }

    @Test
    @DisplayName("verifyAndRotateRecoveryCode: throws exception when code is null")
    void verifyAndRotateRecoveryCode_nullCode() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> setupService.verifyAndRotateRecoveryCode(null));

        assertTrue(ex.getMessage().contains("不能为空"));
    }

    @Test
    @DisplayName("verifyAndRotateRecoveryCode: throws exception when code is blank")
    void verifyAndRotateRecoveryCode_blankCode() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> setupService.verifyAndRotateRecoveryCode("   "));

        assertTrue(ex.getMessage().contains("不能为空"));
    }

    @Test
    @DisplayName("verifyAndRotateRecoveryCode: throws exception when hash not set")
    void verifyAndRotateRecoveryCode_noHash() {
        when(systemConfigMapper.getValue("recovery_code_hash")).thenReturn(null);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> setupService.verifyAndRotateRecoveryCode("any_code"));

        assertTrue(ex.getMessage().contains("未设置"));
    }

    @Test
    @DisplayName("verifyAndRotateRecoveryCode: throws exception when code doesn't match")
    void verifyAndRotateRecoveryCode_invalidCode() {
        when(systemConfigMapper.getValue("recovery_code_hash")).thenReturn("stored_hash");
        when(passwordEncoder.matches("wrong_code", "stored_hash")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> setupService.verifyAndRotateRecoveryCode("wrong_code"));

        assertTrue(ex.getMessage().contains("不正确"));
    }

    // ─── resetCeoPassword ─────────────────────────────────────────

    @Test
    @DisplayName("resetCeoPassword: resets password and returns new recovery code")
    void resetCeoPassword_success() {
        Employee ceo = createEmployee(1L, "CEO001", "CEO Name");
        when(systemConfigMapper.getValue("recovery_code_hash")).thenReturn("stored_hash");
        when(passwordEncoder.matches("valid_code", "stored_hash")).thenReturn(true);
        when(passwordEncoder.encode(anyString())).thenReturn("new_password_hash");
        when(employeeMapper.selectOne(any())).thenReturn(ceo);

        String newCode = setupService.resetCeoPassword("valid_code", "new_password");

        assertNotNull(newCode);
        assertEquals(32, newCode.length());
        assertEquals("new_password_hash", ceo.getPasswordHash());
        assertFalse(ceo.getIsDefaultPassword());
        verify(employeeMapper).updateById(ceo);
    }

    @Test
    @DisplayName("resetCeoPassword: throws exception when CEO not found")
    void resetCeoPassword_ceoNotFound() {
        when(systemConfigMapper.getValue("recovery_code_hash")).thenReturn("stored_hash");
        when(passwordEncoder.matches("valid_code", "stored_hash")).thenReturn(true);
        when(passwordEncoder.encode(anyString())).thenReturn("new_hash");
        when(employeeMapper.selectOne(any())).thenReturn(null);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> setupService.resetCeoPassword("valid_code", "new_password"));

        assertTrue(ex.getMessage().contains("不存在"));
    }

    @Test
    @DisplayName("resetCeoPassword: propagates exception when recovery code invalid")
    void resetCeoPassword_invalidRecoveryCode() {
        when(systemConfigMapper.getValue("recovery_code_hash")).thenReturn("stored_hash");
        when(passwordEncoder.matches("invalid_code", "stored_hash")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> setupService.resetCeoPassword("invalid_code", "new_password"));

        assertTrue(ex.getMessage().contains("不正确"));
        verify(employeeMapper, never()).updateById(any());
    }

    // ─── helpers ─────────────────────────────────────────────────

    private Employee createEmployee(Long id, String employeeNo, String name) {
        Employee emp = new Employee();
        emp.setId(id);
        emp.setEmployeeNo(employeeNo);
        emp.setName(name);
        emp.setPasswordHash("old_hash");
        emp.setIsDefaultPassword(true);
        emp.setRoleCode("ceo");
        emp.setAccountStatus("ACTIVE");
        emp.setDeleted(0);
        return emp;
    }
}
