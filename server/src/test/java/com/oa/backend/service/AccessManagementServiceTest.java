package com.oa.backend.service;

import com.oa.backend.dto.RoleUpsertRequest;
import com.oa.backend.dto.RoleViewResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * AccessManagementService 单元测试
 * 覆盖：认证、角色管理、权限检查、演示账号逻辑
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AccessManagementService - 访问管理服务测试")
class AccessManagementServiceTest {

    @InjectMocks
    private AccessManagementService service;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        service.init();
    }

    @Test
    @DisplayName("authenticate：正确的用户名和密码返回 AuthenticatedUser")
    void authenticate_correctCredentialsReturnsUser() {
        when(passwordEncoder.matches("123456", "encodedPassword")).thenReturn(true);

        Optional<AccessManagementService.AuthenticatedUser> result = service.authenticate("employee.demo", "123456");

        assertTrue(result.isPresent());
        assertEquals("employee.demo", result.get().username());
        assertEquals("张晓宁", result.get().displayName());
        assertEquals("employee", result.get().roleCode());
        assertEquals("员工", result.get().roleName());
        assertEquals("综合管理部", result.get().department());
    }

    @Test
    @DisplayName("authenticate：错误的密码返回空 Optional")
    void authenticate_wrongPasswordReturnsEmpty() {
        when(passwordEncoder.matches("wrongpassword", "encodedPassword")).thenReturn(false);

        Optional<AccessManagementService.AuthenticatedUser> result = service.authenticate("employee.demo", "wrongpassword");

        assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("authenticate：不存在的用户名返回空 Optional")
    void authenticate_nonExistentUserReturnsEmpty() {
        Optional<AccessManagementService.AuthenticatedUser> result = service.authenticate("nonexistent.user", "123456");

        assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("authenticate：支持大小写不敏感的用户名匹配")
    void authenticate_caseInsensitiveUsernameMatching() {
        when(passwordEncoder.matches("123456", "encodedPassword")).thenReturn(true);

        assertTrue(service.authenticate("EMPLOYEE.DEMO", "123456").isPresent());
        assertTrue(service.authenticate("Employee.Demo", "123456").isPresent());
        assertTrue(service.authenticate("employee.DEMO", "123456").isPresent());
    }

    @Test
    @DisplayName("listRoles：返回所有角色列表，按ID升序排列")
    void listRoles_returnsAllRolesSortedById() {
        List<RoleViewResponse> roles = service.listRoles();

        assertNotNull(roles);
        assertTrue(roles.size() >= 5);

        assertEquals(1L, roles.get(0).id());
        assertEquals("employee", roles.get(0).roleCode());
        assertEquals("员工", roles.get(0).roleName());
    }

    @Test
    @DisplayName("listRoles：角色包含正确的权限列表")
    void listRoles_rolesContainCorrectPermissions() {
        List<RoleViewResponse> roles = service.listRoles();

        RoleViewResponse employeeRole = roles.stream()
                .filter(r -> r.roleCode().equals("employee"))
                .findFirst()
                .orElseThrow();

        assertTrue(employeeRole.permissions().contains("查看本人信息"));
        assertTrue(employeeRole.permissions().contains("发起请假"));
        assertTrue(employeeRole.permissions().contains("发起加班"));
        assertTrue(employeeRole.permissions().contains("工资条确认与异议"));

        RoleViewResponse ceoRole = roles.stream()
                .filter(r -> r.roleCode().equals("ceo"))
                .findFirst()
                .orElseThrow();

        assertTrue(ceoRole.permissions().contains("终审审批"));
        assertTrue(ceoRole.permissions().contains("角色与权限配置"));
    }

    @Test
    @DisplayName("createRole：成功创建新角色")
    void createRole_successfullyCreatesNewRole() {
        RoleUpsertRequest request = new RoleUpsertRequest("test_role", "测试角色", "用于测试的角色", 1, List.of("权限1", "权限2"));

        RoleViewResponse result = service.createRole(request);

        assertNotNull(result);
        assertEquals("test_role", result.roleCode());
        assertEquals("测试角色", result.roleName());
        assertEquals("用于测试的角色", result.description());
        assertEquals(1, result.status());
        assertFalse(result.isSystem());
        assertEquals(2, result.permissions().size());
        assertTrue(result.permissions().contains("权限1"));
    }

    @Test
    @DisplayName("createRole：角色编码标准化（转小写、连字符转下划线）")
    void createRole_normalizesRoleCode() {
        RoleUpsertRequest request = new RoleUpsertRequest("Test-Role", "测试角色", null, null, null);

        RoleViewResponse result = service.createRole(request);

        assertEquals("test_role", result.roleCode());
    }

    @Test
    @DisplayName("createRole：null 状态默认为启用状态（1）")
    void createRole_nullStatusDefaultsToActive() {
        RoleUpsertRequest request = new RoleUpsertRequest("test_role", "测试角色", null, null, null);

        RoleViewResponse result = service.createRole(request);

        assertEquals(1, result.status());
    }

    @Test
    @DisplayName("createRole：权限列表标准化（去空值、去空格）")
    void createRole_normalizesPermissions() {
        RoleUpsertRequest request = new RoleUpsertRequest("test_role", "测试角色", null, null, Arrays.asList("  权限1  ", "", null, "权限2"));

        RoleViewResponse result = service.createRole(request);

        assertEquals(2, result.permissions().size());
        assertTrue(result.permissions().contains("权限1"));
        assertFalse(result.permissions().contains(""));
    }

    @Test
    @DisplayName("createRole：自动生成递增的角色ID")
    void createRole_autoGeneratesIncrementingIds() {
        RoleUpsertRequest request1 = new RoleUpsertRequest("role1", "角色1", null, null, null);
        RoleViewResponse result1 = service.createRole(request1);

        RoleUpsertRequest request2 = new RoleUpsertRequest("role2", "角色2", null, null, null);
        RoleViewResponse result2 = service.createRole(request2);

        assertEquals(result1.id() + 1, result2.id());
    }

    @Test
    @DisplayName("updateRole：成功更新现有角色")
    void updateRole_successfullyUpdatesExistingRole() {
        RoleUpsertRequest createRequest = new RoleUpsertRequest("updatable_role", "原角色名", null, null, List.of("原权限"));
        RoleViewResponse created = service.createRole(createRequest);

        RoleUpsertRequest updateRequest = new RoleUpsertRequest("updated_role", "新角色名", "新描述", 0, List.of("新权限1", "新权限2"));
        RoleViewResponse updated = service.updateRole(created.id(), updateRequest);

        assertEquals(created.id(), updated.id());
        assertEquals("updated_role", updated.roleCode());
        assertEquals("新角色名", updated.roleName());
        assertEquals("新描述", updated.description());
        assertEquals(0, updated.status());
        assertEquals(2, updated.permissions().size());
    }

    @Test
    @DisplayName("updateRole：系统角色不可修改 system 标记")
    void updateRole_systemRoleCannotChangeSystemFlag() {
        RoleUpsertRequest updateRequest = new RoleUpsertRequest("employee", "员工", null, null, null);
        RoleViewResponse updated = service.updateRole(1L, updateRequest);

        assertTrue(updated.isSystem());
    }

    @Test
    @DisplayName("updateRole：不存在的角色抛出 IllegalArgumentException")
    void updateRole_nonExistentRoleThrowsException() {
        RoleUpsertRequest request = new RoleUpsertRequest("test", "测试", null, null, null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.updateRole(99999L, request));
        assertTrue(ex.getMessage().contains("不存在"));
    }

    @Test
    @DisplayName("updateRole：null 状态保持原状态")
    void updateRole_nullStatusKeepsOriginal() {
        RoleUpsertRequest createRequest = new RoleUpsertRequest("status_test", "状态测试", null, 0, null);
        RoleViewResponse created = service.createRole(createRequest);

        RoleUpsertRequest updateRequest = new RoleUpsertRequest("status_test", "状态测试", null, null, null);
        RoleViewResponse updated = service.updateRole(created.id(), updateRequest);

        assertEquals(0, updated.status());
    }

    @Test
    @DisplayName("deleteRole：成功删除非系统角色")
    void deleteRole_successfullyDeletesNonSystemRole() {
        RoleUpsertRequest request = new RoleUpsertRequest("deletable_role", "可删除角色", null, null, null);
        RoleViewResponse created = service.createRole(request);

        int countBefore = service.listRoles().size();

        service.deleteRole(created.id());

        int countAfter = service.listRoles().size();
        assertEquals(countBefore - 1, countAfter);
    }

    @Test
    @DisplayName("deleteRole：系统角色不可删除，抛出 IllegalStateException")
    void deleteRole_systemRoleThrowsException() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.deleteRole(1L));
        assertTrue(ex.getMessage().contains("系统角色"));
    }

    @Test
    @DisplayName("deleteRole：不存在的角色抛出 IllegalArgumentException")
    void deleteRole_nonExistentRoleThrowsException() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.deleteRole(99999L));
        assertTrue(ex.getMessage().contains("不存在"));
    }

    @Test
    @DisplayName("canManageRoles：CEO 角色有权管理角色")
    void canManageRoles_ceoRoleCanManage() {
        Collection authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_CEO"));
        when(authentication.getAuthorities()).thenReturn(authorities);

        boolean result = service.canManageRoles(authentication);

        assertTrue(result);
    }

    @Test
    @DisplayName("canManageRoles：非 CEO 角色无权管理角色")
    void canManageRoles_nonCeoRoleCannotManage() {
        Collection authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_EMPLOYEE"));
        when(authentication.getAuthorities()).thenReturn(authorities);

        boolean result = service.canManageRoles(authentication);

        assertFalse(result);
    }

    @Test
    @DisplayName("canManageRoles：null authentication 返回 false")
    void canManageRoles_nullAuthenticationReturnsFalse() {
        boolean result = service.canManageRoles(null);

        assertFalse(result);
    }

    @Test
    @DisplayName("canManageRoles：空权限列表返回 false")
    void canManageRoles_emptyAuthoritiesReturnsFalse() {
        when(authentication.getAuthorities()).thenReturn(Collections.emptyList());

        boolean result = service.canManageRoles(authentication);

        assertFalse(result);
    }

    @Test
    @DisplayName("buildProfile：成功构建用户档案")
    void buildProfile_successfullyBuildsProfile() {
        AccessManagementService.AuthenticatedUser profile = service.buildProfile(
                "test.user", "测试用户", "employee");

        assertEquals("test.user", profile.username());
        assertEquals("测试用户", profile.displayName());
        assertEquals("employee", profile.roleCode());
        assertEquals("员工", profile.roleName());
        assertEquals("未分配部门", profile.department());
        assertEquals("普通员工", profile.employeeType());
    }

    @Test
    @DisplayName("buildProfile：角色编码标准化")
    void buildProfile_normalizesRoleCode() {
        AccessManagementService.AuthenticatedUser profile = service.buildProfile(
                "test.user", "测试用户", "Employee-Role");

        assertEquals("employee_role", profile.roleCode());
    }

    @Test
    @DisplayName("buildProfile：不存在的角色使用默认员工角色")
    void buildProfile_nonExistentRoleUsesDefault() {
        AccessManagementService.AuthenticatedUser profile = service.buildProfile(
                "test.user", "测试用户", "nonexistent_role");

        assertEquals("nonexistent_role", profile.roleCode());
        assertEquals("员工", profile.roleName());
    }

    @Test
    @DisplayName("buildProfile：去除用户名和显示名首尾空格")
    void buildProfile_trimsUsernameAndDisplayName() {
        AccessManagementService.AuthenticatedUser profile = service.buildProfile(
                "  test.user  ", "  测试用户  ", "employee");

        assertEquals("test.user", profile.username());
        assertEquals("测试用户", profile.displayName());
    }

    @Test
    @DisplayName("预置演示账号：employee.demo 配置正确")
    void seededDemoAccount_employeeDemoConfiguration() {
        when(passwordEncoder.matches("123456", "encodedPassword")).thenReturn(true);

        Optional<AccessManagementService.AuthenticatedUser> result = service.authenticate("employee.demo", "123456");

        assertTrue(result.isPresent());
        assertEquals("张晓宁", result.get().displayName());
        assertEquals("employee", result.get().roleCode());
        assertEquals("综合管理部", result.get().department());
    }

    @Test
    @DisplayName("预置演示账号：finance.demo 配置正确")
    void seededDemoAccount_financeDemoConfiguration() {
        when(passwordEncoder.matches("123456", "encodedPassword")).thenReturn(true);

        Optional<AccessManagementService.AuthenticatedUser> result = service.authenticate("finance.demo", "123456");

        assertTrue(result.isPresent());
        assertEquals("李静", result.get().displayName());
        assertEquals("finance", result.get().roleCode());
        assertEquals("财务管理部", result.get().department());
    }

    @Test
    @DisplayName("预置演示账号：pm.demo 配置正确")
    void seededDemoAccount_pmDemoConfiguration() {
        when(passwordEncoder.matches("123456", "encodedPassword")).thenReturn(true);

        Optional<AccessManagementService.AuthenticatedUser> result = service.authenticate("pm.demo", "123456");

        assertTrue(result.isPresent());
        assertEquals("王建国", result.get().displayName());
        assertEquals("project_manager", result.get().roleCode());
        assertEquals("项目一部", result.get().department());
    }

    @Test
    @DisplayName("预置演示账号：ceo.demo 配置正确")
    void seededDemoAccount_ceoDemoConfiguration() {
        when(passwordEncoder.matches("123456", "encodedPassword")).thenReturn(true);

        Optional<AccessManagementService.AuthenticatedUser> result = service.authenticate("ceo.demo", "123456");

        assertTrue(result.isPresent());
        assertEquals("陈明远", result.get().displayName());
        assertEquals("ceo", result.get().roleCode());
        assertEquals("运营管理部", result.get().department());
    }

    @Test
    @DisplayName("预置演示账号：worker.demo 配置正确")
    void seededDemoAccount_workerDemoConfiguration() {
        when(passwordEncoder.matches("123456", "encodedPassword")).thenReturn(true);

        Optional<AccessManagementService.AuthenticatedUser> result = service.authenticate("worker.demo", "123456");

        assertTrue(result.isPresent());
        assertEquals("赵铁柱", result.get().displayName());
        assertEquals("worker", result.get().roleCode());
        assertEquals("施工一部", result.get().department());
        assertEquals("LABOR", result.get().employeeType());
    }

    @Test
    @DisplayName("预置系统角色：employee 权限正确")
    void seededSystemRole_employeePermissions() {
        List<RoleViewResponse> roles = service.listRoles();

        RoleViewResponse employee = roles.stream()
                .filter(r -> r.roleCode().equals("employee"))
                .findFirst()
                .orElseThrow();

        assertTrue(employee.isSystem());
        assertEquals(1, employee.status());
        assertTrue(employee.permissions().contains("查看本人信息"));
        assertTrue(employee.permissions().contains("发起请假"));
        assertTrue(employee.permissions().contains("发起加班"));
        assertTrue(employee.permissions().contains("工资条确认与异议"));
    }

    @Test
    @DisplayName("预置系统角色：finance 权限正确")
    void seededSystemRole_financePermissions() {
        List<RoleViewResponse> roles = service.listRoles();

        RoleViewResponse finance = roles.stream()
                .filter(r -> r.roleCode().equals("finance"))
                .findFirst()
                .orElseThrow();

        assertTrue(finance.isSystem());
        assertTrue(finance.permissions().contains("查看全员信息"));
        assertTrue(finance.permissions().contains("工资结算"));
        assertTrue(finance.permissions().contains("通讯录导入"));
        assertTrue(finance.permissions().contains("导出数据"));
    }

    @Test
    @DisplayName("预置系统角色：ceo 权限正确")
    void seededSystemRole_ceoPermissions() {
        List<RoleViewResponse> roles = service.listRoles();

        RoleViewResponse ceo = roles.stream()
                .filter(r -> r.roleCode().equals("ceo"))
                .findFirst()
                .orElseThrow();

        assertTrue(ceo.isSystem());
        assertTrue(ceo.permissions().contains("终审审批"));
        assertTrue(ceo.permissions().contains("角色与权限配置"));
        assertTrue(ceo.permissions().contains("数据有效期配置"));
        assertTrue(ceo.permissions().contains("经营总览"));
    }

    @Test
    @DisplayName("预置系统角色：project_manager 权限正确")
    void seededSystemRole_projectManagerPermissions() {
        List<RoleViewResponse> roles = service.listRoles();

        RoleViewResponse pm = roles.stream()
                .filter(r -> r.roleCode().equals("project_manager"))
                .findFirst()
                .orElseThrow();

        assertTrue(pm.isSystem());
        assertTrue(pm.permissions().contains("项目初审"));
        assertTrue(pm.permissions().contains("项目总览"));
        assertTrue(pm.permissions().contains("日志模板维护"));
    }

    @Test
    @DisplayName("预置系统角色：worker 权限正确")
    void seededSystemRole_workerPermissions() {
        List<RoleViewResponse> roles = service.listRoles();

        RoleViewResponse worker = roles.stream()
                .filter(r -> r.roleCode().equals("worker"))
                .findFirst()
                .orElseThrow();

        assertTrue(worker.isSystem());
        assertTrue(worker.permissions().contains("施工日志"));
        assertTrue(worker.permissions().contains("工伤补偿"));
    }
}
