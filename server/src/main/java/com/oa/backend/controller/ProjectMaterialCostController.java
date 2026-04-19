package com.oa.backend.controller;

import com.oa.backend.entity.ProjectMaterialCost;
import com.oa.backend.service.ProjectMaterialCostService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 项目实体成本（物料/设备直接成本）Controller。 录入权限：PM / 财务 / CEO / 总经理 / 项目下持有 MATERIAL_MANAGER 第二角色的员工。 业务逻辑委托给
 * {@link ProjectMaterialCostService}。
 */
@RestController
@RequestMapping("/projects/{projectId}/material-costs")
@RequiredArgsConstructor
public class ProjectMaterialCostController {

  private final ProjectMaterialCostService costService;

  @GetMapping
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<List<ProjectMaterialCost>> list(@PathVariable Long projectId) {
    return ResponseEntity.ok(costService.listCostsByProjectId(projectId));
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('CEO','GENERAL_MANAGER','PROJECT_MANAGER','FINANCE','EMPLOYEE')")
  public ResponseEntity<?> create(
      @PathVariable Long projectId, @RequestBody CostRequest req, Authentication auth) {
    Long me = costService.resolveEmployeeId(auth.getName());
    if (!costService.canRecord(me, projectId, auth)) {
      return ResponseEntity.status(403).body(Map.of("message", "无权录入此项目实体成本"));
    }
    if (req.itemName() == null
        || req.itemName().isBlank()
        || req.quantity() == null
        || req.unit() == null
        || req.unit().isBlank()
        || req.unitPrice() == null
        || req.occurredOn() == null) {
      return ResponseEntity.badRequest()
          .body(Map.of("message", "itemName/quantity/unit/unitPrice/occurredOn 必填"));
    }
    ProjectMaterialCost c = new ProjectMaterialCost();
    c.setProjectId(projectId);
    c.setItemName(req.itemName());
    c.setSpec(req.spec());
    c.setQuantity(req.quantity());
    c.setUnit(req.unit());
    c.setUnitPrice(req.unitPrice());
    c.setOccurredOn(req.occurredOn());
    c.setRemark(req.remark());
    return ResponseEntity.ok(costService.createCost(c, me));
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('CEO','GENERAL_MANAGER','PROJECT_MANAGER','FINANCE','EMPLOYEE')")
  public ResponseEntity<?> update(
      @PathVariable Long projectId,
      @PathVariable Long id,
      @RequestBody CostRequest req,
      Authentication auth) {
    ProjectMaterialCost c = costService.getCostByIdAndProject(id, projectId);
    if (c == null) return ResponseEntity.notFound().build();
    Long me = costService.resolveEmployeeId(auth.getName());
    if (!costService.canRecord(me, projectId, auth)) {
      return ResponseEntity.status(403).body(Map.of("message", "无权修改"));
    }
    if (req.itemName() != null) c.setItemName(req.itemName());
    if (req.spec() != null) c.setSpec(req.spec());
    if (req.quantity() != null) c.setQuantity(req.quantity());
    if (req.unit() != null) c.setUnit(req.unit());
    if (req.unitPrice() != null) c.setUnitPrice(req.unitPrice());
    if (req.occurredOn() != null) c.setOccurredOn(req.occurredOn());
    if (req.remark() != null) c.setRemark(req.remark());
    return ResponseEntity.ok(costService.updateCost(c));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('CEO','PROJECT_MANAGER','FINANCE')")
  public ResponseEntity<?> delete(@PathVariable Long projectId, @PathVariable Long id) {
    ProjectMaterialCost c = costService.getCostByIdAndProject(id, projectId);
    if (c == null) return ResponseEntity.notFound().build();
    costService.deleteCost(id);
    return ResponseEntity.ok(Map.of("message", "已删除", "id", id));
  }

  public record CostRequest(
      String itemName,
      String spec,
      BigDecimal quantity,
      String unit,
      BigDecimal unitPrice,
      LocalDate occurredOn,
      String remark) {}
}
