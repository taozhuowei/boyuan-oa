package com.oa.backend.controller;

import com.oa.backend.entity.Notification;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 通知控制器。
 * <p>
 * 提供通知的查询、已读标记和清理功能。
 * 所有接口需要登录用户才能访问。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * 获取当前用户的通知列表，支持分页。
     * <p>
     * 通知按创建时间降序排列，最新的在前。
     *
     * @param page           页码，从 0 开始，默认为 0
     * @param size           每页大小，默认为 20
     * @param authentication 当前用户认证信息
     * @return 通知列表
     */
    @GetMapping
    public ResponseEntity<List<Notification>> listNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        Long recipientId = SecurityUtils.getCurrentEmployeeId(authentication);
        if (recipientId == null) {
            return ResponseEntity.status(403).build();
        }
        List<Notification> notifications = notificationService.listByRecipient(recipientId, page, size);
        return ResponseEntity.ok(notifications);
    }

    /**
     * 将指定通知标记为已读。
     * <p>
     * 用户只能标记属于自己的通知为已读。
     *
     * @param id             通知 ID
     * @param authentication 当前用户认证信息
     * @return 操作结果，成功返回 200，无权限返回 403，不存在返回 404
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, Authentication authentication) {
        Long recipientId = SecurityUtils.getCurrentEmployeeId(authentication);
        if (recipientId == null) {
            return ResponseEntity.status(403).body(Map.of("message", "无法识别当前用户"));
        }

        boolean success = notificationService.markRead(id, recipientId);
        if (!success) {
            return ResponseEntity.status(404).body(Map.of("message", "通知不存在或无权限"));
        }
        return ResponseEntity.ok(Map.of("message", "已标记为已读", "id", id));
    }

    /**
     * 将所有未读通知标记为已读。
     *
     * @param authentication 当前用户认证信息
     * @return 操作结果，包含标记数量
     */
    @PostMapping("/read-all")
    public ResponseEntity<?> markAllRead(Authentication authentication) {
        Long recipientId = SecurityUtils.getCurrentEmployeeId(authentication);
        if (recipientId == null) {
            return ResponseEntity.status(403).body(Map.of("message", "无法识别当前用户"));
        }

        int count = notificationService.markAllRead(recipientId);
        return ResponseEntity.ok(Map.of("message", "已批量标记为已读", "count", count));
    }

    /**
     * 删除所有已读通知。
     *
     * @param authentication 当前用户认证信息
     * @return 操作结果，包含删除数量
     */
    @DeleteMapping("/read")
    public ResponseEntity<?> deleteRead(Authentication authentication) {
        Long recipientId = SecurityUtils.getCurrentEmployeeId(authentication);
        if (recipientId == null) {
            return ResponseEntity.status(403).body(Map.of("message", "无法识别当前用户"));
        }

        int count = notificationService.deleteRead(recipientId);
        return ResponseEntity.ok(Map.of("message", "已删除已读通知", "count", count));
    }

    /**
     * 获取未读通知数量。
     *
     * @param authentication 当前用户认证信息
     * @return 未读通知数量，格式：{ "count": N }
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Integer>> countUnread(Authentication authentication) {
        Long recipientId = SecurityUtils.getCurrentEmployeeId(authentication);
        if (recipientId == null) {
            return ResponseEntity.status(403).build();
        }

        int count = notificationService.countUnread(recipientId);
        return ResponseEntity.ok(Map.of("count", count));
    }
}
