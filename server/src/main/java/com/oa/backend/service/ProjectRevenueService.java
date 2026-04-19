package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.ProjectMilestone;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.ProjectMilestoneMapper;
import com.oa.backend.security.SecurityUtils;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 项目营收业务服务（设计 §8.5 营收管理）。 封装按项目查询里程碑（用于收款展示）、更新收款字段、以及营收汇总计算。 合同金额变更走跨方审批，见 {@link
 * RevenueChangeService}。
 */
@Service
@RequiredArgsConstructor
public class ProjectRevenueService {

  private final ProjectMilestoneMapper milestoneMapper;
  private final EmployeeMapper employeeMapper;

  /**
   * 查询指定项目的里程碑列表（含合同金额 + 收款字段），按 sort 升序。
   *
   * @param projectId 项目 ID
   * @return 里程碑列表
   */
  public List<ProjectMilestone> listMilestonesForRevenue(Long projectId) {
    return milestoneMapper.selectList(
        new LambdaQueryWrapper<ProjectMilestone>()
            .eq(ProjectMilestone::getProjectId, projectId)
            .eq(ProjectMilestone::getDeleted, 0)
            .orderByAsc(ProjectMilestone::getSort));
  }

  /**
   * 按 ID 查询属于指定项目且未删除的里程碑。
   *
   * @param milestoneId 里程碑 ID
   * @param projectId 项目 ID（用于隔离校验）
   * @return 里程碑实体，不存在/已删除/项目不匹配时返回 null
   */
  public ProjectMilestone getMilestoneByIdAndProject(Long milestoneId, Long projectId) {
    ProjectMilestone m = milestoneMapper.selectById(milestoneId);
    if (m == null || m.getDeleted() == 1 || !m.getProjectId().equals(projectId)) return null;
    return m;
  }

  /**
   * 更新里程碑的收款字段（receipt_status / actual_receipt_amount / receipt_date / receipt_remark）， 刷新
   * updated_at 时间戳。 注意：contract_amount 不在此修改，须通过 {@link RevenueChangeService#createChange} 走跨方审批。
   *
   * @param milestone 已合并收款补丁的里程碑实体
   * @return 更新后的里程碑实体
   */
  public ProjectMilestone updateReceiptFields(ProjectMilestone milestone) {
    milestone.setUpdatedAt(LocalDateTime.now());
    milestoneMapper.updateById(milestone);
    return milestone;
  }

  /**
   * 计算指定项目的营收汇总：合同总额、已收款、待收款。
   *
   * @param projectId 项目 ID
   * @return 包含 contractTotal / received / pending 的 Map
   */
  public Map<String, Object> summarizeRevenue(Long projectId) {
    List<ProjectMilestone> list =
        milestoneMapper.selectList(
            new LambdaQueryWrapper<ProjectMilestone>()
                .eq(ProjectMilestone::getProjectId, projectId)
                .eq(ProjectMilestone::getDeleted, 0));
    BigDecimal contractTotal = BigDecimal.ZERO;
    BigDecimal received = BigDecimal.ZERO;
    for (ProjectMilestone m : list) {
      if (m.getContractAmount() != null) contractTotal = contractTotal.add(m.getContractAmount());
      if ("RECEIVED".equals(m.getReceiptStatus()) && m.getActualReceiptAmount() != null) {
        received = received.add(m.getActualReceiptAmount());
      }
    }
    Map<String, Object> out = new HashMap<>();
    out.put("contractTotal", contractTotal);
    out.put("received", received);
    out.put("pending", contractTotal.subtract(received));
    return out;
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
