package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.ProjectMaterialCost;
import com.oa.backend.entity.SecondRoleAssignment;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.ProjectMaterialCostMapper;
import com.oa.backend.mapper.SecondRoleAssignmentMapper;
import com.oa.backend.security.SecurityUtils;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

/**
 * 项目实体成本（物料/设备直接成本）业务服务（设计 §成本管理）。 封装成本条目 CRUD 及录入权限判断。 录入权限：PM / 财务 / CEO / 总经理 / 项目下持有
 * MATERIAL_MANAGER 第二角色的员工。
 */
@Service
@RequiredArgsConstructor
public class ProjectMaterialCostService {

  private final ProjectMaterialCostMapper costMapper;
  private final SecondRoleAssignmentMapper secondRoleMapper;
  private final EmployeeMapper employeeMapper;

  /**
   * 查询指定项目未删除的实体成本列表，按 occurred_on 降序排列。
   *
   * @param projectId 项目 ID
   * @return 成本条目列表
   */
  public List<ProjectMaterialCost> listCostsByProjectId(Long projectId) {
    return costMapper.selectList(
        new LambdaQueryWrapper<ProjectMaterialCost>()
            .eq(ProjectMaterialCost::getProjectId, projectId)
            .eq(ProjectMaterialCost::getDeleted, 0)
            .orderByDesc(ProjectMaterialCost::getOccurredOn));
  }

  /**
   * 创建实体成本条目，设置记录人和时间戳。
   *
   * @param cost 已填充字段的成本实体（projectId/itemName/quantity/unit/unitPrice/occurredOn 为必填）
   * @param recorderId 操作人员工 ID（来源于 SecurityUtils）
   * @return 插入后含主键的成本实体
   */
  public ProjectMaterialCost createCost(ProjectMaterialCost cost, Long recorderId) {
    cost.setRecordedBy(recorderId);
    cost.setCreatedAt(LocalDateTime.now());
    cost.setUpdatedAt(LocalDateTime.now());
    costMapper.insert(cost);
    return cost;
  }

  /**
   * 按 ID 查询属于指定项目且未删除的成本条目。
   *
   * @param id 成本条目 ID
   * @param projectId 项目 ID（用于隔离校验）
   * @return 成本实体，不存在/已删除/项目不匹配时返回 null
   */
  public ProjectMaterialCost getCostByIdAndProject(Long id, Long projectId) {
    ProjectMaterialCost c = costMapper.selectById(id);
    if (c == null || c.getDeleted() == 1 || !c.getProjectId().equals(projectId)) return null;
    return c;
  }

  /**
   * 更新成本条目并刷新 updated_at 时间戳。
   *
   * @param cost 已合并补丁字段的成本实体
   * @return 更新后的成本实体
   */
  public ProjectMaterialCost updateCost(ProjectMaterialCost cost) {
    cost.setUpdatedAt(LocalDateTime.now());
    costMapper.updateById(cost);
    return cost;
  }

  /**
   * 删除成本条目（由 MyBatis-Plus 逻辑删除注解控制实际行为）。
   *
   * @param id 成本条目 ID
   */
  public void deleteCost(Long id) {
    costMapper.deleteById(id);
  }

  /**
   * 判断员工是否有权录入指定项目的实体成本。 规则：CEO / PM / 财务 / 总经理 均可；其他员工须持有该项目 MATERIAL_MANAGER 第二角色。
   *
   * @param employeeId 员工 ID
   * @param projectId 项目 ID
   * @param auth 当前认证信息
   * @return 有权限返回 true
   */
  public boolean canRecord(Long employeeId, Long projectId, Authentication auth) {
    if (employeeId == null) return false;
    if (SecurityUtils.isCEO(auth)
        || SecurityUtils.isProjectManager(auth)
        || SecurityUtils.isFinance(auth)) return true;
    if (auth.getAuthorities().stream()
        .anyMatch(a -> "ROLE_GENERAL_MANAGER".equals(a.getAuthority()))) return true;
    Long count =
        secondRoleMapper.selectCount(
            new LambdaQueryWrapper<SecondRoleAssignment>()
                .eq(SecondRoleAssignment::getEmployeeId, employeeId)
                .eq(SecondRoleAssignment::getRoleCode, "MATERIAL_MANAGER")
                .eq(SecondRoleAssignment::getProjectId, projectId)
                .eq(SecondRoleAssignment::getRevoked, false)
                .eq(SecondRoleAssignment::getDeleted, 0));
    return count != null && count > 0;
  }

  /**
   * 从 Authentication 中解析当前登录用户的员工 ID。
   *
   * @param username 登录名
   * @return 员工 ID，未找到时返回 null
   */
  public Long resolveEmployeeId(String username) {
    return SecurityUtils.getEmployeeIdFromUsername(username, employeeMapper);
  }
}
