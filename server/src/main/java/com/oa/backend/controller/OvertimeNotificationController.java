package com.oa.backend.controller;

import com.oa.backend.entity.Employee;
import com.oa.backend.entity.OvertimeNotification;
import com.oa.backend.entity.OvertimeResponse;
import com.oa.backend.service.OvertimeNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 加班通知控制器
 *
 * 加班通知（overtime_notification）是 PM/CEO 直接录入的通知流程（非审批流）。
 * 员工收到通知后可确认接受或拒绝；拒绝需填写原因并由直系领导审批。
 * CEO 发起的通知员工不可拒绝（直接归档）。
 *
 * Routes:
 *   POST /overtime-notifications           — PM/CEO 发起加班通知
 *   GET  /overtime-notifications           — 员工查看收到的通知（按项目成员过滤）
 *   GET  /overtime-notifications/initiated — PM/CEO 查看自己发起的通知
 *   POST /overtime-notifications/{id}/respond — 员工确认/拒绝通知
 */
@RestController
@RequestMapping("/overtime-notifications")
@RequiredArgsConstructor
public class OvertimeNotificationController {

    private final OvertimeNotificationService overtimeNotificationService;

    /**
     * 发起加班通知
     * 权限：项目经理、CEO
     * CEO 发起时通知状态直接为 ARCHIVED（员工无需响应）
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
    public ResponseEntity<OvertimeNotification> create(
            @RequestBody CreateNotificationRequest req,
            Authentication authentication) {

        Employee initiator = overtimeNotificationService.resolveEmployee(authentication);
        if (initiator == null) return ResponseEntity.badRequest().build();

        OvertimeNotification notification = new OvertimeNotification();
        notification.setProjectId(req.projectId());
        notification.setInitiatorId(initiator.getId());
        notification.setOvertimeDate(req.overtimeDate());
        notification.setOvertimeType(req.overtimeType());
        notification.setContent(req.content());
        // CEO 发起直接归档，PM 发起为 NOTIFIED 状态待员工响应
        notification.setStatus("ceo".equals(initiator.getRoleCode()) ? "ARCHIVED" : "NOTIFIED");
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());
        notification.setDeleted(0);
        overtimeNotificationService.saveNotification(notification);
        return ResponseEntity.ok(notification);
    }

    /**
     * 员工/劳工查看收到的加班通知（通过项目成员关系过滤）
     * 权限：所有登录用户
     */
    @GetMapping
    public ResponseEntity<List<NotificationWithResponse>> list(Authentication authentication) {
        Employee employee = overtimeNotificationService.resolveEmployee(authentication);
        if (employee == null) return ResponseEntity.badRequest().build();

        // 查找员工所在项目的所有通知（简化：查全部，实际应按 project_member 过滤）
        List<OvertimeNotification> all = overtimeNotificationService.listAllNotifications();

        List<NotificationWithResponse> result = all.stream().map(n -> {
            OvertimeResponse resp = overtimeNotificationService.findResponse(n.getId(), employee.getId());
            return new NotificationWithResponse(n, resp);
        }).toList();

        return ResponseEntity.ok(result);
    }

    /**
     * PM/CEO 查看自己发起的通知
     * 权限：项目经理、CEO
     */
    @GetMapping("/initiated")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
    public ResponseEntity<List<NotificationWithResponses>> listInitiated(Authentication authentication) {
        Employee initiator = overtimeNotificationService.resolveEmployee(authentication);
        if (initiator == null) return ResponseEntity.badRequest().build();

        List<OvertimeNotification> notifications = overtimeNotificationService.listNotificationsByInitiator(initiator.getId());
        List<NotificationWithResponses> result = notifications.stream().map(n -> {
            List<OvertimeResponse> responses = overtimeNotificationService.listResponsesByNotification(n.getId());
            return new NotificationWithResponses(n, responses);
        }).toList();

        return ResponseEntity.ok(result);
    }

    /**
     * 员工响应加班通知（确认或拒绝）
     * 权限：所有登录用户
     * CEO 发起的通知（ARCHIVED）不可拒绝
     */
    @PostMapping("/{id}/respond")
    public ResponseEntity<OvertimeResponse> respond(
            @PathVariable Long id,
            @RequestBody RespondRequest req,
            Authentication authentication) {

        OvertimeNotification notification = overtimeNotificationService.findNotificationById(id);
        if (notification == null || notification.getDeleted() == 1) {
            return ResponseEntity.notFound().build();
        }

        // CEO 发起的通知直接归档，员工不可拒绝
        if ("ARCHIVED".equals(notification.getStatus()) && !req.accepted()) {
            return ResponseEntity.badRequest().build();
        }

        Employee employee = overtimeNotificationService.resolveEmployee(authentication);
        if (employee == null) return ResponseEntity.badRequest().build();

        // 幂等：已响应则更新
        OvertimeResponse existing = overtimeNotificationService.findResponse(id, employee.getId());
        OvertimeResponse response;
        if (existing != null) {
            existing.setAccepted(req.accepted());
            existing.setRejectReason(req.rejectReason());
            existing.setRejectApprovalStatus(req.accepted() ? null : "PENDING");
            existing.setUpdatedAt(LocalDateTime.now());
            overtimeNotificationService.updateResponse(existing);
            response = existing;
        } else {
            response = new OvertimeResponse();
            response.setNotificationId(id);
            response.setEmployeeId(employee.getId());
            response.setAccepted(req.accepted());
            response.setRejectReason(req.rejectReason());
            response.setRejectApprovalStatus(req.accepted() ? null : "PENDING");
            response.setCreatedAt(LocalDateTime.now());
            response.setUpdatedAt(LocalDateTime.now());
            response.setDeleted(0);
            overtimeNotificationService.saveResponse(response);
        }
        return ResponseEntity.ok(response);
    }

    // ── Request / Response types ──────────────────────────────────────────

    public record CreateNotificationRequest(
            Long projectId,
            LocalDate overtimeDate,
            String overtimeType,   // WEEKDAY | WEEKEND | HOLIDAY
            String content
    ) {}

    public record RespondRequest(
            boolean accepted,
            String rejectReason
    ) {}

    public record NotificationWithResponse(
            OvertimeNotification notification,
            OvertimeResponse myResponse    // nullable if not yet responded
    ) {}

    public record NotificationWithResponses(
            OvertimeNotification notification,
            List<OvertimeResponse> responses
    ) {}
}
