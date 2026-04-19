package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.dto.FormRecordResponse;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.FormRecord;
import com.oa.backend.entity.PayrollBonus;
import com.oa.backend.entity.PayrollCycle;
import com.oa.backend.entity.SystemConfig;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.FormRecordMapper;
import com.oa.backend.mapper.PayrollBonusMapper;
import com.oa.backend.mapper.PayrollCycleMapper;
import com.oa.backend.mapper.SystemConfigMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 周期临时补贴/奖金服务。 窗口期内财务可增删；系统配置 payroll_bonus_approval_required=true 时会触发 CEO 审批流程。 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PayrollBonusService {

  public static final String APPROVAL_CONFIG_KEY = "payroll_bonus_approval_required";
  public static final String FORM_TYPE = "PAYROLL_BONUS";

  private final PayrollBonusMapper bonusMapper;
  private final PayrollCycleMapper cycleMapper;
  private final EmployeeMapper employeeMapper;
  private final SystemConfigMapper configMapper;
  private final FormRecordMapper formRecordMapper;
  private final FormService formService;
  private final NotificationService notificationService;
  private final ObjectMapper objectMapper;

  /** 创建临时补贴/奖金。 审批开关关闭时直接 APPROVED 并通知 CEO；开启时走 form_record 审批流，状态为 PENDING。 */
  @Transactional
  public PayrollBonus create(
      Long cycleId,
      Long employeeId,
      String name,
      BigDecimal amount,
      String type,
      String remark,
      Long creatorId) {
    PayrollCycle cycle = cycleMapper.selectById(cycleId);
    if (cycle == null || (cycle.getDeleted() != null && cycle.getDeleted() == 1)) {
      throw new IllegalStateException("工资周期不存在");
    }
    if ("SETTLED".equals(cycle.getStatus()) || "LOCKED".equals(cycle.getStatus())) {
      throw new IllegalStateException("周期已结算/锁定，禁止录入临时补贴");
    }
    Employee emp = employeeMapper.selectById(employeeId);
    if (emp == null || emp.getDeleted() == 1) {
      throw new IllegalStateException("员工不存在");
    }
    if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
      throw new IllegalStateException("金额必须为正数");
    }
    if (!"EARNING".equals(type) && !"DEDUCTION".equals(type)) {
      throw new IllegalStateException("类型必须为 EARNING 或 DEDUCTION");
    }

    boolean approvalRequired = isApprovalRequired();

    PayrollBonus bonus = new PayrollBonus();
    bonus.setCycleId(cycleId);
    bonus.setEmployeeId(employeeId);
    bonus.setName(name);
    bonus.setAmount(amount);
    bonus.setType(type);
    bonus.setRemark(remark);
    bonus.setCreatedBy(creatorId);
    bonus.setStatus(approvalRequired ? "PENDING" : "APPROVED");
    bonus.setCreatedAt(LocalDateTime.now());
    bonus.setUpdatedAt(LocalDateTime.now());
    bonusMapper.insert(bonus);

    if (approvalRequired) {
      // 走审批：提交 PAYROLL_BONUS 表单，绑定 form_id
      String formData = buildFormData(bonus, emp, cycle);
      FormRecordResponse form =
          formService.submitForm(creatorId, FORM_TYPE, formData, "临时薪资调整: " + name);
      bonus.setFormId(form.id());
      bonusMapper.updateById(bonus);
      log.info("临时补贴已创建(待审批): bonusId={}, formId={}", bonus.getId(), form.id());
    } else {
      // 直接 APPROVED，仅通知 CEO（告知）
      notifyCeo(bonus, emp, cycle);
      log.info("临时补贴已创建(直接生效): bonusId={}", bonus.getId());
    }

    return bonus;
  }

  /** 删除临时补贴（软删）。仅允许创建者或财务/CEO，且周期未结算时可删。 */
  @Transactional
  public void delete(Long bonusId) {
    PayrollBonus bonus = bonusMapper.selectById(bonusId);
    if (bonus == null || bonus.getDeleted() == 1) {
      throw new IllegalStateException("记录不存在");
    }
    PayrollCycle cycle = cycleMapper.selectById(bonus.getCycleId());
    if (cycle != null
        && ("SETTLED".equals(cycle.getStatus()) || "LOCKED".equals(cycle.getStatus()))) {
      throw new IllegalStateException("周期已结算/锁定，禁止删除临时补贴");
    }
    bonusMapper.deleteById(bonusId);
  }

  /** 列出指定周期的所有临时补贴（含 PENDING/APPROVED/REJECTED）。 */
  public List<PayrollBonus> listByCycle(Long cycleId) {
    return bonusMapper.selectList(
        new LambdaQueryWrapper<PayrollBonus>()
            .eq(PayrollBonus::getCycleId, cycleId)
            .eq(PayrollBonus::getDeleted, 0)
            .orderByAsc(PayrollBonus::getEmployeeId)
            .orderByAsc(PayrollBonus::getCreatedAt));
  }

  /**
   * 按员工列出指定周期内 APPROVED 的条目（供 PayrollEngine 结算使用）。 结算前调用 {@link #syncFromApprovalForms(Long)}
   * 同步审批状态。
   */
  public List<PayrollBonus> listApprovedByCycleEmployee(Long cycleId, Long employeeId) {
    return bonusMapper.selectList(
        new LambdaQueryWrapper<PayrollBonus>()
            .eq(PayrollBonus::getCycleId, cycleId)
            .eq(PayrollBonus::getEmployeeId, employeeId)
            .eq(PayrollBonus::getStatus, "APPROVED")
            .eq(PayrollBonus::getDeleted, 0)
            .orderByAsc(PayrollBonus::getCreatedAt));
  }

  /**
   * 按周期内所有 PENDING 条目反查绑定的 FormRecord 状态，同步到 payroll_bonus.status。 由 PayrollEngine.settle()
   * 调用，确保结算时反映最新审批结果。
   */
  @Transactional
  public int syncFromApprovalForms(Long cycleId) {
    List<PayrollBonus> pending =
        bonusMapper.selectList(
            new LambdaQueryWrapper<PayrollBonus>()
                .eq(PayrollBonus::getCycleId, cycleId)
                .eq(PayrollBonus::getStatus, "PENDING")
                .isNotNull(PayrollBonus::getFormId)
                .eq(PayrollBonus::getDeleted, 0));
    int changed = 0;
    for (PayrollBonus b : pending) {
      FormRecord f = formRecordMapper.selectById(b.getFormId());
      if (f == null) continue;
      if ("APPROVED".equals(f.getStatus())) {
        b.setStatus("APPROVED");
        b.setUpdatedAt(LocalDateTime.now());
        bonusMapper.updateById(b);
        changed++;
      } else if ("REJECTED".equals(f.getStatus())) {
        b.setStatus("REJECTED");
        b.setUpdatedAt(LocalDateTime.now());
        bonusMapper.updateById(b);
        changed++;
      }
    }
    return changed;
  }

  /** 读取"是否需要审批"配置。 */
  public boolean isApprovalRequired() {
    SystemConfig config = configMapper.selectById(APPROVAL_CONFIG_KEY);
    return config != null && "true".equalsIgnoreCase(config.getConfigValue());
  }

  /** 设置"是否需要审批"配置。 */
  @Transactional
  public void setApprovalRequired(boolean required) {
    SystemConfig existing = configMapper.selectById(APPROVAL_CONFIG_KEY);
    if (existing != null) {
      existing.setConfigValue(required ? "true" : "false");
      configMapper.updateById(existing);
    } else {
      SystemConfig c = new SystemConfig();
      c.setConfigKey(APPROVAL_CONFIG_KEY);
      c.setConfigValue(required ? "true" : "false");
      c.setDescription("临时薪资调整是否需要 CEO 审批");
      configMapper.insert(c);
    }
  }

  /** 根据用户名（employee_no）解析员工 ID；供 controller 使用，避免直接注入 EmployeeMapper */
  public Long resolveEmployeeIdByUsername(String username) {
    if (username == null) return null;
    Employee emp =
        employeeMapper.selectOne(
            new LambdaQueryWrapper<Employee>()
                .eq(Employee::getEmployeeNo, username)
                .eq(Employee::getDeleted, 0));
    return emp != null ? emp.getId() : null;
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private String buildFormData(PayrollBonus bonus, Employee emp, PayrollCycle cycle) {
    Map<String, Object> m = new HashMap<>();
    m.put("cycleId", cycle.getId());
    m.put("cyclePeriod", cycle.getPeriod());
    m.put("employeeId", emp.getId());
    m.put("employeeName", emp.getName());
    m.put("name", bonus.getName());
    m.put("amount", bonus.getAmount());
    m.put("type", bonus.getType());
    m.put("remark", bonus.getRemark());
    try {
      return objectMapper.writeValueAsString(m);
    } catch (JsonProcessingException e) {
      return "{}";
    }
  }

  private void notifyCeo(PayrollBonus bonus, Employee emp, PayrollCycle cycle) {
    List<Employee> ceos =
        employeeMapper.selectList(
            new LambdaQueryWrapper<Employee>()
                .eq(Employee::getRoleCode, "ceo")
                .eq(Employee::getDeleted, 0));
    String title = "临时薪资调整（无需审批）";
    String content =
        String.format(
            "财务已录入：员工 %s，周期 %s，%s %s 元（%s）",
            emp.getName(),
            cycle.getPeriod(),
            "EARNING".equals(bonus.getType()) ? "补贴" : "扣款",
            bonus.getAmount().toPlainString(),
            bonus.getName());
    for (Employee c : ceos) {
      try {
        notificationService.send(
            c.getId(), title, content, "PAYROLL", "PAYROLL_BONUS", bonus.getId());
      } catch (Exception e) {
        log.warn("向 CEO {} 发送临时补贴通知失败", c.getId(), e);
      }
    }
  }
}
