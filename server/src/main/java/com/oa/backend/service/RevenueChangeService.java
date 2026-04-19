package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.entity.ApprovalFlowDef;
import com.oa.backend.entity.ApprovalFlowNode;
import com.oa.backend.entity.FormRecord;
import com.oa.backend.entity.ProjectMilestone;
import com.oa.backend.mapper.ApprovalFlowDefMapper;
import com.oa.backend.mapper.ApprovalFlowNodeMapper;
import com.oa.backend.mapper.FormRecordMapper;
import com.oa.backend.mapper.ProjectMilestoneMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 营收金额变更（设计 §8.5）：财务改 → PM 审批；PM 改 → 财务审批。
 *
 * <p>流程： 1. 发起方调用 createChange()，写 pending_change_* 字段 + 创建 form_record (PAYROLL_REVENUE_CHANGE) 节点
 * approver_ref 在 form_record 创建时根据 initiator 反向决定（财务发起 → project_manager；PM 发起 → finance） 2. 对方在
 * /forms/{id}/approve 通过审批 → form_record APPROVED 3. 下次 listRevenue / summary 调用
 * syncApprovedChanges() → 把 pending_change_amount 应用到 contract_amount，清空 pending_*
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RevenueChangeService {

  public static final String FORM_TYPE = "PAYROLL_REVENUE_CHANGE";

  private final ProjectMilestoneMapper milestoneMapper;
  private final FormRecordMapper formRecordMapper;
  private final ApprovalFlowDefMapper approvalFlowDefMapper;
  private final ApprovalFlowNodeMapper approvalFlowNodeMapper;
  private final ApprovalFlowService approvalFlowService;
  private final ObjectMapper objectMapper;

  /**
   * 提交合同金额变更。
   *
   * @param initiatorRole "FINANCE" 或 "PROJECT_MANAGER" — 决定对方审批人
   */
  @Transactional
  public ProjectMilestone createChange(
      Long milestoneId,
      BigDecimal newAmount,
      String reason,
      Long initiatorEmployeeId,
      String initiatorRole) {
    ProjectMilestone m = milestoneMapper.selectById(milestoneId);
    if (m == null || (m.getDeleted() != null && m.getDeleted() == 1)) {
      throw new IllegalStateException("里程碑不存在");
    }
    if (m.getPendingChangeAmount() != null) {
      throw new IllegalStateException("已有未决变更（form #" + m.getPendingChangeFormId() + "），请先撤销或等待审批");
    }
    if (newAmount == null || newAmount.compareTo(BigDecimal.ZERO) < 0) {
      throw new IllegalStateException("新合同金额不能为空或负数");
    }
    if (!"FINANCE".equals(initiatorRole) && !"PROJECT_MANAGER".equals(initiatorRole)) {
      throw new IllegalStateException("发起方必须是 FINANCE 或 PROJECT_MANAGER");
    }
    if (initiatorEmployeeId == null) {
      throw new IllegalStateException("无法识别发起人");
    }
    String counterpartyRole = "FINANCE".equals(initiatorRole) ? "project_manager" : "finance";

    // 临时调整 PAYROLL_REVENUE_CHANGE 流的节点 approver_ref（反向决定对方）
    ApprovalFlowDef def = approvalFlowDefMapper.findActiveByBusinessType(FORM_TYPE);
    if (def == null) throw new IllegalStateException("未找到 PAYROLL_REVENUE_CHANGE 审批流");
    ApprovalFlowNode node = approvalFlowNodeMapper.findByFlowIdAndNodeOrder(def.getId(), 1);
    if (node == null) throw new IllegalStateException("PAYROLL_REVENUE_CHANGE 流缺少节点");
    node.setApproverRef(counterpartyRole);
    node.setUpdatedAt(LocalDateTime.now());
    approvalFlowNodeMapper.updateById(node);

    // 创建 form_record
    Map<String, Object> formData = new HashMap<>();
    formData.put("milestoneId", milestoneId);
    formData.put("projectId", m.getProjectId());
    formData.put("milestoneName", m.getName());
    formData.put("oldAmount", m.getContractAmount());
    formData.put("newAmount", newAmount);
    formData.put("reason", reason);
    formData.put("initiatorRole", initiatorRole);
    formData.put("counterpartyRole", counterpartyRole);
    String formDataJson;
    try {
      formDataJson = objectMapper.writeValueAsString(formData);
    } catch (JsonProcessingException e) {
      formDataJson = "{}";
    }

    FormRecord form = new FormRecord();
    form.setFormType(FORM_TYPE);
    form.setSubmitterId(initiatorEmployeeId);
    form.setFormData(formDataJson);
    form.setStatus("PENDING");
    form.setCurrentNodeOrder(0);
    form.setRemark("合同金额变更：" + m.getContractAmount() + " → " + newAmount);
    form.setCreatedAt(LocalDateTime.now());
    form.setUpdatedAt(LocalDateTime.now());
    form.setDeleted(0);
    formRecordMapper.insert(form);
    approvalFlowService.initFlow(form.getId(), FORM_TYPE, initiatorEmployeeId);

    // 标记 milestone 上的待审批信息
    m.setPendingChangeAmount(newAmount);
    m.setPendingChangeRole(initiatorRole);
    m.setPendingChangeInitiator(initiatorEmployeeId);
    m.setPendingChangeFormId(form.getId());
    m.setUpdatedAt(LocalDateTime.now());
    milestoneMapper.updateById(m);
    log.info(
        "营收变更已发起: milestoneId={}, formId={}, initiator={}",
        milestoneId,
        form.getId(),
        initiatorRole);
    return m;
  }

  /** 撤销待审批变更（仅发起人本人） */
  @Transactional
  public void cancelChange(Long milestoneId, Long actorId) {
    ProjectMilestone m = milestoneMapper.selectById(milestoneId);
    if (m == null || m.getPendingChangeFormId() == null) return;
    if (!actorId.equals(m.getPendingChangeInitiator())) {
      throw new IllegalStateException("仅发起人可撤销");
    }
    FormRecord f = formRecordMapper.selectById(m.getPendingChangeFormId());
    if (f != null && ("PENDING".equals(f.getStatus()) || "APPROVING".equals(f.getStatus()))) {
      f.setStatus("RECALLED");
      f.setUpdatedAt(LocalDateTime.now());
      formRecordMapper.updateById(f);
    }
    clearPending(m);
  }

  /** 自动同步：把所有 form_record APPROVED 的待应用变更落到 milestone.contract_amount */
  @Transactional
  public int syncApprovedChanges(Long projectId) {
    List<ProjectMilestone> stones =
        milestoneMapper.selectList(
            new LambdaQueryWrapper<ProjectMilestone>()
                .eq(ProjectMilestone::getProjectId, projectId)
                .isNotNull(ProjectMilestone::getPendingChangeFormId)
                .eq(ProjectMilestone::getDeleted, 0));
    int changed = 0;
    for (ProjectMilestone m : stones) {
      FormRecord f = formRecordMapper.selectById(m.getPendingChangeFormId());
      if (f == null) continue;
      if ("APPROVED".equals(f.getStatus())) {
        m.setContractAmount(m.getPendingChangeAmount());
        clearPending(m);
        changed++;
      } else if ("REJECTED".equals(f.getStatus()) || "RECALLED".equals(f.getStatus())) {
        clearPending(m);
        changed++;
      }
    }
    return changed;
  }

  private void clearPending(ProjectMilestone m) {
    m.setPendingChangeAmount(null);
    m.setPendingChangeRole(null);
    m.setPendingChangeInitiator(null);
    m.setPendingChangeFormId(null);
    m.setUpdatedAt(LocalDateTime.now());
    milestoneMapper.updateById(m);
  }
}
