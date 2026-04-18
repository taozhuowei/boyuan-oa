package com.oa.backend.service;

import com.oa.backend.dto.RoleUpsertRequest;
import com.oa.backend.dto.RoleViewResponse;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 访问管理服务 - 负责演示账号与角色权限的内存级管理
 *
 * 设计意图：
 * 1. 本服务采用内存存储(LinkedHashMap)实现，用于演示环境的快速部署与零配置运行
 * 2. 预置4个演示角色和4个演示账号，便于开发测试和演示展示
 * 3. 角色权限采用字符串列表形式，支持细粒度的功能点控制
 * 4. 提供用户名大小写不敏感的认证支持，提升用户体验
 *
 * 预置演示账号说明：
 * - employee.demo (张晓宁): 普通员工角色，可发起请假、加班、查看工资条
 * - finance.demo (李静): 财务角色，负责工资结算、数据导出
 * - pm.demo (王建国): 项目经理角色，处理项目审批、维护施工日志
 * - ceo.demo (陈明远): 首席经营者，拥有最高权限，可配置角色和全局设置
 */
@Service
@RequiredArgsConstructor
public class AccessManagementService {

    private final PasswordEncoder passwordEncoder;
    private final Map<String, DemoAccount> accounts = new LinkedHashMap<>();
    private final Map<Long, ManagedRole> roles = new LinkedHashMap<>();
    private final AtomicLong roleSequence = new AtomicLong(0);

    /**
     * 服务初始化方法 - 预置系统角色和演示账号
     *
     * 执行时机：Spring容器启动完成后自动执行（@PostConstruct）
     * 幂等性处理：如果角色已存在则跳过，防止重复初始化
     *
     * 初始化内容：
     * 1. 4个系统内置角色（employee/finance/project_manager/ceo）
     * 2. 4个对应的演示账号（密码使用BCrypt加密存储）
     */
    @PostConstruct
    void init() {
        if (!roles.isEmpty()) {
            return;
        }

        seedRole(1L, "employee", "员工", "发起和查看本人业务单据，查看并确认工资条。", true,
            List.of("查看本人信息", "发起请假", "发起加班", "工资条确认与异议"));
        seedRole(2L, "finance", "财务", "维护人员与薪资配置，执行结算、复核异议、导出数据。", true,
            List.of("查看全员信息", "工资结算", "通讯录导入", "导出数据"));
        seedRole(3L, "project_manager", "项目经理", "处理项目范围内审批，维护项目施工日志模板，查看项目总览。", true,
            List.of("项目初审", "项目总览", "日志模板维护"));
        seedRole(4L, "ceo", "首席经营者", "管理全局配置、终审审批、配置角色权限、查看经营总览。", true,
            List.of("终审审批", "角色与权限配置", "数据有效期配置", "经营总览"));
        seedRole(5L, "worker", "劳工", "施工现场工作人员，可使用施工日志和工伤补偿相关功能。", true,
            List.of("施工日志", "工伤补偿", "查看本人信息", "工资条确认与异议"));
        seedRole(6L, "hr", "人力资源", "维护人员与组织架构，配置假期规则。不含薪资数据访问。", true,
            List.of("人员信息录入与维护", "组织架构配置", "假期规则管理"));
        seedRole(7L, "department_manager", "部门经理", "员工考勤审批、部门管理，可查看本部门员工基本信息与考勤记录。", true,
            List.of("考勤审批", "部门成员查看", "考勤记录查看"));
        seedRole(8L, "general_manager", "总经理", "介于 CEO 与各部门负责人之间；可加入审批流末端链；可见全项目但不可见考勤/薪资/HR 档案。", true,
            List.of("项目总览", "审批流末端", "报销审批"));
        seedRole(9L, "ops", "运维", "系统运维，仅访问运维工具与操作日志，不参与业务流程。", true,
            List.of("操作日志查看", "数据导出", "数据查看器"));

        seedAccount("employee.demo", "123456", "张晓宁", "employee", "综合管理部", "OFFICE");
        seedAccount("finance.demo", "123456", "李静", "finance", "财务管理部", "OFFICE");
        seedAccount("pm.demo", "123456", "王建国", "project_manager", "项目一部", "OFFICE");
        seedAccount("ceo.demo", "123456", "陈明远", "ceo", "运营管理部", "OFFICE");
        seedAccount("worker.demo", "123456", "赵铁柱", "worker", "施工一部", "LABOR");
        seedAccount("hr.demo", "123456", "孙丽华", "hr", "综合管理部", "OFFICE");
        seedAccount("dept_manager.demo", "123456", "周伟", "department_manager", "综合管理部", "OFFICE");
        roleSequence.set(roles.keySet().stream().mapToLong(Long::longValue).max().orElse(0L));
    }

    /**
     * 用户认证方法 - 验证用户名和密码的正确性
     *
     * 处理逻辑：
     * 1. 对输入用户名进行标准化处理（去空格、转小写）
     * 2. 在内存账户表中查找对应账号
     * 3. 使用PasswordEncoder验证密码（支持BCrypt等哈希算法）
     * 4. 认证成功返回AuthenticatedUser，失败返回Optional.empty()
     *
     * @param username 用户名（支持大小写不敏感匹配）
     * @param password 原始密码（未加密）
     * @return 认证成功后的用户对象，失败返回空Optional
     */
    public Optional<AuthenticatedUser> authenticate(String username, String password) {
        DemoAccount account = accounts.get(normalizeKey(username));

        if (account == null || !passwordEncoder.matches(password, account.passwordHash())) {
            return Optional.empty();
        }

        return Optional.of(toAuthenticatedUser(account));
    }

    /**
     * 构建用户档案信息 - 用于创建新用户时组装用户信息
     *
     * 处理逻辑：
     * 1. 对角色编码进行标准化（转小写、下划线替换）
     * 2. 若指定角色不存在则默认使用员工角色(roleId=1L)
     * 3. 用户名和显示名自动去除首尾空格
     * 4. 部门默认为"未分配部门"，员工类型为"普通员工"
     *
     * @param username 用户名
     * @param displayName 显示名称（真实姓名）
     * @param roleCode 角色编码（如"employee", "ceo"）
     * @return 构建完成的认证用户对象
     */
    public AuthenticatedUser buildProfile(String username, String displayName, String roleCode) {
        String normalizedRoleCode = normalizeRoleCode(roleCode);
        ManagedRole role = findRoleByCode(normalizedRoleCode).orElseGet(() -> roles.get(1L));

        return new AuthenticatedUser(
            username.trim(),
            displayName.trim(),
            normalizedRoleCode,
            role.roleName(),
            "未分配部门",
            "普通员工"
        );
    }

    /**
     * 查询所有角色列表 - 按角色ID升序排列
     *
     * @return 角色视图响应列表，包含角色基本信息和权限清单
     */
    public List<RoleViewResponse> listRoles() {
        return roles.values().stream()
            .sorted(Comparator.comparingLong(ManagedRole::id))
            .map(this::toResponse)
            .toList();
    }

    /**
     * 按角色编码返回该角色的权限列表。被 JwtAuthenticationFilter 消费以拼装 PERM_* 权限点。
     * 角色不存在 → 空列表。
     */
    public List<String> getPermissionsByRoleCode(String roleCode) {
        return findRoleByCode(normalizeRoleCode(roleCode))
                .map(ManagedRole::permissions)
                .orElseGet(java.util.Collections::emptyList);
    }

    /**
     * 创建新角色 - 支持自定义角色编码、名称、描述和权限列表
     *
     * 处理逻辑：
     * 1. 自动生成递增的角色ID（从4开始，1-3为系统预留）
     * 2. 角色编码标准化（转小写、连字符转下划线）
     * 3. 新角色默认为非系统角色（system=false）
     * 4. 状态默认为启用（status=1）
     * 5. 权限列表标准化（去空值、去空格）
     *
     * @param request 角色创建请求，包含角色编码、名称、描述、权限等
     * @return 创建成功后的角色视图响应
     */
    public RoleViewResponse createRole(RoleUpsertRequest request) {
        long nextId = roleSequence.incrementAndGet();
        ManagedRole role = new ManagedRole(
            nextId,
            normalizeRoleCode(request.roleCode()),
            request.roleName().trim(),
            normalizeText(request.description()),
            false,
            request.status() == null ? 1 : request.status(),
            normalizePermissions(request.permissions())
        );

        roles.put(nextId, role);
        return toResponse(role);
    }

    /**
     * 更新现有角色信息 - 支持修改角色属性但不允许更改系统角色类型
     *
     * 权限限制：系统内置角色（system=true）不允许修改system标记
     * 可更新字段：角色编码、角色名称、描述、状态、权限列表
     * 不变字段：角色ID、system标记
     *
     * @param id 角色唯一标识（数据库主键）
     * @param request 角色更新请求
     * @return 更新后的角色视图响应
     * @throws IllegalArgumentException 角色不存在时抛出
     */
    public RoleViewResponse updateRole(Long id, RoleUpsertRequest request) {
        ManagedRole existing = roles.get(id);

        if (existing == null) {
            throw new IllegalArgumentException("角色不存在");
        }

        ManagedRole updated = new ManagedRole(
            existing.id(),
            normalizeRoleCode(request.roleCode()),
            request.roleName().trim(),
            normalizeText(request.description()),
            existing.system(),
            request.status() == null ? existing.status() : request.status(),
            normalizePermissions(request.permissions())
        );

        roles.put(id, updated);
        return toResponse(updated);
    }

    /**
     * 删除角色
     * 
     * 处理逻辑：
     * 1. 检查角色是否存在
     * 2. 系统角色（is_system=true）不可删除
     * 3. 非系统角色从内存中移除
     *
     * @param id 角色ID
     * @throws IllegalArgumentException 角色不存在
     * @throws IllegalStateException 系统角色不可删除
     */
    public void deleteRole(Long id) {
        ManagedRole role = roles.get(id);
        if (role == null) {
            throw new IllegalArgumentException("角色不存在");
        }
        if (role.system()) {
            throw new IllegalStateException("系统角色不可删除");
        }
        roles.remove(id);
    }

    /**
     * 检查当前用户是否具有角色管理权限
     *
     * 权限判定逻辑：
     * 仅CEO角色（authority="ROLE_CEO"）拥有管理角色的权限
     * 该检查用于角色配置页面的访问控制和操作权限控制
     *
     * @param authentication Spring Security认证对象，包含当前用户权限列表
     * @return true-有管理权限，false-无管理权限
     */
    public boolean canManageRoles(Authentication authentication) {
        if (authentication == null) {
            return false;
        }

        return authentication.getAuthorities().stream()
            .anyMatch(authority -> "ROLE_CEO".equals(authority.getAuthority()));
    }

    /**
     * 预置系统角色 - 在初始化时创建内置角色
     *
     * 系统角色特性：
     * - 标记为system=true，表示不可删除的核心角色
     * - 默认状态为启用（status=1）
     *
     * @param id 角色ID（固定分配：1=employee, 2=finance, 3=project_manager, 4=ceo）
     * @param roleCode 角色编码，用于程序中权限判断
     * @param roleName 角色中文名称，用于界面展示
     * @param description 角色职责描述
     * @param isSystem 是否为系统角色（true表示受保护）
     * @param permissions 权限字符串列表，定义该角色可操作的功能点
     */
    private void seedRole(
        Long id,
        String roleCode,
        String roleName,
        String description,
        boolean isSystem,
        List<String> permissions
    ) {
        roles.put(id, new ManagedRole(id, roleCode, roleName, description, isSystem, 1, permissions));
    }

    /**
     * 预置演示账号 - 创建用于测试的默认登录账号
     *
     * 密码处理：使用PasswordEncoder对原始密码进行BCrypt加密存储
     * 账号键值：用户名经normalizeKey处理后作为Map的key，实现大小写不敏感查找
     * 角色分配：每个演示账号绑定一个系统内置角色
     *
     * @param username 登录用户名
     * @param rawPassword 原始明文密码
     * @param displayName 用户真实姓名（界面显示用）
     * @param roleCode 角色编码，决定该账号的权限范围
     * @param department 所属部门（演示数据）
     * @param employeeType 员工类型（演示数据，如"普通员工"）
     */
    private void seedAccount(
        String username,
        String rawPassword,
        String displayName,
        String roleCode,
        String department,
        String employeeType
    ) {
        accounts.put(normalizeKey(username), new DemoAccount(
            username,
            passwordEncoder.encode(rawPassword),
            displayName,
            normalizeRoleCode(roleCode),
            department,
            employeeType
        ));
    }

    /**
     * 根据角色编码查找角色 - 内存中精确匹配查询
     *
     * @param roleCode 标准化后的角色编码（小写、下划线格式）
     * @return 匹配的角色对象Optional
     */
    private Optional<ManagedRole> findRoleByCode(String roleCode) {
        return roles.values().stream()
            .filter(item -> item.roleCode().equals(roleCode))
            .findFirst();
    }

    /**
     * 将演示账号转换为认证用户对象 - 组装登录后的用户信息
     *
     * 处理逻辑：
     * 1. 根据账号绑定的角色编码查找对应角色信息
     * 2. 若角色不存在则默认使用员工角色（容错处理）
     * 3. 汇总用户名、姓名、角色、部门等信息到认证对象
     *
     * @param account 演示账号记录（包含用户名、密码哈希、角色等）
     * @return 组装完成的认证用户对象
     */
    private AuthenticatedUser toAuthenticatedUser(DemoAccount account) {
        ManagedRole role = findRoleByCode(account.roleCode()).orElseGet(() -> roles.get(1L));

        return new AuthenticatedUser(
            account.username(),
            account.displayName(),
            account.roleCode(),
            role.roleName(),
            account.department(),
            account.employeeType()
        );
    }

    /**
     * 将内部角色对象转换为响应DTO - 用于API返回数据格式化
     *
     * @param role 内部管理的角色记录
     * @return 角色视图响应对象
     */
    private RoleViewResponse toResponse(ManagedRole role) {
        return new RoleViewResponse(
            role.id(),
            role.roleCode(),
            role.roleName(),
            role.description(),
            role.status(),
            role.system(),
            role.permissions()
        );
    }

    /**
     * 权限列表标准化处理 - 清洗和格式化权限字符串
     *
     * 处理规则：
     * 1. null输入返回空列表（避免NPE）
     * 2. 每个权限字符串去除首尾空格
     * 3. 空字符串被过滤（不加入结果）
     * 4. 返回不可变列表（List.of()）
     *
     * @param permissions 原始权限字符串列表，可能包含null或空值
     * @return 清洗后的权限列表
     */
    private List<String> normalizePermissions(List<String> permissions) {
        if (permissions == null) {
            return List.of();
        }

        List<String> normalized = new ArrayList<>();

        for (String permission : permissions) {
            String value = normalizeText(permission);

            if (!value.isEmpty()) {
                normalized.add(value);
            }
        }

        return normalized;
    }

    /**
     * 键值标准化 - 用于Map的key生成，实现大小写不敏感存储
     *
     * 转换规则：trim() -> toLowerCase(Locale.ROOT)
     * 使用Locale.ROOT确保不受系统默认语言环境影响
     *
     * @param value 原始字符串
     * @return 标准化后的字符串，null返回空串
     */
    private String normalizeKey(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * 角色编码标准化 - 统一角色编码格式
     *
     * 处理规则：先执行normalizeKey（去空格、转小写），再将连字符替换为下划线
     * 示例："Project-Manager" -> "project_manager"
     *
     * @param value 原始角色编码
     * @return 标准化后的角色编码
     */
    private String normalizeRoleCode(String value) {
        return normalizeKey(value).replace('-', '_');
    }

    /**
     * 通用文本标准化 - 去除字符串首尾空白
     *
     * @param value 原始文本
     * @return 去除首尾空格后的文本，null返回空串
     */
    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    /**
     * 演示账号内部记录 - 内存中存储的账号完整信息
     *
     * 字段说明：
     * @param username 原始用户名（保留用户输入的大小写）
     * @param passwordHash BCrypt加密后的密码哈希
     * @param displayName 用户真实姓名
     * @param roleCode 标准化后的角色编码
     * @param department 所属部门（演示数据）
     * @param employeeType 员工类型（演示数据）
     */
    private record DemoAccount(
        String username,
        String passwordHash,
        String displayName,
        String roleCode,
        String department,
        String employeeType
    ) {
    }

    /**
     * 托管角色内部记录 - 内存中存储的角色完整信息
     *
     * 字段说明：
     * @param id 角色唯一标识（主键）
     * @param roleCode 标准化角色编码
     * @param roleName 角色中文显示名称
     * @param description 角色职责描述
     * @param system 是否为系统角色（受保护，不可删除）
     * @param status 状态码（1=启用，0=禁用）
     * @param permissions 权限字符串列表，定义功能权限点
     */
    private record ManagedRole(
        Long id,
        String roleCode,
        String roleName,
        String description,
        boolean system,
        Integer status,
        List<String> permissions
    ) {
    }

    /**
     * 认证用户信息 - 登录成功后返回的用户信息传输对象
     *
     * 用途：
     * 1. 承载认证成功后的用户基本信息
     * 2. 作为API响应返回给前端
     * 3. 存储到SecurityContext供权限判断使用
     *
     * 字段说明：
     * @param username 登录用户名
     * @param displayName 用户真实姓名（界面展示）
     * @param roleCode 角色编码（用于权限判断）
     * @param roleName 角色中文名称（界面展示）
     * @param department 所属部门
     * @param employeeType 员工类型
     */
    public record AuthenticatedUser(
        String username,
        String displayName,
        String roleCode,
        String roleName,
        String department,
        String employeeType
    ) {
    }
}
