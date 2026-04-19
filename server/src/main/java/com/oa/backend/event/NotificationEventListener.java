package com.oa.backend.event;

import com.oa.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * 通知事件监听器。
 *
 * <p>监听系统中的各类业务事件，并发送相应的通知给相关用户。 支持的事件包括：
 *
 * <ul>
 *   <li>{@link ApprovalNodeChangedEvent} - 审批节点变更时通知审批人
 *   <li>{@link PayrollSlipPublishedEvent} - 工资条发布时通知员工
 * </ul>
 *
 * <p>注意：此类仅注入核心通知服务，不直接依赖其他业务模块的服务。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

  private final NotificationService notificationService;

  /**
   * 处理审批节点变更事件。
   *
   * <p>当表单进入新的审批节点时，向该节点的审批人发送通知。
   *
   * @param event 审批节点变更事件
   */
  @EventListener
  public void onApprovalNodeChanged(ApprovalNodeChangedEvent event) {
    log.info(
        "收到审批节点变更事件: formRecordId={}, newNodeName={}, recipientCount={}",
        event.getFormRecordId(),
        event.getNewNodeName(),
        event.getRecipientIds().size());

    for (Long recipientId : event.getRecipientIds()) {
      try {
        notificationService.send(
            recipientId,
            "新的审批待处理",
            String.format(
                "表单 #%d 进入审批节点 [%s]，请及时处理", event.getFormRecordId(), event.getNewNodeName()),
            "APPROVAL",
            "FORM_RECORD",
            event.getFormRecordId());
      } catch (Exception e) {
        log.error(
            "发送审批通知失败: recipientId={}, formRecordId={}", recipientId, event.getFormRecordId(), e);
      }
    }
  }

  /**
   * 处理工资条发布事件。
   *
   * <p>当工资条正式发布时，通知员工查看工资条。
   *
   * @param event 工资条发布事件
   */
  @EventListener
  public void onPayrollSlipPublished(PayrollSlipPublishedEvent event) {
    log.info("收到工资条发布事件: slipId={}, employeeId={}", event.getSlipId(), event.getEmployeeId());

    try {
      notificationService.send(
          event.getEmployeeId(),
          "工资条已发布",
          "您的工资条已发布，请前往薪资管理模块查看详情",
          "PAYROLL",
          "PAYROLL_SLIP",
          event.getSlipId());
    } catch (Exception e) {
      log.error("发送工资条通知失败: employeeId={}, slipId={}", event.getEmployeeId(), event.getSlipId(), e);
    }
  }
}
