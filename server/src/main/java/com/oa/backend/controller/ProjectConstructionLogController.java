package com.oa.backend.controller;

import com.oa.backend.service.ConstructionLogMaterialsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/**
 * 项目施工日志辅助视图（设计 §8.3 — PM 审核 "通过并补充" 所需材料汇总）。
 *
 *   GET /projects/{id}/construction-log/materials-summary?startDate=&endDate=
 *     聚合同项目期间所有 LOG 表单 form_data.materials，返回每种材料 × 各日期矩阵
 */
@RestController
@RequestMapping("/projects/{projectId}/construction-log")
@RequiredArgsConstructor
public class ProjectConstructionLogController {

    private final ConstructionLogMaterialsService materialsService;

    @GetMapping("/materials-summary")
    @PreAuthorize("hasAnyRole('CEO','GENERAL_MANAGER','PROJECT_MANAGER','FINANCE')")
    public ResponseEntity<Map<String, Object>> materialsSummary(
            @PathVariable Long projectId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        LocalDate s = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate e = endDate != null ? endDate : LocalDate.now();
        return ResponseEntity.ok(materialsService.aggregate(projectId, s, e));
    }
}
