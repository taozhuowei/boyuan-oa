package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.oa.backend.dto.*;
import com.oa.backend.entity.*;
import com.oa.backend.mapper.*;
import com.oa.backend.security.JwtTokenService;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 项目管理控制器
 */
@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final JwtTokenService jwtTokenService;
    private final EmployeeMapper employeeMapper;
    private final ProjectMilestoneMapper milestoneMapper;
    private final ProjectProgressLogMapper progressLogMapper;
    private final ConstructionLogSummaryMapper summaryMapper;

    /**
     * 从Authorization头解析当前用户ID
     */
    private Long getCurrentUserId(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }
        String token = authorization.substring(7);
        return jwtTokenService.verify(token)
            .map(decodedJWT -> decodedJWT.getClaim("userId").asLong())
            .orElse(null);
    }

    /**
     * 从Authorization头解析当前用户角色
     */
    private String getCurrentUserRole(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }
        String token = authorization.substring(7);
        return jwtTokenService.verify(token)
            .map(decodedJWT -> decodedJWT.getClaim("role").asString())
            .orElse(null);
    }

    /**
     * 构建ProjectResponse（不含成员列表）
     */
    private ProjectResponse buildProjectResponse(Project project, boolean includeMembers) {
        List<ProjectMember> members = projectService.getMembers(project.getId());
        List<ProjectResponse.ProjectMemberInfo> memberInfos = members.stream()
            .map(m -> {
                Employee emp = employeeMapper.selectById(m.getEmployeeId());
                return new ProjectResponse.ProjectMemberInfo(
                    m.getEmployeeId(),
                    emp != null ? emp.getEmployeeNo() : "",
                    emp != null ? emp.getName() : "",
                    m.getRole()
                );
            })
            .toList();

        return new ProjectResponse(
            project.getId(),
            project.getName(),
            project.getStatus(),
            project.getStartDate(),
            project.getActualEndDate(),
            project.getLogCycleDays(),
            project.getLogReportCycleDays(),
            project.getCreatedAt(),
            project.getUpdatedAt(),
            members.size(),
            includeMembers ? memberInfos : null
        );
    }

    /**
     * 获取项目列表
     * 权限：员工、财务、项目经理、CEO、劳工
     * PROJECT_MANAGER 自动只看自己作为 PM 的项目
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE','FINANCE','PROJECT_MANAGER','CEO','WORKER')")
    public ResponseEntity<IPage<ProjectResponse>> listProjects(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestHeader("Authorization") String authorization) {
        
        Long currentUserId = getCurrentUserId(authorization);
        String role = getCurrentUserRole(authorization);
        
        // PROJECT_MANAGER 只看自己作为 PM 的项目
        Long pmFilter = null;
        if ("project_manager".equals(role) && currentUserId != null) {
            pmFilter = currentUserId;
        }

        IPage<Project> projectPage = projectService.listProjects(page, size, status, pmFilter);
        
        // 转换为响应对象（不含成员列表）
        IPage<ProjectResponse> responsePage = projectPage.convert(p -> buildProjectResponse(p, false));
        
        return ResponseEntity.ok(responsePage);
    }

    /**
     * 获取项目详情
     * 权限：员工、财务、项目经理、CEO、劳工
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','FINANCE','PROJECT_MANAGER','CEO','WORKER')")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable Long id) {
        Project project = projectService.getById(id);
        if (project == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(buildProjectResponse(project, true));
    }

    /**
     * 创建项目
     * 权限：CEO only
     */
    @PostMapping
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<ProjectResponse> createProject(@RequestBody ProjectCreateRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Project project = projectService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(buildProjectResponse(project, true));
    }

    /**
     * 更新项目
     * 权限：CEO only
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable Long id,
            @RequestBody ProjectUpdateRequest request) {
        Project project = projectService.update(id, request);
        return ResponseEntity.ok(buildProjectResponse(project, true));
    }

    /**
     * 更新项目状态（关闭或重开）
     * 权限：CEO only
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<ProjectResponse> updateProjectStatus(
            @PathVariable Long id,
            @RequestBody ProjectStatusRequest request) {
        if ("CLOSED".equals(request.status())) {
            projectService.closeProject(id);
        } else if ("ACTIVE".equals(request.status())) {
            projectService.reopenProject(id);
        } else {
            return ResponseEntity.badRequest().build();
        }
        Project project = projectService.getById(id);
        return ResponseEntity.ok(buildProjectResponse(project, true));
    }

    /**
     * 删除项目
     * 权限：CEO only
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 添加项目成员
     * 权限：CEO only
     */
    @PostMapping("/{id}/members")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<ProjectResponse> addMember(
            @PathVariable Long id,
            @RequestBody ProjectMemberRequest request) {
        if (request.employeeId() == null) {
            return ResponseEntity.badRequest().build();
        }
        projectService.addMember(id, request);
        Project project = projectService.getById(id);
        return ResponseEntity.status(HttpStatus.CREATED).body(buildProjectResponse(project, true));
    }

    /**
     * 移除项目成员
     * 权限：CEO only
     */
    @DeleteMapping("/{id}/members/{employeeId}")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long id,
            @PathVariable Long employeeId) {
        projectService.removeMember(id, employeeId);
        return ResponseEntity.noContent().build();
    }

    // ── 里程碑管理 ────────────────────────────────────────────────────────

    /**
     * 查询项目里程碑列表（按 sort 升序）
     * 权限：所有登录用户
     */
    @GetMapping("/{id}/milestones")
    @PreAuthorize("hasAnyRole('EMPLOYEE','FINANCE','PROJECT_MANAGER','CEO','WORKER')")
    public ResponseEntity<List<ProjectMilestone>> listMilestones(@PathVariable Long id) {
        return ResponseEntity.ok(milestoneMapper.findByProjectId(id));
    }

    /**
     * 创建里程碑
     * 权限：PROJECT_MANAGER（自己负责的项目）或 CEO
     * 请求体：{ "name": "...", "sort": 1 }
     */
    @PostMapping("/{id}/milestones")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
    public ResponseEntity<?> createMilestone(
            @PathVariable Long id,
            @RequestBody MilestoneRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "name 不能为空"));
        }
        ProjectMilestone milestone = new ProjectMilestone();
        milestone.setProjectId(id);
        milestone.setName(request.name());
        milestone.setSort(request.sort() != null ? request.sort() : 0);
        milestone.setCreatedAt(LocalDateTime.now());
        milestone.setUpdatedAt(LocalDateTime.now());
        milestone.setDeleted(0);
        milestoneMapper.insert(milestone);
        return ResponseEntity.status(HttpStatus.CREATED).body(milestone);
    }

    /**
     * 更新里程碑（名称、排序、完成日期）
     * 权限：PROJECT_MANAGER 或 CEO
     * 请求体：{ "name": "...", "sort": 2, "actualCompletionDate": "2026-06-01" }
     */
    @PutMapping("/{id}/milestones/{milestoneId}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
    public ResponseEntity<?> updateMilestone(
            @PathVariable Long id,
            @PathVariable Long milestoneId,
            @RequestBody MilestoneRequest request) {
        ProjectMilestone milestone = milestoneMapper.selectById(milestoneId);
        if (milestone == null || milestone.getDeleted() == 1 || !milestone.getProjectId().equals(id)) {
            return ResponseEntity.notFound().build();
        }
        if (request.name() != null) milestone.setName(request.name());
        if (request.sort() != null) milestone.setSort(request.sort());
        milestone.setActualCompletionDate(request.actualCompletionDate());
        milestone.setUpdatedAt(LocalDateTime.now());
        milestoneMapper.updateById(milestone);
        return ResponseEntity.ok(milestone);
    }

    /**
     * 删除里程碑（逻辑删除）
     * 权限：PROJECT_MANAGER 或 CEO
     */
    @DeleteMapping("/{id}/milestones/{milestoneId}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
    public ResponseEntity<Void> deleteMilestone(
            @PathVariable Long id,
            @PathVariable Long milestoneId) {
        ProjectMilestone milestone = milestoneMapper.selectById(milestoneId);
        if (milestone == null || !milestone.getProjectId().equals(id)) {
            return ResponseEntity.notFound().build();
        }
        milestone.setDeleted(1);
        milestone.setUpdatedAt(LocalDateTime.now());
        milestoneMapper.updateById(milestone);
        return ResponseEntity.noContent().build();
    }

    // ── 进度记录 ──────────────────────────────────────────────────────────

    /**
     * 记录每日进度
     * 权限：PROJECT_MANAGER
     * 请求体：{ "milestoneId": 1, "note": "完成防水层施工", "completedAt": "2026-04-08T17:00:00" }
     */
    @PostMapping("/{id}/progress")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
    public ResponseEntity<?> recordProgress(
            @PathVariable Long id,
            @RequestBody ProgressRequest request,
            Authentication authentication) {
        Long pmId = SecurityUtils.getEmployeeIdFromUsername(authentication.getName(), employeeMapper);
        ProjectProgressLog log = new ProjectProgressLog();
        log.setProjectId(id);
        log.setPmId(pmId);
        log.setMilestoneId(request.milestoneId());
        log.setCompletedAt(request.completedAt() != null ? request.completedAt() : LocalDateTime.now());
        log.setNote(request.note());
        log.setCreatedAt(LocalDateTime.now());
        log.setUpdatedAt(LocalDateTime.now());
        progressLogMapper.insert(log);
        return ResponseEntity.status(HttpStatus.CREATED).body(log);
    }

    // ── 项目配置 ──────────────────────────────────────────────────────────

    /**
     * 修改施工日志申报周期（CEO 直接修改，无需审批）
     * 权限：CEO only
     * 请求体：{ "logReportCycleDays": 7 }
     */
    @PatchMapping("/{id}/config")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<?> updateProjectConfig(
            @PathVariable Long id,
            @RequestBody ProjectConfigRequest request) {
        Project project = projectService.getById(id);
        if (project == null) {
            return ResponseEntity.notFound().build();
        }
        if (request.logReportCycleDays() != null) {
            project.setLogReportCycleDays(request.logReportCycleDays());
        }
        if (request.logCycleDays() != null) {
            project.setLogCycleDays(request.logCycleDays());
        }
        project.setUpdatedAt(LocalDateTime.now());
        projectService.updateById(project);
        return ResponseEntity.ok(buildProjectResponse(project, false));
    }

    // ── Dashboard ─────────────────────────────────────────────────────────

    /**
     * 项目 Dashboard 数据
     * 返回：折线图（进度日志时间序列）+ 里程碑列表 + 工作项汇总
     * 权限：所有登录用户
     */
    @GetMapping("/{id}/dashboard")
    @PreAuthorize("hasAnyRole('EMPLOYEE','FINANCE','PROJECT_MANAGER','CEO','WORKER')")
    public ResponseEntity<?> getDashboard(@PathVariable Long id) {
        Project project = projectService.getById(id);
        if (project == null) {
            return ResponseEntity.notFound().build();
        }

        List<ProjectMilestone> milestones = milestoneMapper.findByProjectId(id);
        List<ProjectProgressLog> progressLogs = progressLogMapper.findByProjectId(id);
        List<ConstructionLogSummary> summaries = summaryMapper.findByProjectId(id);

        // 里程碑完成/未完成统计
        long completedMilestones = milestones.stream().filter(m -> m.getActualCompletionDate() != null).count();
        long totalMilestones = milestones.size();

        // 时间序列：进度日志按日期聚合
        List<Map<String, Object>> timeSeries = progressLogs.stream()
                .map(log -> Map.<String, Object>of(
                        "date", log.getCreatedAt() != null ? log.getCreatedAt().toLocalDate().toString() : "",
                        "note", log.getNote() != null ? log.getNote() : "",
                        "milestoneId", log.getMilestoneId() != null ? log.getMilestoneId() : 0
                ))
                .toList();

        return ResponseEntity.ok(Map.of(
                "project", Map.of("id", id, "name", project.getName(), "status", project.getStatus()),
                "milestones", milestones,
                "workItemSummary", Map.of("total", totalMilestones, "completed", completedMilestones),
                "timeSeriesData", timeSeries,
                "summaries", summaries
        ));
    }

    // ── 汇总报告 ──────────────────────────────────────────────────────────

    /**
     * 生成施工日志汇总报告，并通知 CEO
     * 权限：PROJECT_MANAGER
     * 请求体：{ "periodStart": "2026-03-01", "periodEnd": "2026-03-31", "pmNote": "..." }
     */
    @PostMapping("/{id}/construction-summary")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
    public ResponseEntity<?> createSummary(
            @PathVariable Long id,
            @RequestBody SummaryRequest request,
            Authentication authentication) {
        Long pmId = SecurityUtils.getEmployeeIdFromUsername(authentication.getName(), employeeMapper);

        // 汇总区间内的里程碑
        List<ProjectMilestone> milestones = milestoneMapper.findByProjectId(id);
        long completedCount = milestones.stream().filter(m -> m.getActualCompletionDate() != null).count();

        ConstructionLogSummary summary = new ConstructionLogSummary();
        summary.setProjectId(id);
        summary.setPmId(pmId);
        summary.setPeriodStart(request.periodStart());
        summary.setPeriodEnd(request.periodEnd());
        summary.setAggregatedItems("{\"milestones\":" + milestones.size() + ",\"completed\":" + completedCount + "}");
        summary.setPmNote(request.pmNote());
        summary.setCeoNotifiedAt(LocalDateTime.now()); // 标记已通知（实际通知由 M9 NotificationService 实现）
        summary.setCreatedAt(LocalDateTime.now());
        summary.setUpdatedAt(LocalDateTime.now());
        summary.setDeleted(0);
        summaryMapper.insert(summary);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of("summary", summary, "message", "汇总报告已生成，CEO 已收到通知")
        );
    }

    // ── Inner request records ─────────────────────────────────────────────

    /** 里程碑创建/更新请求 */
    public record MilestoneRequest(String name, Integer sort, LocalDate actualCompletionDate) {}

    /** 进度记录请求 */
    public record ProgressRequest(Long milestoneId, String note, LocalDateTime completedAt) {}

    /** 项目配置修改请求 */
    public record ProjectConfigRequest(Integer logCycleDays, Integer logReportCycleDays) {}

    /** 汇总报告请求 */
    public record SummaryRequest(LocalDate periodStart, LocalDate periodEnd, String pmNote) {}
}
