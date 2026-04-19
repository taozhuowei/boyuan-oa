package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.AfterSaleTicket;
import com.oa.backend.entity.AfterSaleTypeDef;
import com.oa.backend.entity.SecondRoleAssignment;
import com.oa.backend.mapper.AfterSaleTicketMapper;
import com.oa.backend.mapper.AfterSaleTypeDefMapper;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.SecondRoleAssignmentMapper;
import com.oa.backend.security.SecurityUtils;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

/**
 * 售后问题单业务服务（设计 §售后管理）。 封装问题单 CRUD、问题类型查询、以及维护权限判断逻辑。 维护权限：CEO / 总经理 / PM / 项目下持有 AFTER_SALES
 * 第二角色的员工。
 */
@Service
@RequiredArgsConstructor
public class AfterSaleService {

  private final AfterSaleTicketMapper ticketMapper;
  private final AfterSaleTypeDefMapper typeMapper;
  private final SecondRoleAssignmentMapper secondRoleMapper;
  private final EmployeeMapper employeeMapper;

  /**
   * 查询已启用、未删除的问题单类型定义，按 display_order 升序排列。
   *
   * @return 类型定义列表
   */
  public List<AfterSaleTypeDef> listEnabledTypes() {
    return typeMapper.selectList(
        new LambdaQueryWrapper<AfterSaleTypeDef>()
            .eq(AfterSaleTypeDef::getIsEnabled, true)
            .eq(AfterSaleTypeDef::getDeleted, 0)
            .orderByAsc(AfterSaleTypeDef::getDisplayOrder));
  }

  /**
   * 查询问题单列表，可按项目 ID 和状态过滤，按 incident_date 降序。
   *
   * @param projectId 项目 ID（可选）
   * @param status 状态（可选）
   * @return 问题单列表
   */
  public List<AfterSaleTicket> listTickets(Long projectId, String status) {
    LambdaQueryWrapper<AfterSaleTicket> q =
        new LambdaQueryWrapper<AfterSaleTicket>()
            .eq(AfterSaleTicket::getDeleted, 0)
            .orderByDesc(AfterSaleTicket::getIncidentDate);
    if (projectId != null) q.eq(AfterSaleTicket::getProjectId, projectId);
    if (status != null && !status.isBlank()) q.eq(AfterSaleTicket::getStatus, status);
    return ticketMapper.selectList(q);
  }

  /**
   * 创建问题单，设置创建人和时间戳，默认状态为 PENDING。
   *
   * @param ticket 已填充字段的问题单实体（projectId/typeCode/incidentDate/description 为必填）
   * @param creatorId 操作人员工 ID（来源于 SecurityUtils）
   * @return 插入后含主键的问题单
   */
  public AfterSaleTicket createTicket(AfterSaleTicket ticket, Long creatorId) {
    ticket.setCreatedBy(creatorId);
    ticket.setCreatedAt(LocalDateTime.now());
    ticket.setUpdatedAt(LocalDateTime.now());
    if (ticket.getStatus() == null) ticket.setStatus("PENDING");
    ticketMapper.insert(ticket);
    return ticket;
  }

  /**
   * 按 ID 查询未删除的问题单。
   *
   * @param id 问题单 ID
   * @return 问题单实体，不存在或已删除时返回 null
   */
  public AfterSaleTicket getTicketById(Long id) {
    AfterSaleTicket t = ticketMapper.selectById(id);
    return (t == null || t.getDeleted() == 1) ? null : t;
  }

  /**
   * 更新问题单字段（null 字段跳过），关闭时自动记录 closed_at。
   *
   * @param ticket 需要更新的问题单实体（已合并补丁字段）
   */
  public AfterSaleTicket updateTicket(AfterSaleTicket ticket) {
    ticket.setUpdatedAt(LocalDateTime.now());
    ticketMapper.updateById(ticket);
    return ticket;
  }

  /**
   * 物理删除问题单（由 MyBatis-Plus 逻辑删除注解控制实际行为）。
   *
   * @param id 问题单 ID
   */
  public void deleteTicket(Long id) {
    ticketMapper.deleteById(id);
  }

  /**
   * 判断员工是否有权限维护指定项目的售后问题单。 规则：CEO / PM / 总经理 均可；其他员工须持有该项目 AFTER_SALES 第二角色。
   *
   * @param employeeId 员工 ID
   * @param projectId 项目 ID
   * @param auth 当前认证信息
   * @return 有权限返回 true
   */
  public boolean canMaintain(Long employeeId, Long projectId, Authentication auth) {
    if (employeeId == null) return false;
    if (SecurityUtils.isCEO(auth) || SecurityUtils.isProjectManager(auth)) return true;
    if (auth.getAuthorities().stream()
        .anyMatch(a -> "ROLE_GENERAL_MANAGER".equals(a.getAuthority()))) return true;
    Long count =
        secondRoleMapper.selectCount(
            new LambdaQueryWrapper<SecondRoleAssignment>()
                .eq(SecondRoleAssignment::getEmployeeId, employeeId)
                .eq(SecondRoleAssignment::getRoleCode, "AFTER_SALES")
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
