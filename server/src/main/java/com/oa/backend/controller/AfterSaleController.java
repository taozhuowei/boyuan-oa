package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.AfterSaleTicket;
import com.oa.backend.entity.AfterSaleTypeDef;
import com.oa.backend.entity.SecondRoleAssignment;
import com.oa.backend.mapper.AfterSaleTicketMapper;
import com.oa.backend.mapper.AfterSaleTypeDefMapper;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.SecondRoleAssignmentMapper;
import com.oa.backend.security.SecurityUtils;
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
 * 售后问题单 Controller。
 * 维护权限：CEO / 总经理 / PM / 项目下持有 AFTER_SALES 第二角色的员工。
 */
@RestController
@RequestMapping("/after-sale")
@RequiredArgsConstructor
public class AfterSaleController {

    private final AfterSaleTicketMapper ticketMapper;
    private final AfterSaleTypeDefMapper typeMapper;
    private final SecondRoleAssignmentMapper secondRoleMapper;
    private final EmployeeMapper employeeMapper;

    @GetMapping("/types")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AfterSaleTypeDef>> listTypes() {
        return ResponseEntity.ok(typeMapper.selectList(
                new LambdaQueryWrapper<AfterSaleTypeDef>()
                        .eq(AfterSaleTypeDef::getIsEnabled, true)
                        .eq(AfterSaleTypeDef::getDeleted, 0)
                        .orderByAsc(AfterSaleTypeDef::getDisplayOrder)));
    }

    @GetMapping("/tickets")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AfterSaleTicket>> list(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String status) {
        LambdaQueryWrapper<AfterSaleTicket> q = new LambdaQueryWrapper<AfterSaleTicket>()
                .eq(AfterSaleTicket::getDeleted, 0)
                .orderByDesc(AfterSaleTicket::getIncidentDate);
        if (projectId != null) q.eq(AfterSaleTicket::getProjectId, projectId);
        if (status != null && !status.isBlank()) q.eq(AfterSaleTicket::getStatus, status);
        return ResponseEntity.ok(ticketMapper.selectList(q));
    }

    @PostMapping("/tickets")
    @PreAuthorize("hasAnyRole('CEO','GENERAL_MANAGER','PROJECT_MANAGER','EMPLOYEE')")
    public ResponseEntity<?> create(@RequestBody TicketRequest req, Authentication auth) {
        if (req.projectId() == null || req.typeCode() == null || req.incidentDate() == null
                || req.description() == null || req.description().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "projectId/typeCode/incidentDate/description 必填"));
        }
        Long me = SecurityUtils.getEmployeeIdFromUsername(auth.getName(), employeeMapper);
        if (!canMaintain(me, req.projectId(), auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "无权在此项目维护售后问题单"));
        }

        AfterSaleTicket t = new AfterSaleTicket();
        t.setProjectId(req.projectId());
        t.setTypeCode(req.typeCode());
        t.setIncidentDate(req.incidentDate());
        t.setDescription(req.description());
        t.setCustomerFeedback(req.customerFeedback());
        t.setResolution(req.resolution());
        t.setAttachmentId(req.attachmentId());
        t.setStatus(req.status() == null ? "PENDING" : req.status());
        t.setCreatedBy(me);
        t.setHandlerId(req.handlerId());
        t.setCreatedAt(LocalDateTime.now());
        t.setUpdatedAt(LocalDateTime.now());
        ticketMapper.insert(t);
        return ResponseEntity.ok(t);
    }

    @PutMapping("/tickets/{id}")
    @PreAuthorize("hasAnyRole('CEO','GENERAL_MANAGER','PROJECT_MANAGER','EMPLOYEE')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody TicketRequest req, Authentication auth) {
        AfterSaleTicket t = ticketMapper.selectById(id);
        if (t == null || t.getDeleted() == 1) return ResponseEntity.notFound().build();
        Long me = SecurityUtils.getEmployeeIdFromUsername(auth.getName(), employeeMapper);
        if (!canMaintain(me, t.getProjectId(), auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "无权维护此问题单"));
        }
        if (req.typeCode() != null) t.setTypeCode(req.typeCode());
        if (req.incidentDate() != null) t.setIncidentDate(req.incidentDate());
        if (req.description() != null) t.setDescription(req.description());
        if (req.customerFeedback() != null) t.setCustomerFeedback(req.customerFeedback());
        if (req.resolution() != null) t.setResolution(req.resolution());
        if (req.attachmentId() != null) t.setAttachmentId(req.attachmentId());
        if (req.handlerId() != null) t.setHandlerId(req.handlerId());
        if (req.status() != null) {
            t.setStatus(req.status());
            if ("CLOSED".equals(req.status()) && t.getClosedAt() == null) {
                t.setClosedAt(LocalDateTime.now());
            }
        }
        t.setUpdatedAt(LocalDateTime.now());
        ticketMapper.updateById(t);
        return ResponseEntity.ok(t);
    }

    @DeleteMapping("/tickets/{id}")
    @PreAuthorize("hasAnyRole('CEO','PROJECT_MANAGER')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        AfterSaleTicket t = ticketMapper.selectById(id);
        if (t == null || t.getDeleted() == 1) return ResponseEntity.notFound().build();
        ticketMapper.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "已删除", "id", id));
    }

    private boolean canMaintain(Long employeeId, Long projectId, Authentication auth) {
        if (employeeId == null) return false;
        if (SecurityUtils.isCEO(auth) || SecurityUtils.isProjectManager(auth)) return true;
        // 总经理（按设计 §3.2）通过角色串判断
        if (auth.getAuthorities().stream().anyMatch(a -> "ROLE_GENERAL_MANAGER".equals(a.getAuthority()))) return true;
        // 持有该项目 AFTER_SALES 第二角色的员工
        Long count = secondRoleMapper.selectCount(
                new LambdaQueryWrapper<SecondRoleAssignment>()
                        .eq(SecondRoleAssignment::getEmployeeId, employeeId)
                        .eq(SecondRoleAssignment::getRoleCode, "AFTER_SALES")
                        .eq(SecondRoleAssignment::getProjectId, projectId)
                        .eq(SecondRoleAssignment::getRevoked, false)
                        .eq(SecondRoleAssignment::getDeleted, 0));
        return count != null && count > 0;
    }

    public record TicketRequest(
            Long projectId, String typeCode, LocalDate incidentDate,
            String description, String customerFeedback, String resolution,
            Long attachmentId, String status, Long handlerId) {}
}
