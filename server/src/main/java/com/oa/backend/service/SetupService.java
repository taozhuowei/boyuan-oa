package com.oa.backend.service;

import com.oa.backend.entity.Employee;
import com.oa.backend.entity.Role;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.RoleMapper;
import com.oa.backend.mapper.SystemConfigMapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 系统初始化服务。 负责系统初始化状态检查、初始化向导业务逻辑、恢复码管理等。
 *
 * <p>核心业务规则：
 *
 * <ul>
 *   <li>系统初始化状态通过 system_config 表的 'initialized' 键管理
 *   <li>CEO 账户创建时生成 32 位恢复码，用于密码重置
 *   <li>恢复码使用 BCrypt 哈希存储，明文仅返回一次
 *   <li>验证恢复码后自动轮换，确保一次性使用
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SetupService {

  private static final String KEY_INITIALIZED = "initialized";
  private static final String KEY_INITIALIZED_AT = "initialized_at";
  private static final String KEY_RECOVERY_CODE_HASH = "recovery_code_hash";
  private static final String KEY_COMPANY_NAME = "company_name";
  private static final String DEFAULT_PASSWORD = "123456";

  private final SystemConfigMapper systemConfigMapper;
  private final EmployeeMapper employeeMapper;
  private final RoleMapper roleMapper;
  private final PasswordEncoder passwordEncoder;

  /**
   * 检查系统是否已初始化。
   *
   * @return 如果 system_config 中 'initialized' 为 "true" 返回 true，否则返回 false
   */
  public boolean isInitialized() {
    String value = systemConfigMapper.getValue(KEY_INITIALIZED);
    return Boolean.parseBoolean(value);
  }

  /**
   * 获取企业名称（用于页面 title 动态显示）。
   *
   * @return system_config 中 'company_name' 的值，未设置时返回 null
   */
  public String getCompanyName() {
    return systemConfigMapper.getValue(KEY_COMPANY_NAME);
  }

  /**
   * 初始化系统。 执行完整的初始化流程：创建 CEO、HR 账户，可选创建 OPS、GM 账户和自定义角色。
   *
   * <p>步骤说明：
   *
   * <ol>
   *   <li>创建 CEO 账户，生成恢复码
   *   <li>创建 HR 账户
   *   <li>可选：创建运营总监账户
   *   <li>可选：创建总经理账户
   *   <li>可选：创建自定义角色
   *   <li>标记系统已初始化
   * </ol>
   *
   * @param request 初始化请求，包含账户信息和可选配置
   * @return 初始化结果，包含恢复码（仅返回一次）
   * @throws IllegalArgumentException 如果请求无效或系统已初始化
   */
  @Transactional
  public SetupResult initialize(SetupRequest request) {
    if (request == null) {
      throw new IllegalArgumentException("初始化请求不能为空");
    }

    if (isInitialized()) {
      throw new IllegalStateException("系统已初始化，不能重复执行");
    }

    // 验证必填字段
    validateRequired(request.ceoName(), "CEO 姓名");
    validateRequired(request.ceoPhone(), "CEO 手机号");
    validateRequired(request.ceoPassword(), "CEO 密码");
    if (request.ceoPassword().length() < 8) {
      throw new IllegalArgumentException("CEO 密码长度不能少于 8 位");
    }
    validateRequired(request.hrName(), "HR 姓名");
    validateRequired(request.hrPhone(), "HR 手机号");

    // 步骤 1: 创建 CEO 账户
    String recoveryCode = generateRecoveryCode();
    String recoveryCodeHash = passwordEncoder.encode(recoveryCode);
    Long ceoId = createCeoAccount(request, recoveryCodeHash);
    log.info("CEO 账户创建成功: id={}, employeeNo=CEO001", ceoId);

    // 步骤 2: 创建 HR 账户
    Long hrId = createHrAccount(request);
    log.info("HR 账户创建成功: id={}, employeeNo=HR001", hrId);

    // 步骤 3: 可选创建运营总监账户
    if (isNotBlank(request.opsName()) && isNotBlank(request.opsPhone())) {
      Long opsId = createOpsAccount(request);
      log.info("运营总监账户创建成功: id={}, employeeNo=OPS001", opsId);
    }

    // 步骤 4: 可选创建总经理账户
    if (isNotBlank(request.gmName()) && isNotBlank(request.gmPhone())) {
      Long gmId = createGmAccount(request);
      log.info("总经理账户创建成功: id={}, employeeNo=GM001", gmId);
    }

    // 步骤 5: 可选创建自定义角色
    if (request.customRoles() != null && !request.customRoles().isEmpty()) {
      createCustomRoles(request.customRoles());
      log.info("自定义角色创建成功: count={}", request.customRoles().size());
    }

    // 保存企业名称（若有）
    if (request.companyName() != null && !request.companyName().isBlank()) {
      systemConfigMapper.setValue(KEY_COMPANY_NAME, request.companyName().trim(), "企业名称");
    }

    // 标记系统已初始化
    systemConfigMapper.setValue(KEY_INITIALIZED, "true", "系统初始化状态");
    systemConfigMapper.setValue(KEY_INITIALIZED_AT, LocalDateTime.now().toString(), "系统初始化时间");

    log.info("系统初始化完成");

    return new SetupResult(recoveryCode, "系统初始化成功");
  }

  /** 开发环境重置初始化状态。 仅在开发环境使用，将 initialized 标记为 false。 */
  public void resetForDev() {
    systemConfigMapper.updateValue(KEY_INITIALIZED, "false");
    log.info("开发环境：系统初始化状态已重置");
  }

  /**
   * Marks the system as initialized for development environment. Used when working with pre-seeded
   * dev data without running the setup wizard. Sets the initialized flag to true without creating
   * any accounts.
   */
  public void markInitializedForDev() {
    systemConfigMapper.setValue(KEY_INITIALIZED, "true", "系统初始化状态");
    log.info("Dev: system marked as initialized");
  }

  /**
   * 验证恢复码并轮换。 验证提供的恢复码是否匹配存储的哈希值，如果匹配则生成新恢复码并更新存储。
   *
   * @param code 待验证的恢复码
   * @return 新的恢复码（明文）
   * @throws IllegalArgumentException 如果恢复码不匹配
   */
  @Transactional
  public String verifyAndRotateRecoveryCode(String code) {
    if (code == null || code.isBlank()) {
      throw new IllegalArgumentException("恢复码不能为空");
    }

    String storedHash = systemConfigMapper.getValue(KEY_RECOVERY_CODE_HASH);
    if (storedHash == null) {
      throw new IllegalStateException("恢复码未设置");
    }

    if (!passwordEncoder.matches(code, storedHash)) {
      throw new IllegalArgumentException("恢复码不正确");
    }

    // 生成新恢复码
    String newCode = generateRecoveryCode();
    String newHash = passwordEncoder.encode(newCode);
    systemConfigMapper.updateValue(KEY_RECOVERY_CODE_HASH, newHash);

    log.info("恢复码已轮换");
    return newCode;
  }

  /**
   * 使用恢复码重置 CEO 密码。
   *
   * @param recoveryCode 恢复码
   * @param newPassword 新密码
   * @return 新的恢复码
   */
  @Transactional
  public String resetCeoPassword(String recoveryCode, String newPassword) {
    // 验证并轮换恢复码
    String newRecoveryCode = verifyAndRotateRecoveryCode(recoveryCode);

    // 查找 CEO 账户
    Employee ceo =
        employeeMapper.selectOne(
            new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Employee>()
                .eq(Employee::getEmployeeNo, "CEO001")
                .eq(Employee::getDeleted, 0));

    if (ceo == null) {
      throw new IllegalStateException("CEO 账户不存在");
    }

    // 更新密码
    ceo.setPasswordHash(passwordEncoder.encode(newPassword));
    ceo.setIsDefaultPassword(false);
    ceo.setUpdatedAt(LocalDateTime.now());
    employeeMapper.updateById(ceo);

    log.info("CEO 密码已重置");
    return newRecoveryCode;
  }

  // ==================== Private Helpers ====================

  private void validateRequired(String value, String fieldName) {
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException(fieldName + "不能为空");
    }
  }

  private boolean isNotBlank(String value) {
    return value != null && !value.isBlank();
  }

  private String generateRecoveryCode() {
    return UUID.randomUUID().toString().replace("-", "").substring(0, 32);
  }

  private Long createCeoAccount(SetupRequest request, String recoveryCodeHash) {
    // 确保 CEO 角色存在
    ensureRoleExists("ceo", "首席执行官", "管理全局配置、终审审批、配置角色权限、查看经营总览");

    Employee ceo = new Employee();
    ceo.setEmployeeNo("CEO001");
    ceo.setPasswordHash(passwordEncoder.encode(request.ceoPassword()));
    ceo.setIsDefaultPassword(false);
    ceo.setName(request.ceoName());
    ceo.setPhone(request.ceoPhone());
    ceo.setRoleCode("ceo");
    ceo.setEmployeeType("OFFICE");
    ceo.setAccountStatus("ACTIVE");
    ceo.setEntryDate(LocalDate.now());
    ceo.setCreatedAt(LocalDateTime.now());
    ceo.setUpdatedAt(LocalDateTime.now());
    ceo.setDeleted(0);

    employeeMapper.insert(ceo);

    // 存储恢复码哈希
    systemConfigMapper.setValue(KEY_RECOVERY_CODE_HASH, recoveryCodeHash, "CEO 恢复码哈希（用于密码重置）");

    return ceo.getId();
  }

  private Long createHrAccount(SetupRequest request) {
    // 确保 HR 角色存在
    ensureRoleExists("hr", "人力资源", "维护人员与薪资配置，执行结算、复核异议、导出数据");

    Employee hr = new Employee();
    hr.setEmployeeNo("HR001");
    hr.setPasswordHash(passwordEncoder.encode(DEFAULT_PASSWORD));
    hr.setIsDefaultPassword(true);
    hr.setName(request.hrName());
    hr.setPhone(request.hrPhone());
    hr.setRoleCode("hr");
    hr.setEmployeeType("OFFICE");
    hr.setAccountStatus("ACTIVE");
    hr.setEntryDate(LocalDate.now());
    hr.setCreatedAt(LocalDateTime.now());
    hr.setUpdatedAt(LocalDateTime.now());
    hr.setDeleted(0);

    employeeMapper.insert(hr);
    return hr.getId();
  }

  private Long createOpsAccount(SetupRequest request) {
    ensureRoleExists("ops", "运维", "系统运维，仅访问运维工具与操作日志，不参与业务流程");

    Employee ops = new Employee();
    ops.setEmployeeNo("OPS001");
    ops.setPasswordHash(passwordEncoder.encode(DEFAULT_PASSWORD));
    ops.setIsDefaultPassword(true);
    ops.setName(request.opsName());
    ops.setPhone(request.opsPhone());
    ops.setRoleCode("ops");
    ops.setEmployeeType("OFFICE");
    ops.setAccountStatus("ACTIVE");
    ops.setEntryDate(LocalDate.now());
    ops.setCreatedAt(LocalDateTime.now());
    ops.setUpdatedAt(LocalDateTime.now());
    ops.setDeleted(0);

    employeeMapper.insert(ops);
    return ops.getId();
  }

  private Long createGmAccount(SetupRequest request) {
    ensureRoleExists("general_manager", "总经理", "负责全面经营管理");

    Employee gm = new Employee();
    gm.setEmployeeNo("GM001");
    gm.setPasswordHash(passwordEncoder.encode(DEFAULT_PASSWORD));
    gm.setIsDefaultPassword(true);
    gm.setName(request.gmName());
    gm.setPhone(request.gmPhone());
    gm.setRoleCode("general_manager");
    gm.setEmployeeType("OFFICE");
    gm.setAccountStatus("ACTIVE");
    gm.setEntryDate(LocalDate.now());
    gm.setCreatedAt(LocalDateTime.now());
    gm.setUpdatedAt(LocalDateTime.now());
    gm.setDeleted(0);

    employeeMapper.insert(gm);
    return gm.getId();
  }

  private void ensureRoleExists(String roleCode, String roleName, String description) {
    Role existing =
        roleMapper.selectOne(
            new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Role>()
                .eq(Role::getRoleCode, roleCode));

    if (existing == null) {
      Role role = new Role();
      role.setRoleCode(roleCode);
      role.setRoleName(roleName);
      role.setDescription(description);
      role.setStatus(1);
      role.setIsSystem(1);
      role.setCreateTime(LocalDateTime.now());
      role.setUpdateTime(LocalDateTime.now());
      roleMapper.insert(role);
    }
  }

  private void createCustomRoles(List<CustomRoleRequest> roles) {
    for (CustomRoleRequest roleReq : roles) {
      if (roleReq.code() == null
          || roleReq.code().isBlank()
          || roleReq.name() == null
          || roleReq.name().isBlank()) {
        continue;
      }

      Role role = new Role();
      role.setRoleCode(roleReq.code());
      role.setRoleName(roleReq.name());
      role.setDescription(roleReq.description());
      role.setStatus(1);
      role.setIsSystem(0);
      role.setCreateTime(LocalDateTime.now());
      role.setUpdateTime(LocalDateTime.now());
      roleMapper.insert(role);
    }
  }

  // ==================== Inner Records ====================

  /**
   * 初始化请求。
   *
   * @param ceoName CEO 姓名（必填）
   * @param ceoPhone CEO 手机号（必填）
   * @param ceoPassword CEO 密码（必填，至少 8 位）
   * @param hrName HR 姓名（必填）
   * @param hrPhone HR 手机号（必填）
   * @param opsName 运营总监姓名（可选）
   * @param opsPhone 运营总监手机号（可选）
   * @param gmName 总经理姓名（可选）
   * @param gmPhone 总经理手机号（可选）
   * @param customRoles 自定义角色列表（可选）
   */
  public record SetupRequest(
      String companyName,
      String ceoName,
      String ceoPhone,
      String ceoPassword,
      String hrName,
      String hrPhone,
      String opsName,
      String opsPhone,
      String gmName,
      String gmPhone,
      List<CustomRoleRequest> customRoles) {}

  /**
   * 自定义角色请求。
   *
   * @param code 角色编码（必填）
   * @param name 角色名称（必填）
   * @param description 角色描述（可选）
   */
  public record CustomRoleRequest(String code, String name, String description) {}

  /**
   * 初始化结果。
   *
   * @param recoveryCode CEO 恢复码（明文，仅返回一次）
   * @param message 结果消息
   */
  public record SetupResult(String recoveryCode, String message) {}
}
