package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.PayrollCycle;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.PayrollCycleMapper;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 工资周期服务
 *
 * <p>职责：管理工资周期（payroll_cycle）的状态变更操作， 补充 PayrollEngine 未覆盖的 unlock（CEO 解锁已结算周期）逻辑。
 *
 * <p>注意：周期创建、开窗、预检、结算由 {@link PayrollEngine} 负责； 本服务仅处理 PayrollController 中直接操作 PayrollCycleMapper
 * 的剩余逻辑。
 *
 * <p>数据来源：payroll_cycle、employee 表。 调用方：PayrollController。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PayrollCycleService {

  private final PayrollCycleMapper cycleMapper;
  private final EmployeeMapper employeeMapper;
  private final NotificationService notificationService;

  /**
   * 查询所有工资周期，按 period 降序返回。 来源：原 PayrollController#listCycles 中的直接 Mapper 调用。
   *
   * @return 工资周期列表
   */
  public List<PayrollCycle> listCycles() {
    return cycleMapper.selectList(
        new LambdaQueryWrapper<PayrollCycle>()
            .eq(PayrollCycle::getDeleted, 0)
            .orderByDesc(PayrollCycle::getPeriod));
  }

  /**
   * CEO 解锁已结算周期。 将周期状态从 SETTLED/LOCKED 回退为 WINDOW_CLOSED，并通知所有 finance 角色。
   *
   * @param id 周期 ID
   * @return 更新后的 PayrollCycle，不存在或已删除返回 null，状态不符返回 null 并由调用方处理
   * @throws IllegalArgumentException 周期不存在或已删除
   * @throws IllegalStateException 周期状态不允许解锁
   */
  public UnlockResult unlock(Long id) {
    PayrollCycle cycle = cycleMapper.selectById(id);
    if (cycle == null || (cycle.getDeleted() != null && cycle.getDeleted() == 1)) {
      return UnlockResult.notFound();
    }
    if (!"SETTLED".equals(cycle.getStatus()) && !"LOCKED".equals(cycle.getStatus())) {
      return UnlockResult.badState(cycle.getStatus());
    }

    cycle.setStatus("WINDOW_CLOSED");
    cycle.setLockedAt(null);
    cycle.setUpdatedAt(LocalDateTime.now());
    cycleMapper.updateById(cycle);

    // 通知所有 finance 角色（失败不回滚主事务）
    try {
      List<Employee> finances =
          employeeMapper.selectList(
              new LambdaQueryWrapper<Employee>()
                  .eq(Employee::getRoleCode, "finance")
                  .eq(Employee::getDeleted, 0));
      for (Employee f : finances) {
        notificationService.send(
            f.getId(),
            "薪资周期已被 CEO 解锁",
            "周期 " + cycle.getPeriod() + " 已解锁，请重新核对并结算。",
            "PAYROLL",
            "PAYROLL_CYCLE",
            id);
      }
    } catch (Exception e) {
      log.error("解锁薪资周期后通知财务失败 cycleId={}", id, e);
    }

    return UnlockResult.ok(cycle);
  }

  // ── Result type ──────────────────────────────────────────────────────────

  /** unlock 操作结果，携带状态语义供 Controller 转换为 HTTP 响应。 */
  public sealed interface UnlockResult
      permits UnlockResult.Ok, UnlockResult.NotFound, UnlockResult.BadState {

    static UnlockResult ok(PayrollCycle cycle) {
      return new Ok(cycle);
    }

    static UnlockResult notFound() {
      return new NotFound();
    }

    static UnlockResult badState(String currentStatus) {
      return new BadState(currentStatus);
    }

    record Ok(PayrollCycle cycle) implements UnlockResult {}

    record NotFound() implements UnlockResult {}

    record BadState(String currentStatus) implements UnlockResult {}
  }
}
