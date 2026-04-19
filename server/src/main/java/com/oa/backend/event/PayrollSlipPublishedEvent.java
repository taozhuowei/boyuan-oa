package com.oa.backend.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * 工资条发布事件。
 *
 * <p>当工资条正式发布（状态变为 PUBLISHED）时发布此事件，用于通知员工查看工资条。 事件包含工资条 ID 和所属员工 ID。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@Getter
public class PayrollSlipPublishedEvent extends ApplicationEvent {

  /** 工资条 ID */
  private final Long slipId;

  /** 员工 ID */
  private final Long employeeId;

  /**
   * 创建工资条发布事件。
   *
   * @param source 事件源对象
   * @param slipId 工资条 ID
   * @param employeeId 员工 ID
   */
  public PayrollSlipPublishedEvent(Object source, Long slipId, Long employeeId) {
    super(source);
    this.slipId = slipId;
    this.employeeId = employeeId;
  }
}
