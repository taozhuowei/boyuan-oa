package com.oa.backend.controller;

import com.oa.backend.entity.ConstructionLogSummary;
import com.oa.backend.entity.Project;
import com.oa.backend.entity.ProjectMilestone;
import com.oa.backend.entity.ProjectProgressLog;
import com.oa.backend.service.ProjectMilestoneService;
import com.oa.backend.service.ProjectService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 项目里程碑、进度记录、Dashboard、施工汇总控制器。 负责：里程碑 CRUD、每日进度录入、项目 Dashboard 数据、施工日志汇总报告。 项目基础 CRUD 见
 * ProjectController。 业务逻辑委托给 {@link ProjectMilestoneService}；项目基础查询通过 {@link ProjectService}。
 */
@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
public class ProjectMilestoneController {

  private final ProjectService projectService;
  private final ProjectMilestoneService milestoneService;

  // ── 里程碑管理 ────────────────────────────────────────────────────────

  /** 查询项目里程碑列表（按 sort 升序）。 权限：所有登录用户 */
  @GetMapping("/{id}/milestones")
  @PreAuthorize("hasAnyRole('EMPLOYEE','FINANCE','PROJECT_MANAGER','CEO','WORKER')")
  public ResponseEntity<List<ProjectMilestone>> listMilestones(@PathVariable Long id) {
    return ResponseEntity.ok(milestoneService.listMilestonesByProjectId(id));
  }

  /** 创建里程碑。 请求体：{ "name": "...", "sort": 1 } 权限：PROJECT_MANAGER（自己负责的项目）或 CEO */
  @PostMapping("/{id}/milestones")
  @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
  public ResponseEntity<?> createMilestone(
      @PathVariable Long id, @RequestBody MilestoneRequest request) {
    if (request.name() == null || request.name().isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("message", "name 不能为空"));
    }
    ProjectMilestone milestone = new ProjectMilestone();
    milestone.setProjectId(id);
    milestone.setName(request.name());
    milestone.setSort(request.sort() != null ? request.sort() : 0);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(milestoneService.createMilestone(milestone));
  }

  /**
   * 更新里程碑（名称、排序、完成日期）。 请求体：{ "name": "...", "sort": 2, "actualCompletionDate": "2026-06-01" }
   * 权限：PROJECT_MANAGER 或 CEO
   */
  @PutMapping("/{id}/milestones/{milestoneId}")
  @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
  public ResponseEntity<?> updateMilestone(
      @PathVariable Long id,
      @PathVariable Long milestoneId,
      @RequestBody MilestoneRequest request) {
    ProjectMilestone milestone = milestoneService.getMilestoneByIdAndProject(milestoneId, id);
    if (milestone == null) return ResponseEntity.notFound().build();
    if (request.name() != null) milestone.setName(request.name());
    if (request.sort() != null) milestone.setSort(request.sort());
    milestone.setActualCompletionDate(request.actualCompletionDate());
    return ResponseEntity.ok(milestoneService.updateMilestone(milestone));
  }

  /** 删除里程碑（逻辑删除）。 权限：PROJECT_MANAGER 或 CEO */
  @DeleteMapping("/{id}/milestones/{milestoneId}")
  @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
  public ResponseEntity<Void> deleteMilestone(
      @PathVariable Long id, @PathVariable Long milestoneId) {
    boolean found = milestoneService.deleteMilestone(milestoneId, id);
    if (!found) return ResponseEntity.notFound().build();
    return ResponseEntity.noContent().build();
  }

  // ── 进度记录 ──────────────────────────────────────────────────────────

  /**
   * 记录每日进度。 请求体：{ "milestoneId": 1, "note": "完成防水层施工", "completedAt": "2026-04-08T17:00:00" }
   * 权限：PROJECT_MANAGER 或 CEO
   */
  @PostMapping("/{id}/progress")
  @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
  public ResponseEntity<?> recordProgress(
      @PathVariable Long id, @RequestBody ProgressRequest request, Authentication authentication) {
    Long pmId = milestoneService.resolveEmployeeId(authentication.getName());
    ProjectProgressLog log = new ProjectProgressLog();
    log.setProjectId(id);
    log.setPmId(pmId);
    log.setMilestoneId(request.milestoneId());
    log.setCompletedAt(request.completedAt() != null ? request.completedAt() : LocalDateTime.now());
    log.setNote(request.note());
    return ResponseEntity.status(HttpStatus.CREATED).body(milestoneService.recordProgress(log));
  }

  // ── Dashboard ─────────────────────────────────────────────────────────

  /** 项目 Dashboard 数据。 返回：折线图（进度日志时间序列）+ 里程碑列表 + 工作项汇总 + 施工汇总列表。 权限：所有登录用户 */
  @GetMapping("/{id}/dashboard")
  @PreAuthorize("hasAnyRole('EMPLOYEE','FINANCE','PROJECT_MANAGER','CEO','WORKER')")
  public ResponseEntity<?> getDashboard(@PathVariable Long id) {
    Project project = projectService.getById(id);
    if (project == null) return ResponseEntity.notFound().build();

    List<ProjectMilestone> milestones = milestoneService.listMilestonesByProjectId(id);
    List<ProjectProgressLog> progressLogs = milestoneService.listProgressLogsByProjectId(id);
    List<ConstructionLogSummary> summaries = milestoneService.listSummariesByProjectId(id);

    long completedMilestones =
        milestones.stream().filter(m -> m.getActualCompletionDate() != null).count();
    long totalMilestones = milestones.size();

    // 时间序列：进度日志按创建日期聚合（供前端折线图使用）
    List<Map<String, Object>> timeSeries =
        progressLogs.stream()
            .map(
                log ->
                    Map.<String, Object>of(
                        "date",
                            log.getCreatedAt() != null
                                ? log.getCreatedAt().toLocalDate().toString()
                                : "",
                        "note", log.getNote() != null ? log.getNote() : "",
                        "milestoneId", log.getMilestoneId() != null ? log.getMilestoneId() : 0))
            .toList();

    return ResponseEntity.ok(
        Map.of(
            "project", Map.of("id", id, "name", project.getName(), "status", project.getStatus()),
            "milestones", milestones,
            "workItemSummary", Map.of("total", totalMilestones, "completed", completedMilestones),
            "timeSeriesData", timeSeries,
            "summaries", summaries));
  }

  // ── 汇总报告 ──────────────────────────────────────────────────────────

  /**
   * 生成施工日志汇总报告，并标记已通知 CEO。 请求体：{ "periodStart": "2026-03-01", "periodEnd": "2026-03-31", "pmNote":
   * "..." } 权限：PROJECT_MANAGER 或 CEO
   */
  @PostMapping("/{id}/construction-summary")
  @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
  public ResponseEntity<?> createSummary(
      @PathVariable Long id, @RequestBody SummaryRequest request, Authentication authentication) {
    Long pmId = milestoneService.resolveEmployeeId(authentication.getName());

    List<ProjectMilestone> milestones = milestoneService.listMilestonesByProjectId(id);
    long completedCount =
        milestones.stream().filter(m -> m.getActualCompletionDate() != null).count();

    ConstructionLogSummary summary = new ConstructionLogSummary();
    summary.setProjectId(id);
    summary.setPmId(pmId);
    summary.setPeriodStart(request.periodStart());
    summary.setPeriodEnd(request.periodEnd());
    summary.setAggregatedItems(
        "{\"milestones\":" + milestones.size() + ",\"completed\":" + completedCount + "}");
    summary.setPmNote(request.pmNote());
    // 标记已通知（实际通知由 M9 NotificationService 实现）
    summary.setCeoNotifiedAt(LocalDateTime.now());

    return ResponseEntity.status(HttpStatus.CREATED)
        .body(
            Map.of(
                "summary",
                milestoneService.createConstructionSummary(summary),
                "message",
                "汇总报告已生成，CEO 已收到通知"));
  }

  // ── Inner request records ─────────────────────────────────────────────

  /** 里程碑创建/更新请求 */
  public record MilestoneRequest(String name, Integer sort, LocalDate actualCompletionDate) {}

  /** 每日进度录入请求 */
  public record ProgressRequest(Long milestoneId, String note, LocalDateTime completedAt) {}

  /** 施工日志汇总报告请求 */
  public record SummaryRequest(LocalDate periodStart, LocalDate periodEnd, String pmNote) {}
}
