package com.oa.backend.controller;

import com.oa.backend.entity.ProjectInsuranceDef;
import com.oa.backend.service.InsuranceCostService;
import com.oa.backend.service.ProjectInsuranceService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 项目保险条目 Controller（设计 §8.4 保险成本）。 配置由财务维护；项目经理 / CEO / 总经理可读。 条目 CRUD 委托给 {@link
 * ProjectInsuranceService}； 成本聚合（GET /summary）通过 {@link InsuranceCostService} 从
 * construction_attendance 真实出勤数据计算。
 *
 * <p>路由： GET /projects/{id}/insurance 列表 POST /projects/{id}/insurance 新建（FINANCE） PUT
 * /projects/{id}/insurance/{itemId} 更新（FINANCE） DELETE /projects/{id}/insurance/{itemId}
 * 删除（FINANCE） GET /projects/{id}/insurance/summary 本期出勤+成本聚合（默认本月，可传 startDate/endDate）
 */
@RestController
@RequestMapping("/projects/{projectId}/insurance")
@RequiredArgsConstructor
public class ProjectInsuranceController {

  private final ProjectInsuranceService insuranceService;
  private final InsuranceCostService costService;

  @GetMapping
  @PreAuthorize("hasAnyRole('CEO','GENERAL_MANAGER','FINANCE','PROJECT_MANAGER')")
  public ResponseEntity<List<ProjectInsuranceDef>> list(@PathVariable Long projectId) {
    return ResponseEntity.ok(insuranceService.listByProjectId(projectId));
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('CEO','FINANCE')")
  public ResponseEntity<?> create(@PathVariable Long projectId, @RequestBody InsuranceRequest req) {
    if (req.insuranceName() == null
        || req.insuranceName().isBlank()
        || req.scope() == null
        || req.dailyRate() == null
        || req.effectiveDate() == null) {
      return ResponseEntity.badRequest()
          .body(Map.of("message", "insuranceName/scope/dailyRate/effectiveDate 必填"));
    }
    ProjectInsuranceDef d = new ProjectInsuranceDef();
    d.setProjectId(projectId);
    d.setInsuranceName(req.insuranceName());
    d.setScope(req.scope());
    d.setScopeTargetId(req.scopeTargetId());
    d.setDailyRate(req.dailyRate());
    d.setEffectiveDate(req.effectiveDate());
    d.setRemark(req.remark());
    return ResponseEntity.ok(insuranceService.createInsurance(d));
  }

  @PutMapping("/{itemId}")
  @PreAuthorize("hasAnyRole('CEO','FINANCE')")
  public ResponseEntity<?> update(
      @PathVariable Long projectId, @PathVariable Long itemId, @RequestBody InsuranceRequest req) {
    ProjectInsuranceDef d = insuranceService.getByIdAndProject(itemId, projectId);
    if (d == null) return ResponseEntity.notFound().build();
    if (req.insuranceName() != null) d.setInsuranceName(req.insuranceName());
    if (req.scope() != null) d.setScope(req.scope());
    if (req.scopeTargetId() != null) d.setScopeTargetId(req.scopeTargetId());
    if (req.dailyRate() != null) d.setDailyRate(req.dailyRate());
    if (req.effectiveDate() != null) d.setEffectiveDate(req.effectiveDate());
    if (req.remark() != null) d.setRemark(req.remark());
    return ResponseEntity.ok(insuranceService.updateInsurance(d));
  }

  @DeleteMapping("/{itemId}")
  @PreAuthorize("hasAnyRole('CEO','FINANCE')")
  public ResponseEntity<?> delete(@PathVariable Long projectId, @PathVariable Long itemId) {
    ProjectInsuranceDef d = insuranceService.getByIdAndProject(itemId, projectId);
    if (d == null) return ResponseEntity.notFound().build();
    insuranceService.deleteInsurance(itemId);
    return ResponseEntity.ok(Map.of("message", "已删除", "id", itemId));
  }

  @GetMapping("/summary")
  @PreAuthorize("hasAnyRole('CEO','GENERAL_MANAGER','FINANCE','PROJECT_MANAGER')")
  public ResponseEntity<List<Map<String, Object>>> summary(
      @PathVariable Long projectId,
      @RequestParam(required = false) LocalDate startDate,
      @RequestParam(required = false) LocalDate endDate) {
    LocalDate s = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
    LocalDate e = endDate != null ? endDate : LocalDate.now();

    // 加载条目（含元数据）+ 真实出勤聚合
    List<ProjectInsuranceDef> defs = insuranceService.listByProjectId(projectId);
    List<InsuranceCostService.ItemCost> costs = costService.computeAll(projectId, s, e);
    Map<Long, InsuranceCostService.ItemCost> byDef = new HashMap<>();
    for (InsuranceCostService.ItemCost c : costs) byDef.put(c.defId(), c);

    List<Map<String, Object>> out = new ArrayList<>();
    BigDecimal total = BigDecimal.ZERO;
    for (ProjectInsuranceDef def : defs) {
      InsuranceCostService.ItemCost c =
          byDef.getOrDefault(
              def.getId(), new InsuranceCostService.ItemCost(def.getId(), 0L, BigDecimal.ZERO));
      Map<String, Object> row = new HashMap<>();
      row.put("id", def.getId());
      row.put("insuranceName", def.getInsuranceName());
      row.put("scope", def.getScope());
      row.put("scopeTargetId", def.getScopeTargetId());
      row.put("dailyRate", def.getDailyRate());
      row.put("effectiveDate", def.getEffectiveDate());
      row.put("manDays", c.manDays());
      row.put("cost", c.cost());
      out.add(row);
      total = total.add(c.cost());
    }
    Map<String, Object> totalRow = new HashMap<>();
    totalRow.put("id", null);
    totalRow.put("insuranceName", "本期保险成本合计");
    totalRow.put("isTotal", true);
    totalRow.put("cost", total);
    out.add(totalRow);
    return ResponseEntity.ok(out);
  }

  public record InsuranceRequest(
      String insuranceName,
      String scope,
      Long scopeTargetId,
      BigDecimal dailyRate,
      LocalDate effectiveDate,
      String remark) {}
}
