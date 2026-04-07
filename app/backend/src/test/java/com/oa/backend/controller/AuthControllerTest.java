package com.oa.backend.controller;

import com.oa.backend.config.SecurityConfig;
import com.oa.backend.dto.RoleViewResponse;
import com.oa.backend.security.JwtAuthenticationFilter;
import com.oa.backend.security.JwtTokenService;
import com.oa.backend.service.AccessManagementService;
import com.oa.backend.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 认证控制器测试类
 *
 * 该测试类验证AuthController及相关控制器（RoleController、UserController、HealthController）的接口行为，
 * 包括开发环境登录、密码登录、JWT令牌验证等功能。
 * 使用@WebMvcTest进行Spring MVC层的单元测试，同时导入安全配置以测试权限控制。
 */
@WebMvcTest({AuthController.class, RoleController.class, UserController.class, HealthController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtTokenService.class})
class AuthControllerTest {

    /** 模拟的Spring MVC测试客户端，用于发送HTTP请求并验证响应 */
    @Autowired
    private MockMvc mockMvc;

    /** JWT令牌服务，用于生成测试用的有效令牌 */
    @Autowired
    private JwtTokenService jwtTokenService;

    /** 模拟的用户服务，用于测试需要用户数据的接口 */
    @MockBean
    private UserService userService;

    /** 模拟的访问管理服务，用于模拟登录认证和角色列表查询 */
    @MockBean
    private AccessManagementService accessManagementService;

    @MockBean
    private com.oa.backend.service.EmployeeService employeeService;

    @MockBean
    private com.oa.backend.security.ResetCodeStore resetCodeStore;

    @MockBean
    private com.oa.backend.mapper.RoleMapper roleMapper;

    @MockBean
    private com.oa.backend.mapper.DepartmentMapper departmentMapper;

    /**
     * 测试开发环境登录接口
     *
     * 验证：POST /auth/dev-login 端点在提供有效用户信息时能正确返回JWT令牌
     * 模拟：设置accessManagementService.buildProfile返回已认证用户对象
     * 断言：
     * - HTTP状态码为200（isOk）
     * - 响应中包含非空的token字段
     * - mode字段值为"DEV_LOGIN"
     * - role字段值为"ceo"
     * - roleName字段值为"首席经营者"
     */
    @Test
    void shouldReturnJwtForDevelopmentLogin() throws Exception {
        given(accessManagementService.buildProfile("ceo.demo", "测试 CEO", "ceo"))
            .willReturn(new AccessManagementService.AuthenticatedUser(
                "ceo.demo",
                "测试 CEO",
                "ceo",
                "首席经营者",
                "总经办",
                "普通员工"
            ));

        mockMvc.perform(post("/auth/dev-login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "username": "ceo.demo",
                      "displayName": "测试 CEO",
                      "role": "ceo"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andExpect(jsonPath("$.mode").value("DEV_LOGIN"))
            .andExpect(jsonPath("$.role").value("ceo"))
            .andExpect(jsonPath("$.roleName").value("首席经营者"));
    }

    /**
     * 测试密码登录接口
     *
     * 验证：POST /auth/login 端点在提供正确用户名密码时能正确返回JWT令牌
     * 模拟：设置employeeService.authenticate返回包含用户信息的Optional
     * 断言：
     * - HTTP状态码为200（isOk）
     * - mode字段值为"PASSWORD_LOGIN"
     * - role字段值为"finance"
     * - roleName字段值为"财务"
     */
    @Test
    void shouldReturnJwtForPasswordLogin() throws Exception {
        com.oa.backend.entity.Employee employee = new com.oa.backend.entity.Employee();
        employee.setId(2L);
        employee.setEmployeeNo("finance.demo");
        employee.setName("李静");
        employee.setRoleCode("finance");
        employee.setEmployeeType("OFFICE");
        employee.setDepartmentId(2L);

        com.oa.backend.entity.Role role = new com.oa.backend.entity.Role();
        role.setRoleCode("finance");
        role.setRoleName("财务");

        given(employeeService.authenticate("finance.demo", "123456"))
            .willReturn(Optional.of(employee));
        given(roleMapper.selectOne(org.mockito.Mockito.any()))
            .willReturn(role);

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "username": "finance.demo",
                      "password": "123456"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.mode").value("PASSWORD_LOGIN"))
            .andExpect(jsonPath("$.role").value("finance"))
            .andExpect(jsonPath("$.roleName").value("财务"));
    }

    /**
     * 测试无令牌访问受保护端点
     *
     * 验证：未提供Authorization头时，访问受保护资源应被拒绝
     * 断言：HTTP状态码为401（Unauthorized），表示未授权访问
     */
    @Test
    void shouldRejectProtectedEndpointWithoutToken() throws Exception {
        mockMvc.perform(get("/users"))
            .andExpect(status().isUnauthorized());
    }

    /**
     * 测试携带有效令牌访问受保护端点
     *
     * 验证：提供有效的JWT令牌时，可以正常访问受保护的用户列表接口
     * 模拟：设置userService.list返回空列表
     * 断言：HTTP状态码为200（isOk），表示请求成功
     */
    @Test
    void shouldAllowProtectedEndpointWithValidToken() throws Exception {
        String token = jwtTokenService.generateToken("ceo.demo", 1L, "ceo", "OFFICE", "陈明远");
        given(userService.list()).willReturn(List.of());

        mockMvc.perform(get("/users")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());
    }

    /**
     * 测试携带有效令牌访问角色列表接口
     *
     * 验证：提供有效的JWT令牌时，可以正常获取角色列表数据
     * 模拟：设置accessManagementService.listRoles返回包含employee角色的列表
     * 断言：
     * - HTTP状态码为200（isOk）
     * - 响应数组第一个元素的roleCode字段值为"employee"
     */
    @Test
    void shouldAllowRoleListWithValidToken() throws Exception {
        String token = jwtTokenService.generateToken("ceo.demo", "ceo", "陈明远");
        given(accessManagementService.listRoles()).willReturn(List.of(
            new RoleViewResponse(1L, "employee", "员工", "默认员工角色", 1, true, List.of("查看本人信息"))
        ));

        mockMvc.perform(get("/roles")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].roleCode").value("employee"));
    }
}
