package com.oa.backend.controller;

import com.oa.backend.entity.AfterSaleTicket;
import com.oa.backend.entity.AfterSaleTypeDef;
import com.oa.backend.service.AfterSaleService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 售后问题单 Controller。 维护权限：CEO / 总经理 / PM / 项目下持有 AFTER_SALES 第二角色的员工。 业务逻辑委托给 {@link
 * AfterSaleService}。
 */
@RestController
@RequestMapping("/after-sale")
@RequiredArgsConstructor
public class AfterSaleController {

  private final AfterSaleService afterSaleService;

  @GetMapping("/types")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<List<AfterSaleTypeDef>> listTypes() {
    return ResponseEntity.ok(afterSaleService.listEnabledTypes());
  }

  @GetMapping("/tickets")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<List<AfterSaleTicket>> list(
      @RequestParam(required = false) Long projectId,
      @RequestParam(required = false) String status) {
    return ResponseEntity.ok(afterSaleService.listTickets(projectId, status));
  }

  @PostMapping("/tickets")
  @PreAuthorize("hasAnyRole('CEO','GENERAL_MANAGER','PROJECT_MANAGER','EMPLOYEE')")
  public ResponseEntity<?> create(@RequestBody TicketRequest req, Authentication auth) {
    if (req.projectId() == null
        || req.typeCode() == null
        || req.incidentDate() == null
        || req.description() == null
        || req.description().isBlank()) {
      return ResponseEntity.badRequest()
          .body(Map.of("message", "projectId/typeCode/incidentDate/description 必填"));
    }
    Long me = afterSaleService.resolveEmployeeId(auth.getName());
    if (!afterSaleService.canMaintain(me, req.projectId(), auth)) {
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
    t.setStatus(req.status());
    t.setHandlerId(req.handlerId());
    return ResponseEntity.ok(afterSaleService.createTicket(t, me));
  }

  @PutMapping("/tickets/{id}")
  @PreAuthorize("hasAnyRole('CEO','GENERAL_MANAGER','PROJECT_MANAGER','EMPLOYEE')")
  public ResponseEntity<?> update(
      @PathVariable Long id, @RequestBody TicketRequest req, Authentication auth) {
    AfterSaleTicket t = afterSaleService.getTicketById(id);
    if (t == null) return ResponseEntity.notFound().build();
    Long me = afterSaleService.resolveEmployeeId(auth.getName());
    if (!afterSaleService.canMaintain(me, t.getProjectId(), auth)) {
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
    return ResponseEntity.ok(afterSaleService.updateTicket(t));
  }

  @DeleteMapping("/tickets/{id}")
  @PreAuthorize("hasAnyRole('CEO','PROJECT_MANAGER')")
  public ResponseEntity<?> delete(@PathVariable Long id) {
    AfterSaleTicket t = afterSaleService.getTicketById(id);
    if (t == null) return ResponseEntity.notFound().build();
    afterSaleService.deleteTicket(id);
    return ResponseEntity.ok(Map.of("message", "已删除", "id", id));
  }

  public record TicketRequest(
      Long projectId,
      String typeCode,
      LocalDate incidentDate,
      String description,
      String customerFeedback,
      String resolution,
      Long attachmentId,
      String status,
      Long handlerId) {}
}
