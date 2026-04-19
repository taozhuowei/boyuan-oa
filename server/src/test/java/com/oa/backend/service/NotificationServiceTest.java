package com.oa.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.oa.backend.entity.Notification;
import com.oa.backend.mapper.NotificationMapper;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** NotificationService 单元测试 覆盖：通知发送、列表查询、已读标记、批量操作、统计 */
@ExtendWith(MockitoExtension.class)
@DisplayName("M3 - NotificationService")
class NotificationServiceTest {

  @InjectMocks private NotificationService notificationService;

  @Mock private NotificationMapper notificationMapper;

  // ─── send ─────────────────────────────────────────────────────

  @Test
  @DisplayName("send: creates notification with correct fields")
  void send_createsNotification() {
    when(notificationMapper.insert(any()))
        .thenAnswer(
            inv -> {
              Notification n = inv.getArgument(0);
              n.setId(100L);
              return 1;
            });

    Notification result =
        notificationService.send(5L, "通知标题", "通知内容", "APPROVAL", "FORM_RECORD", 10L);

    assertNotNull(result);
    assertEquals(100L, result.getId());
    assertEquals(5L, result.getRecipientId());
    assertEquals("通知标题", result.getTitle());
    assertEquals("通知内容", result.getContent());
    assertEquals("APPROVAL", result.getType());
    assertEquals("FORM_RECORD", result.getRelatedType());
    assertEquals(10L, result.getRelatedId());
    assertFalse(result.getIsRead());
    assertEquals(0, result.getDeleted());
    assertNotNull(result.getCreatedAt());
    assertNotNull(result.getUpdatedAt());

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(notificationMapper).insert(captor.capture());
    Notification captured = captor.getValue();
    assertEquals(5L, captured.getRecipientId());
    assertEquals("通知标题", captured.getTitle());
    assertFalse(captured.getIsRead());
  }

  @Test
  @DisplayName("send: handles null content")
  void send_nullContent() {
    when(notificationMapper.insert(any()))
        .thenAnswer(
            inv -> {
              Notification n = inv.getArgument(0);
              n.setId(100L);
              return 1;
            });

    Notification result = notificationService.send(5L, "标题", null, "SYSTEM", null, null);

    assertNotNull(result);
    assertNull(result.getContent());
  }

  // ─── listByRecipient ──────────────────────────────────────────

  @Test
  @DisplayName("listByRecipient: returns paged results from mapper")
  void listByRecipient_returnsPagedResults() {
    Notification n1 = createNotification(1L, 5L, "标题1", false);
    Notification n2 = createNotification(2L, 5L, "标题2", false);
    when(notificationMapper.findByRecipientId(5L, 0, 10)).thenReturn(List.of(n1, n2));

    List<Notification> result = notificationService.listByRecipient(5L, 0, 10);

    assertEquals(2, result.size());
    assertEquals("标题1", result.get(0).getTitle());
    assertEquals("标题2", result.get(1).getTitle());
    verify(notificationMapper).findByRecipientId(5L, 0, 10);
  }

  @Test
  @DisplayName("listByRecipient: returns empty list when no notifications")
  void listByRecipient_empty() {
    when(notificationMapper.findByRecipientId(5L, 0, 10)).thenReturn(Collections.emptyList());

    List<Notification> result = notificationService.listByRecipient(5L, 0, 10);

    assertTrue(result.isEmpty());
  }

  @Test
  @DisplayName("listByRecipient: calculates offset correctly for page 1")
  void listByRecipient_page1() {
    when(notificationMapper.findByRecipientId(5L, 10, 10)).thenReturn(Collections.emptyList());

    notificationService.listByRecipient(5L, 1, 10);

    verify(notificationMapper).findByRecipientId(5L, 10, 10);
  }

  @Test
  @DisplayName("listByRecipient: handles page 0 (first page)")
  void listByRecipient_page0() {
    when(notificationMapper.findByRecipientId(5L, 0, 20)).thenReturn(Collections.emptyList());

    notificationService.listByRecipient(5L, 0, 20);

    verify(notificationMapper).findByRecipientId(5L, 0, 20);
  }

  // ─── markRead ─────────────────────────────────────────────────

  @Test
  @DisplayName("markRead: returns true when notification exists and belongs to recipient")
  void markRead_success() {
    Notification notification = createNotification(1L, 5L, "标题", false);
    when(notificationMapper.selectById(1L)).thenReturn(notification);

    boolean result = notificationService.markRead(1L, 5L);

    assertTrue(result);
    assertTrue(notification.getIsRead());
    assertNotNull(notification.getUpdatedAt());
    verify(notificationMapper).updateById(notification);
  }

  @Test
  @DisplayName("markRead: returns false when notification not found")
  void markRead_notFound() {
    when(notificationMapper.selectById(1L)).thenReturn(null);

    boolean result = notificationService.markRead(1L, 5L);

    assertFalse(result);
    verify(notificationMapper, never()).updateById(any());
  }

  @Test
  @DisplayName("markRead: returns false when notification is deleted")
  void markRead_deleted() {
    Notification notification = createNotification(1L, 5L, "标题", false);
    notification.setDeleted(1);
    when(notificationMapper.selectById(1L)).thenReturn(notification);

    boolean result = notificationService.markRead(1L, 5L);

    assertFalse(result);
    verify(notificationMapper, never()).updateById(any());
  }

  @Test
  @DisplayName("markRead: returns false when notification belongs to different recipient")
  void markRead_wrongRecipient() {
    Notification notification = createNotification(1L, 10L, "标题", false);
    when(notificationMapper.selectById(1L)).thenReturn(notification);

    boolean result = notificationService.markRead(1L, 5L);

    assertFalse(result);
    verify(notificationMapper, never()).updateById(any());
  }

  @Test
  @DisplayName("markRead: handles already read notification")
  void markRead_alreadyRead() {
    Notification notification = createNotification(1L, 5L, "标题", true);
    when(notificationMapper.selectById(1L)).thenReturn(notification);

    boolean result = notificationService.markRead(1L, 5L);

    assertTrue(result);
    verify(notificationMapper).updateById(notification);
  }

  // ─── markAllRead ──────────────────────────────────────────────

  @Test
  @DisplayName("markAllRead: returns count of marked notifications")
  void markAllRead_success() {
    when(notificationMapper.markAllReadByRecipient(5L)).thenReturn(3);

    int result = notificationService.markAllRead(5L);

    assertEquals(3, result);
    verify(notificationMapper).markAllReadByRecipient(5L);
  }

  @Test
  @DisplayName("markAllRead: returns 0 when no unread notifications")
  void markAllRead_none() {
    when(notificationMapper.markAllReadByRecipient(5L)).thenReturn(0);

    int result = notificationService.markAllRead(5L);

    assertEquals(0, result);
    verify(notificationMapper).markAllReadByRecipient(5L);
  }

  // ─── countUnread ──────────────────────────────────────────────

  @Test
  @DisplayName("countUnread: returns count from mapper")
  void countUnread_returnsCount() {
    when(notificationMapper.countUnread(5L)).thenReturn(7);

    int result = notificationService.countUnread(5L);

    assertEquals(7, result);
    verify(notificationMapper).countUnread(5L);
  }

  @Test
  @DisplayName("countUnread: returns 0 when no unread notifications")
  void countUnread_zero() {
    when(notificationMapper.countUnread(5L)).thenReturn(0);

    int result = notificationService.countUnread(5L);

    assertEquals(0, result);
  }

  // ─── deleteRead ───────────────────────────────────────────────

  @Test
  @DisplayName("deleteRead: returns count of deleted notifications")
  void deleteRead_success() {
    when(notificationMapper.deleteReadByRecipient(5L)).thenReturn(5);

    int result = notificationService.deleteRead(5L);

    assertEquals(5, result);
    verify(notificationMapper).deleteReadByRecipient(5L);
  }

  @Test
  @DisplayName("deleteRead: returns 0 when no read notifications")
  void deleteRead_none() {
    when(notificationMapper.deleteReadByRecipient(5L)).thenReturn(0);

    int result = notificationService.deleteRead(5L);

    assertEquals(0, result);
    verify(notificationMapper).deleteReadByRecipient(5L);
  }

  // ─── helpers ─────────────────────────────────────────────────

  private Notification createNotification(Long id, Long recipientId, String title, boolean isRead) {
    Notification notification = new Notification();
    notification.setId(id);
    notification.setRecipientId(recipientId);
    notification.setTitle(title);
    notification.setContent("内容" + id);
    notification.setType("APPROVAL");
    notification.setIsRead(isRead);
    notification.setCreatedAt(LocalDateTime.now());
    notification.setUpdatedAt(LocalDateTime.now());
    notification.setDeleted(0);
    return notification;
  }
}
