package com.oa.backend.service;

import com.oa.backend.entity.Notification;
import com.oa.backend.mapper.NotificationMapper;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 通知服务类。
 *
 * <p>负责通知的发送、查询、状态管理和清理操作。 提供分页查询、已读标记、批量操作等功能。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

  private final NotificationMapper notificationMapper;

  /**
   * 发送通知给指定接收人。
   *
   * <p>创建一条新的通知记录，初始状态为未读。
   *
   * @param recipientId 接收人 ID
   * @param title 通知标题
   * @param content 通知内容
   * @param type 通知类型，如：APPROVAL, PAYROLL, SYSTEM
   * @param relatedType 关联业务类型，如：FORM_RECORD, PAYROLL_SLIP
   * @param relatedId 关联业务 ID
   * @return 创建的通知对象
   */
  @Transactional
  public Notification send(
      Long recipientId,
      String title,
      String content,
      String type,
      String relatedType,
      Long relatedId) {
    Notification notification = new Notification();
    notification.setRecipientId(recipientId);
    notification.setTitle(title);
    notification.setContent(content);
    notification.setType(type);
    notification.setRelatedType(relatedType);
    notification.setRelatedId(relatedId);
    notification.setIsRead(false);
    notification.setCreatedAt(LocalDateTime.now());
    notification.setUpdatedAt(LocalDateTime.now());
    notification.setDeleted(0);

    notificationMapper.insert(notification);
    log.info("通知已发送: recipientId={}, title={}, type={}", recipientId, title, type);
    return notification;
  }

  /**
   * 查询接收人的通知列表，支持分页，按创建时间降序排列。
   *
   * @param recipientId 接收人 ID
   * @param page 页码，从 0 开始
   * @param size 每页大小
   * @return 通知列表
   */
  public List<Notification> listByRecipient(Long recipientId, int page, int size) {
    int offset = page * size;
    return notificationMapper.findByRecipientId(recipientId, offset, size);
  }

  /**
   * 将指定通知标记为已读。
   *
   * <p>验证通知所有权，只有接收人本人才能标记已读。
   *
   * @param notificationId 通知 ID
   * @param recipientId 接收人 ID（用于验证所有权）
   * @return 是否成功标记，false 表示通知不存在或不属于该接收人
   */
  @Transactional
  public boolean markRead(Long notificationId, Long recipientId) {
    Notification notification = notificationMapper.selectById(notificationId);
    if (notification == null || notification.getDeleted() == 1) {
      return false;
    }
    if (!notification.getRecipientId().equals(recipientId)) {
      log.warn("用户 {} 尝试标记不属于他的通知 {} 为已读", recipientId, notificationId);
      return false;
    }

    notification.setIsRead(true);
    notification.setUpdatedAt(LocalDateTime.now());
    notificationMapper.updateById(notification);
    return true;
  }

  /**
   * 将接收人的所有未读通知标记为已读。
   *
   * @param recipientId 接收人 ID
   * @return 标记为已读的通知数量
   */
  @Transactional
  public int markAllRead(Long recipientId) {
    int count = notificationMapper.markAllReadByRecipient(recipientId);
    log.info("用户 {} 批量标记 {} 条通知为已读", recipientId, count);
    return count;
  }

  /**
   * 删除接收人的所有已读通知（逻辑删除）。
   *
   * @param recipientId 接收人 ID
   * @return 删除的通知数量
   */
  @Transactional
  public int deleteRead(Long recipientId) {
    int count = notificationMapper.deleteReadByRecipient(recipientId);
    log.info("用户 {} 删除 {} 条已读通知", recipientId, count);
    return count;
  }

  /**
   * 统计接收人的未读通知数量。
   *
   * @param recipientId 接收人 ID
   * @return 未读通知数量
   */
  public int countUnread(Long recipientId) {
    return notificationMapper.countUnread(recipientId);
  }
}
