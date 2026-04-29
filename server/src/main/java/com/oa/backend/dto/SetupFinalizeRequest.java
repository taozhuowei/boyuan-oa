package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/**
 * 初始化向导 step 5-10 原子提交请求（DEF-SETUP-04 C2）。
 *
 * <p>设计决策：除 {@code wizardFinalizeToken} 外其他顶层字段全部 nullable，对应"用户跳过该步骤"语义。 任一步骤的 service
 * 调用失败均触发整体事务回滚， 不会出现"角色已建但员工未建"的中间态。
 *
 * <p>各字段对应的现有 service 方法：
 *
 * <ul>
 *   <li>{@code roles} → {@link com.oa.backend.service.SetupService#createCustomRoles} 的扩展（直写
 *       RoleMapper）
 *   <li>{@code employeeImport.departments} → {@link
 *       com.oa.backend.service.DepartmentService#createDepartment}
 *   <li>{@code employeeImport.positions} → {@link
 *       com.oa.backend.service.PositionService#createPosition}（含 levels）
 *   <li>{@code employeeImport.employees} → {@link
 *       com.oa.backend.service.EmployeeService#createEmployee}
 *   <li>{@code organization.supervisors} → {@link
 *       com.oa.backend.service.OrgService#updateSupervisor}
 *   <li>{@code globalConfig.entries} → {@link
 *       com.oa.backend.service.SystemConfigService#upsertConfig}
 *   <li>{@code approvalFlows} → {@link com.oa.backend.service.ApprovalFlowService#replaceFlowNodes}
 *   <li>{@code retention.policies} → 直写 RetentionPolicyMapper（RetentionService 无 upsert API）
 * </ul>
 *
 * @param wizardFinalizeToken 由 /setup/init 返回的明文幂等性令牌；后端比对其 SHA-256 哈希
 * @param roles step 5：自定义角色清单（null 或空数组 = 跳过）
 * @param employeeImport step 6：员工批量导入（null = 跳过）
 * @param organization step 7：组织架构汇报关系（null = 跳过）
 * @param globalConfig step 8：全局配置（null = 跳过）
 * @param approvalFlows step 9：审批流配置（null = 跳过）
 * @param retention step 10：数据保留期（null = 跳过）
 */
public record SetupFinalizeRequest(
    @NotBlank(message = "finalize 令牌不能为空") String wizardFinalizeToken,
    List<RoleConfigDto> roles,
    EmployeeImportDto employeeImport,
    OrganizationDto organization,
    GlobalConfigDto globalConfig,
    List<ApprovalFlowDto> approvalFlows,
    RetentionDto retention) {

  /**
   * step 5：自定义角色配置项。
   *
   * <p>{@code permissions} 与运营态 /api/roles 的 RoleUpsertRequest.permissions 字段保持一致命名；
   * 不在此层做白名单校验（权限码合法性属于 DEF-ROLE-01 范畴），null/空数组 = 无权限。
   *
   * @param code 角色编码（小写、下划线）
   * @param name 角色显示名
   * @param description 角色描述（可选）
   * @param permissions 权限字符串列表（可选；null 或空数组表示无权限）
   */
  public record RoleConfigDto(
      String code, String name, String description, List<String> permissions) {}

  /**
   * step 6：员工批量导入数据包。 字段顺序对应导入依赖：先建部门 → 再建岗位/等级 → 最后建员工。
   *
   * @param departments 部门列表（按 sort 升序传入）
   * @param positions 岗位列表（含等级）
   * @param employees 员工列表（每项含 tempId 客户端句柄 + payload 真实创建参数）
   */
  public record EmployeeImportDto(
      List<DepartmentDto> departments,
      List<PositionDto> positions,
      List<EmployeeImportEntryDto> employees) {}

  /**
   * step 6 员工条目：将客户端临时句柄 {@code tempId} 与员工创建参数绑定。
   *
   * <p>tempId 由前端生成（如 "emp-1"、"emp-2"），仅在 finalize 单次事务内使用； SetupService 在 finalize 流程中维护 {@code
   * Map<tempId, realId>}，供 step 7 汇报关系等跨引用解析。 finalize 提交完成后 tempId 即失效，不写入数据库。
   *
   * @param tempId 客户端为该员工生成的临时句柄；同一 finalize 请求体内须保持唯一
   * @param payload 员工创建实际参数（复用 EmployeeCreateRequest）
   */
  public record EmployeeImportEntryDto(
      @NotBlank(message = "员工 tempId 不能为空") String tempId, EmployeeCreateRequest payload) {}

  /**
   * 部门简化 DTO（替代直接暴露 Department 实体）。
   *
   * @param parentId 上级部门 ID（顶级为 null）
   * @param name 部门名称
   * @param sort 排序号（可选，默认 0）
   */
  public record DepartmentDto(Long parentId, @NotBlank String name, Integer sort) {}

  /**
   * 岗位 DTO（包装 PositionUpsertRequest + 等级清单）。
   *
   * @param position 岗位主体（复用现有 upsert DTO）
   * @param levels 该岗位下的等级列表（可选）
   */
  public record PositionDto(
      PositionUpsertRequest position, List<PositionLevelUpsertRequest> levels) {}

  /**
   * step 7：组织架构汇报关系。
   *
   * @param supervisors 汇报关系列表，每项 {employeeTempId, supervisorTempId}（基于前端句柄，由 finalize 事务解析为真实 ID）
   */
  public record OrganizationDto(List<SupervisorMappingDto> supervisors) {}

  /**
   * 汇报关系映射项（基于前端临时句柄）。
   *
   * <p>finalize 单次原子提交时，员工真实 ID 在 employee 写入完成前不存在，因此此处通过前端在 step 6 为每位员工分配的 tempId 引用，由
   * SetupService 在事务内解析为真实 ID 后再调 OrgService.updateSupervisor。 任一 tempId 在 step 6 员工列表中不存在 → 抛
   * IllegalArgumentException 触发整体回滚。
   *
   * @param employeeTempId 下级员工的客户端句柄（必须与 {@link EmployeeImportEntryDto#tempId} 对应）
   * @param supervisorTempId 直系领导的客户端句柄（null 表示清空汇报关系）
   */
  public record SupervisorMappingDto(
      @NotBlank(message = "supervisor mapping employeeTempId 不能为空") String employeeTempId,
      String supervisorTempId) {}

  /**
   * step 8：全局配置（薪资周期、补贴等 system_config 键值对）。
   *
   * @param entries 配置项列表
   */
  public record GlobalConfigDto(List<ConfigEntryDto> entries) {}

  /**
   * 单个 system_config 配置项。
   *
   * @param key 配置键
   * @param value 配置值（字符串化；JSON 配置须由前端序列化）
   * @param description 描述（仅新建时写入，更新时忽略）
   */
  public record ConfigEntryDto(@NotBlank String key, String value, String description) {}

  /**
   * step 9：审批流配置项（每条对应一个审批流定义的节点替换）。
   *
   * <p>使用 businessType 作为业务键以匹配现有 PUT {@code /approval/flows/{businessType}} 端点的契约； SetupService 在
   * finalize 流程中通过 {@link
   * com.oa.backend.service.ApprovalFlowService#findActiveFlowDefByBusinessType} 解析为内部 flowId
   * 后再替换节点。
   *
   * @param businessType 审批流业务类型（如 "LEAVE"、"OVERTIME"），大小写不敏感，内部统一转为大写
   * @param nodes 节点列表（顺序即审批顺序）
   */
  public record ApprovalFlowDto(
      @NotBlank(message = "审批流 businessType 不能为空") String businessType,
      @NotEmpty(message = "审批流 nodes 不能为空") List<ApprovalFlowNodeDto> nodes) {}

  /**
   * 审批流节点 DTO。
   *
   * @param nodeName 节点名称
   * @param approverType 审批人类型：DIRECT_SUPERVISOR / ROLE / DESIGNATED
   * @param approverRef 角色编码或员工 ID（依赖 approverType）
   * @param skipCondition 跳过条件 JSON（可选）
   */
  public record ApprovalFlowNodeDto(
      @NotBlank String nodeName,
      @NotBlank String approverType,
      String approverRef,
      String skipCondition) {}

  /**
   * step 10：数据保留期配置。
   *
   * @param policies 保留策略列表
   */
  public record RetentionDto(List<RetentionPolicyDto> policies) {}

  /**
   * 单条保留策略。
   *
   * @param dataType 数据类型（PAYROLL_SLIP / FORM_RECORD 等）
   * @param retentionYears 保留年限
   * @param warnBeforeDays 提前警告天数
   */
  public record RetentionPolicyDto(
      @NotBlank String dataType, Integer retentionYears, Integer warnBeforeDays) {}
}
