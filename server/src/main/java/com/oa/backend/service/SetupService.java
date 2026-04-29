package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.oa.backend.dto.PositionLevelUpsertRequest;
import com.oa.backend.dto.PositionResponse;
import com.oa.backend.dto.RoleUpsertRequest;
import com.oa.backend.dto.SetupFinalizeRequest;
import com.oa.backend.entity.ApprovalFlowDef;
import com.oa.backend.entity.Department;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.RetentionPolicy;
import com.oa.backend.entity.Role;
import com.oa.backend.mapper.DepartmentMapper;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.RetentionPolicyMapper;
import com.oa.backend.mapper.RoleMapper;
import com.oa.backend.mapper.SystemConfigMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
 *   <li>finalize 阶段（DEF-SETUP-04 C2）使用独立的 wizard_finalize_token，避免与恢复码语义混用
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
  private static final String KEY_FINALIZE_COMPLETED = "wizard_finalize_completed";
  private static final String KEY_FINALIZE_TOKEN = "wizard_finalize_token";
  private static final String DEFAULT_PASSWORD = "123456";
  private static final SecureRandom SECURE_RANDOM = new SecureRandom();

  private final SystemConfigMapper systemConfigMapper;
  private final EmployeeMapper employeeMapper;
  private final RoleMapper roleMapper;
  private final DepartmentMapper departmentMapper;
  private final RetentionPolicyMapper retentionPolicyMapper;
  private final PasswordEncoder passwordEncoder;
  // services injected for finalize step orchestration; controller-layer rule
  // forbids Mapper injection in controllers, but service-to-service injection
  // is allowed and preferred for business reuse.
  private final EmployeeService employeeService;
  private final PositionService positionService;
  private final OrgService orgService;
  private final SystemConfigService systemConfigService;
  private final ApprovalFlowService approvalFlowService;
  // D-M08 finalize 双写：DB sys_role 之外，同时把角色注入 AccessManagementService 内存存储，
  // 与运营态 POST /api/roles 写入路径保持一致；DEF-ROLE-01 修复完成后此双写可统一收敛。
  private final AccessManagementService accessManagementService;

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
   * 检查 finalize（step 5-10 原子提交）是否已完成。
   *
   * @return 如果 wizard_finalize_completed 为 "true" 返回 true，否则返回 false
   */
  public boolean isFinalizeCompleted() {
    String value = systemConfigMapper.getValue(KEY_FINALIZE_COMPLETED);
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
   *   <li>生成 finalize 幂等性令牌（哈希入库，明文返回前端缓存）
   *   <li>标记系统已初始化
   * </ol>
   *
   * @param request 初始化请求，包含账户信息和可选配置
   * @return 初始化结果，包含恢复码（仅返回一次）和 finalize 令牌
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

    // 生成 finalize 幂等性令牌（明文返回，哈希入库）
    String finalizeToken = generateFinalizeToken();
    String finalizeTokenHash = sha256Hex(finalizeToken);
    systemConfigMapper.setValue(
        KEY_FINALIZE_TOKEN, finalizeTokenHash, "初始化向导 finalize 幂等性令牌（SHA-256 哈希）");
    // ensure completed flag is explicitly false (V21 seeded it, but keep idempotent)
    systemConfigMapper.setValue(KEY_FINALIZE_COMPLETED, "false", "初始化向导 step 5-10 finalize 完成标记");

    // 标记系统已初始化
    systemConfigMapper.setValue(KEY_INITIALIZED, "true", "系统初始化状态");
    systemConfigMapper.setValue(KEY_INITIALIZED_AT, LocalDateTime.now().toString(), "系统初始化时间");

    log.info("系统初始化完成");

    return new SetupResult(recoveryCode, finalizeToken, "系统初始化成功");
  }

  /** 开发环境重置初始化状态。 仅在开发环境使用，将 initialized 标记为 false。 */
  public void resetForDev() {
    systemConfigMapper.updateValue(KEY_INITIALIZED, "false");
    log.info("开发环境：系统初始化状态已重置");
  }

  /**
   * 开发环境重置 finalize 状态。
   *
   * <p>将 wizard_finalize_completed 重置为 "false"，清空 wizard_finalize_token。 业务数据（角色、员工、配置等）的清理由调用方
   * /dev/reset-finalize 端点单独处理（复用 /dev/reset 的清理逻辑并补齐 finalize 写入的特殊项）。
   */
  public void resetFinalizeForDev() {
    systemConfigMapper.updateValue(KEY_FINALIZE_COMPLETED, "false");
    systemConfigMapper.updateValue(KEY_FINALIZE_TOKEN, null);
    log.info("开发环境：finalize 状态已重置");
  }

  /**
   * Marks the system as initialized for development environment. Used when working with pre-seeded
   * dev data without running the setup wizard. Sets the initialized flag to true without creating
   * any accounts.
   */
  public void markInitializedForDev() {
    // Use updateValue (standard SQL UPDATE) — setValue uses H2-only MERGE INTO syntax.
    // The 'initialized' key always exists in the seeded system_config table.
    systemConfigMapper.updateValue(KEY_INITIALIZED, "true");
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

  /**
   * 初始化向导 step 5-10 原子提交（DEF-SETUP-04 C2）。
   *
   * <p>鉴权：比对 SHA-256 哈希后的 wizard_finalize_token，避免与恢复码语义混用。
   *
   * <p>幂等：wizard_finalize_completed=true 时拒绝重复提交。
   *
   * <p>事务：{@code @Transactional(rollbackFor = Exception.class)} 确保任一步骤失败全部回滚。
   *
   * @param request finalize 请求体
   * @throws IllegalArgumentException 令牌为空或不匹配
   * @throws IllegalStateException finalize 已完成 / token 未设置
   */
  @Transactional(rollbackFor = Exception.class)
  public void finalizeWizard(SetupFinalizeRequest request) {
    // step ordering rationale (do not reorder without checking the dependency chain):
    //   step 5 (roles) MUST run before step 6 (employees) — employee.role_code references
    //     custom roles introduced here.
    //   step 5 (roles) MUST run before step 9 (approval flows) — approver_type=ROLE
    //     entries reference role codes.
    //   step 6 (employees) MUST run before step 7 (organization) — supervisor mappings
    //     are resolved via the tempId→realId map populated in applyEmployeeImport.
    //   step 8/10 are independent and may run anywhere after token validation.
    if (request == null) {
      throw new IllegalArgumentException("finalize 请求不能为空");
    }
    validateRequired(request.wizardFinalizeToken(), "finalize 令牌");

    // 1. 校验幂等性
    if (isFinalizeCompleted()) {
      throw new IllegalStateException("初始化向导已完成，不能重复提交");
    }

    // 2. 校验令牌（constant-time 比较防止时序攻击）
    String storedHash = systemConfigMapper.getValue(KEY_FINALIZE_TOKEN);
    if (storedHash == null || storedHash.isBlank()) {
      throw new IllegalStateException("finalize 令牌未设置");
    }
    String providedHash = sha256Hex(request.wizardFinalizeToken());
    if (!MessageDigest.isEqual(
        storedHash.getBytes(StandardCharsets.UTF_8),
        providedHash.getBytes(StandardCharsets.UTF_8))) {
      throw new IllegalArgumentException("finalize 令牌不正确");
    }

    // 3. 按依赖顺序应用 step 5-10
    //    tempIdToEmployeeId 在 step 6 中填充，供 step 7 汇报关系解析
    Map<String, Long> tempIdToEmployeeId = new HashMap<>();
    applyRoles(request.roles());
    applyEmployeeImport(request.employeeImport(), tempIdToEmployeeId);
    applyOrganization(request.organization(), tempIdToEmployeeId);
    applyGlobalConfig(request.globalConfig());
    applyApprovalFlows(request.approvalFlows());
    applyRetention(request.retention());

    // 4. 标记完成 + 清空令牌
    systemConfigMapper.updateValue(KEY_FINALIZE_COMPLETED, "true");
    systemConfigMapper.updateValue(KEY_FINALIZE_TOKEN, null);
    log.info("初始化向导 finalize 完成");
  }

  // ==================== Finalize Step Helpers ====================

  /**
   * step 5：自定义角色（fail-fast，缺关键字段或与系统内置角色冲突 → 抛异常触发回滚）。
   *
   * <p>顶层已经校验过 roles==null 视为跳过；进入此方法即视为有内容，每条 entry 必须完整。
   *
   * <p>D-M08 双写策略：DB {@code sys_role} 之外，同时调 {@link AccessManagementService#createRole} 写入内存， 与运营态
   * POST /api/roles 一致。permissions 字段不做白名单校验（合法性属于 DEF-ROLE-01 范畴）。
   * AccessManagementService.createRole 抛异常 → 让 {@code @Transactional(rollbackFor =
   * Exception.class)} 整体回滚 DB 部分；接受"@Transactional 不回滚内存"的弱一致性现状（DEF-ROLE-01 修复范畴）。
   */
  private void applyRoles(List<SetupFinalizeRequest.RoleConfigDto> roles) {
    if (roles == null || roles.isEmpty()) return;
    for (int i = 0; i < roles.size(); i++) {
      SetupFinalizeRequest.RoleConfigDto r = roles.get(i);
      if (r == null) {
        throw new IllegalArgumentException("roles[" + i + "] 不能为 null");
      }
      if (r.code() == null || r.code().isBlank()) {
        throw new IllegalArgumentException("roles[" + i + "].code 为空");
      }
      String code = r.code();
      String name = r.name() == null ? code : r.name();
      // P2-3：与系统内置角色冲突时给出明确错误，而不是依赖 unique-index 的原始约束异常
      Role existing = roleMapper.selectOne(new QueryWrapper<Role>().eq("role_code", code));
      if (existing != null) {
        throw new IllegalArgumentException("自定义角色编码 " + code + " 与系统内置角色冲突");
      }
      Role role = new Role();
      role.setRoleCode(code);
      role.setRoleName(name);
      role.setDescription(r.description());
      role.setStatus(1);
      role.setIsSystem(0);
      role.setCreateTime(LocalDateTime.now());
      role.setUpdateTime(LocalDateTime.now());
      roleMapper.insert(role);
      // 双写：注入 AccessManagementService 内存（与运营态 /api/roles 创建路径一致）；
      // permissions=null 时传 emptyList（AccessManagementService.normalizePermissions 同样接受 null，
      // 但显式传 emptyList 让契约更清晰）。
      List<String> permissions = r.permissions() == null ? List.of() : r.permissions();
      accessManagementService.createRole(
          new RoleUpsertRequest(code, name, r.description(), 1, permissions));
    }
    log.info("finalize step 5: created {} custom role(s)", roles.size());
  }

  /**
   * step 6：员工批量导入（部门 → 岗位/等级 → 员工）。
   *
   * <p>员工创建后将其 tempId → 真实 id 写入 {@code tempIdMap}，供 step 7 解析汇报关系。 同一 finalize 请求中 tempId 必须唯一，否则抛
   * IllegalArgumentException。
   */
  private void applyEmployeeImport(
      SetupFinalizeRequest.EmployeeImportDto dto, Map<String, Long> tempIdMap) {
    if (dto == null) return;
    if (dto.departments() != null) {
      for (int i = 0; i < dto.departments().size(); i++) {
        SetupFinalizeRequest.DepartmentDto d = dto.departments().get(i);
        if (d == null) {
          throw new IllegalArgumentException("employeeImport.departments[" + i + "] 不能为 null");
        }
        if (d.name() == null || d.name().isBlank()) {
          throw new IllegalArgumentException("employeeImport.departments[" + i + "].name 为空");
        }
        Department dept = new Department();
        dept.setParentId(d.parentId());
        dept.setName(d.name());
        dept.setSort(d.sort() == null ? 0 : d.sort());
        dept.setCreatedAt(LocalDateTime.now());
        dept.setUpdatedAt(LocalDateTime.now());
        dept.setDeleted(0);
        departmentMapper.insert(dept);
      }
    }
    if (dto.positions() != null) {
      for (int i = 0; i < dto.positions().size(); i++) {
        SetupFinalizeRequest.PositionDto p = dto.positions().get(i);
        if (p == null) {
          throw new IllegalArgumentException("employeeImport.positions[" + i + "] 不能为 null");
        }
        if (p.position() == null) {
          throw new IllegalArgumentException("employeeImport.positions[" + i + "].position 为空");
        }
        PositionResponse created = positionService.createPosition(p.position());
        if (p.levels() != null) {
          for (int j = 0; j < p.levels().size(); j++) {
            PositionLevelUpsertRequest lvl = p.levels().get(j);
            if (lvl == null) {
              throw new IllegalArgumentException(
                  "employeeImport.positions[" + i + "].levels[" + j + "] 不能为 null");
            }
            positionService.createLevel(created.id(), lvl);
          }
        }
      }
    }
    if (dto.employees() != null) {
      for (int i = 0; i < dto.employees().size(); i++) {
        SetupFinalizeRequest.EmployeeImportEntryDto entry = dto.employees().get(i);
        if (entry == null) {
          throw new IllegalArgumentException("employeeImport.employees[" + i + "] 不能为 null");
        }
        if (entry.tempId() == null || entry.tempId().isBlank()) {
          throw new IllegalArgumentException("employeeImport.employees[" + i + "].tempId 为空");
        }
        if (entry.payload() == null) {
          throw new IllegalArgumentException("employeeImport.employees[" + i + "].payload 为空");
        }
        if (tempIdMap.containsKey(entry.tempId())) {
          throw new IllegalArgumentException("员工 tempId 重复: " + entry.tempId());
        }
        Employee created = employeeService.createEmployee(entry.payload());
        tempIdMap.put(entry.tempId(), created.getId());
      }
    }
    log.info("finalize step 6: employee import applied (tempId map size={})", tempIdMap.size());
  }

  /**
   * step 7：汇报关系（通过 tempId 解析为真实员工 id）。
   *
   * <p>未知 tempId → IllegalArgumentException 触发整体回滚。 supervisorTempId == null 表示清空汇报关系，向 OrgService
   * 传入 null 即可。
   */
  private void applyOrganization(
      SetupFinalizeRequest.OrganizationDto dto, Map<String, Long> tempIdMap) {
    if (dto == null || dto.supervisors() == null) return;
    for (int i = 0; i < dto.supervisors().size(); i++) {
      SetupFinalizeRequest.SupervisorMappingDto m = dto.supervisors().get(i);
      if (m == null) {
        throw new IllegalArgumentException("organization.supervisors[" + i + "] 不能为 null");
      }
      if (m.employeeTempId() == null || m.employeeTempId().isBlank()) {
        throw new IllegalArgumentException("organization.supervisors[" + i + "].employeeTempId 为空");
      }
      Long employeeId = tempIdMap.get(m.employeeTempId());
      if (employeeId == null) {
        throw new IllegalArgumentException("未知的员工 tempId: " + m.employeeTempId());
      }
      Long supervisorId = null;
      if (m.supervisorTempId() != null && !m.supervisorTempId().isBlank()) {
        supervisorId = tempIdMap.get(m.supervisorTempId());
        if (supervisorId == null) {
          throw new IllegalArgumentException("未知的员工 tempId: " + m.supervisorTempId());
        }
      }
      orgService.updateSupervisor(employeeId, supervisorId);
    }
    log.info("finalize step 7: applied {} supervisor mappings", dto.supervisors().size());
  }

  /** step 8：全局配置（fail-fast）。 */
  private void applyGlobalConfig(SetupFinalizeRequest.GlobalConfigDto dto) {
    if (dto == null || dto.entries() == null) return;
    for (int i = 0; i < dto.entries().size(); i++) {
      SetupFinalizeRequest.ConfigEntryDto e = dto.entries().get(i);
      if (e == null) {
        throw new IllegalArgumentException("globalConfig.entries[" + i + "] 不能为 null");
      }
      if (e.key() == null || e.key().isBlank()) {
        throw new IllegalArgumentException("globalConfig.entries[" + i + "].key 为空");
      }
      systemConfigService.upsertConfig(e.key(), e.value(), e.description());
    }
    log.info("finalize step 8: upserted {} system_config entries", dto.entries().size());
  }

  /**
   * step 9：审批流节点替换。
   *
   * <p>使用 businessType 解析为 flowId（前端复用 ApprovalFlowPanel 组件，吐出 businessType 字符串）。 businessType
   * 在数据库中为大写枚举（LEAVE/OVERTIME/...），此处统一 toUpperCase 后再查询。
   */
  private void applyApprovalFlows(List<SetupFinalizeRequest.ApprovalFlowDto> flows) {
    if (flows == null) return;
    for (int i = 0; i < flows.size(); i++) {
      SetupFinalizeRequest.ApprovalFlowDto f = flows.get(i);
      if (f == null) {
        throw new IllegalArgumentException("approvalFlows[" + i + "] 不能为 null");
      }
      if (f.businessType() == null || f.businessType().isBlank()) {
        throw new IllegalArgumentException("approvalFlows[" + i + "].businessType 为空");
      }
      if (f.nodes() == null || f.nodes().isEmpty()) {
        throw new IllegalArgumentException("approvalFlows[" + i + "].nodes 为空");
      }
      String businessType = f.businessType().toUpperCase();
      ApprovalFlowDef def = approvalFlowService.findActiveFlowDefByBusinessType(businessType);
      if (def == null) {
        throw new IllegalArgumentException("无效的审批流业务类型: " + businessType);
      }
      List<ApprovalFlowService.ApprovalFlowNodeSpec> specs =
          f.nodes().stream()
              .filter(n -> n != null)
              .map(
                  n ->
                      new ApprovalFlowService.ApprovalFlowNodeSpec(
                          n.nodeName(), n.approverType(), n.approverRef(), n.skipCondition()))
              .toList();
      approvalFlowService.replaceFlowNodes(def.getId(), specs);
    }
    log.info("finalize step 9: replaced nodes for {} flow(s)", flows.size());
  }

  /** step 10：数据保留期。upsert 语义 — 已存在则更新年限/警告，否则插入。 fail-fast：dataType 缺失即抛异常。 */
  private void applyRetention(SetupFinalizeRequest.RetentionDto dto) {
    if (dto == null || dto.policies() == null) return;
    for (int i = 0; i < dto.policies().size(); i++) {
      SetupFinalizeRequest.RetentionPolicyDto p = dto.policies().get(i);
      if (p == null) {
        throw new IllegalArgumentException("retention.policies[" + i + "] 不能为 null");
      }
      if (p.dataType() == null || p.dataType().isBlank()) {
        throw new IllegalArgumentException("retention.policies[" + i + "].dataType 为空");
      }
      RetentionPolicy existing = retentionPolicyMapper.findByDataType(p.dataType());
      if (existing != null) {
        existing.setRetentionYears(p.retentionYears());
        existing.setWarnBeforeDays(p.warnBeforeDays());
        existing.setUpdatedAt(LocalDateTime.now());
        retentionPolicyMapper.updateById(existing);
      } else {
        RetentionPolicy policy = new RetentionPolicy();
        policy.setDataType(p.dataType());
        policy.setRetentionYears(p.retentionYears());
        policy.setWarnBeforeDays(p.warnBeforeDays());
        policy.setCreatedAt(LocalDateTime.now());
        policy.setUpdatedAt(LocalDateTime.now());
        policy.setDeleted(0);
        retentionPolicyMapper.insert(policy);
      }
    }
    log.info("finalize step 10: applied {} retention policies", dto.policies().size());
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

  /**
   * 生成 finalize 幂等性令牌：32 位 secure random（base64url，无填充）。 与恢复码隔离，避免 verifyAndRotateRecoveryCode
   * 的轮换语义影响 finalize 鉴权。
   */
  private String generateFinalizeToken() {
    byte[] bytes = new byte[24]; // 24 bytes → 32 chars base64url
    SECURE_RANDOM.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  /** SHA-256(input) → hex string；用于 finalize 令牌入库存储与比对。 */
  private String sha256Hex(String input) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
      StringBuilder sb = new StringBuilder(digest.length * 2);
      for (byte b : digest) {
        sb.append(String.format("%02x", b));
      }
      return sb.toString();
    } catch (NoSuchAlgorithmException e) {
      // SHA-256 is part of every JRE; this branch is unreachable in practice.
      throw new IllegalStateException("SHA-256 algorithm not available", e);
    }
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
    ensureRoleExists("sys_admin", "系统管理员", "系统运维，仅访问运维工具与操作日志，不参与业务流程");

    Employee sysAdmin = new Employee();
    sysAdmin.setEmployeeNo("SYS_ADMIN001");
    sysAdmin.setPasswordHash(passwordEncoder.encode(DEFAULT_PASSWORD));
    sysAdmin.setIsDefaultPassword(true);
    sysAdmin.setName(request.opsName());
    sysAdmin.setPhone(request.opsPhone());
    sysAdmin.setRoleCode("sys_admin");
    sysAdmin.setEmployeeType("OFFICE");
    sysAdmin.setAccountStatus("ACTIVE");
    sysAdmin.setEntryDate(LocalDate.now());
    sysAdmin.setCreatedAt(LocalDateTime.now());
    sysAdmin.setUpdatedAt(LocalDateTime.now());
    sysAdmin.setDeleted(0);

    employeeMapper.insert(sysAdmin);
    return sysAdmin.getId();
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
   * @param wizardFinalizeToken finalize 阶段使用的明文幂等性令牌（仅返回一次，前端在 reactive state 缓存）
   * @param message 结果消息
   */
  public record SetupResult(String recoveryCode, String wizardFinalizeToken, String message) {}
}
