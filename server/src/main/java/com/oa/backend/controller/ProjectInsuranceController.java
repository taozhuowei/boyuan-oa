package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.ProjectInsuranceDef;
import com.oa.backend.mapper.ProjectInsuranceDefMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 项目保险条目 Controller（设计 §8.4 保险成本）。
 * 配置由财务维护；项目经理 / CEO / 总经理可读。
 *
 * 注：本期未实装"按出勤天数自动累计"成本聚合接口；前端可基于 daily_rate × 累计出勤天数估算展示。
 *
 * 路由：
 *   GET    /projects/{id}/insurance        列表
 *   POST   /projects/{id}/insurance        新建（FINANCE）
 *   PUT    /projects/{id}/insurance/{itemId}  更新（FINANCE）
 *   DELETE /projects/{id}/insurance/{itemId}  删除（FINANCE）
 */
@RestController
@RequestMapping("/projects/{projectId}/insurance")
@RequiredArgsConstructor
public class ProjectInsuranceController {

    private final ProjectInsuranceDefMapper mapper;

    @GetMapping
    @PreAuthorize("hasAnyRole('CEO','GENERAL_MANAGER','FINANCE','PROJECT_MANAGER')")
    public ResponseEntity<List<ProjectInsuranceDef>> list(@PathVariable Long projectId) {
        return ResponseEntity.ok(mapper.selectList(
                new LambdaQueryWrapper<ProjectInsuranceDef>()
                        .eq(ProjectInsuranceDef::getProjectId, projectId)
                        .eq(ProjectInsuranceDef::getDeleted, 0)
                        .orderByAsc(ProjectInsuranceDef::getEffectiveDate)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CEO','FINANCE')")
    public ResponseEntity<?> create(@PathVariable Long projectId, @RequestBody InsuranceRequest req) {
        if (req.insuranceName() == null || req.insuranceName().isBlank()
                || req.scope() == null || req.dailyRate() == null || req.effectiveDate() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "insuranceName/scope/dailyRate/effectiveDate 必填"));
        }
        ProjectInsuranceDef d = new ProjectInsuranceDef();
        d.setProjectId(projectId);
        d.setInsuranceName(req.insuranceName());
        d.setScope(req.scope());
        d.setScopeTargetId(req.scopeTargetId());
        d.setDailyRate(req.dailyRate());
        d.setEffectiveDate(req.effectiveDate());
        d.setRemark(req.remark());
        d.setCreatedAt(LocalDateTime.now());
        d.setUpdatedAt(LocalDateTime.now());
        mapper.insert(d);
        return ResponseEntity.ok(d);
    }

    @PutMapping("/{itemId}")
    @PreAuthorize("hasAnyRole('CEO','FINANCE')")
    public ResponseEntity<?> update(@PathVariable Long projectId, @PathVariable Long itemId, @RequestBody InsuranceRequest req) {
        ProjectInsuranceDef d = mapper.selectById(itemId);
        if (d == null || d.getDeleted() == 1 || !d.getProjectId().equals(projectId)) {
            return ResponseEntity.notFound().build();
        }
        if (req.insuranceName() != null) d.setInsuranceName(req.insuranceName());
        if (req.scope() != null) d.setScope(req.scope());
        if (req.scopeTargetId() != null) d.setScopeTargetId(req.scopeTargetId());
        if (req.dailyRate() != null) d.setDailyRate(req.dailyRate());
        if (req.effectiveDate() != null) d.setEffectiveDate(req.effectiveDate());
        if (req.remark() != null) d.setRemark(req.remark());
        d.setUpdatedAt(LocalDateTime.now());
        mapper.updateById(d);
        return ResponseEntity.ok(d);
    }

    @DeleteMapping("/{itemId}")
    @PreAuthorize("hasAnyRole('CEO','FINANCE')")
    public ResponseEntity<?> delete(@PathVariable Long projectId, @PathVariable Long itemId) {
        ProjectInsuranceDef d = mapper.selectById(itemId);
        if (d == null || d.getDeleted() == 1 || !d.getProjectId().equals(projectId)) {
            return ResponseEntity.notFound().build();
        }
        mapper.deleteById(itemId);
        return ResponseEntity.ok(Map.of("message", "已删除", "id", itemId));
    }

    public record InsuranceRequest(String insuranceName, String scope, Long scopeTargetId,
                                   BigDecimal dailyRate, LocalDate effectiveDate, String remark) {}
}
