package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.oa.backend.dto.ProjectCreateRequest;
import com.oa.backend.dto.ProjectResponse;
import com.oa.backend.dto.ProjectStatusRequest;
import com.oa.backend.dto.ProjectUpdateRequest;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.Project;
import com.oa.backend.entity.ProjectMember;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.security.JwtTokenService;
import com.oa.backend.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 项目基础 CRUD 控制器。
 * 负责：创建、查询、更新、删除、状态变更、配置修改。
 * 成员管理见 ProjectMemberController，里程碑/进度见 ProjectMilestoneController。
 */
@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final JwtTokenService jwtTokenService;
    private final EmployeeMapper employeeMapper;

    /**
     * 从 Authorization 头解析当前用户 ID。
     * 用于 PROJECT_MANAGER 列表过滤。
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
     * 从 Authorization 头解析当前用户角色。
     * 用于 PROJECT_MANAGER 列表过滤。
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
     * 构建 ProjectResponse，从 ProjectService 获取成员列表后组装。
     *
     * @param includeMembers 为 false 时 memberInfos 字段为 null（列表页减少查询量）
     */
    ProjectResponse buildProjectResponse(Project project, boolean includeMembers) {
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
            project.getContractNo(),
            project.getContractAttachmentId(),
            project.getClientName(),
            project.getProjectDescription(),
            project.getCreatedAt(),
            project.getUpdatedAt(),
            members.size(),
            includeMembers ? memberInfos : null
        );
    }

    /**
     * 获取项目列表（分页）。
     * PROJECT_MANAGER 自动只看自己作为 PM 的项目。
     * 权限：员工、财务、项目经理、CEO、劳工
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

        Long pmFilter = null;
        if ("project_manager".equals(role) && currentUserId != null) {
            pmFilter = currentUserId;
        }

        IPage<Project> projectPage = projectService.listProjects(page, size, status, pmFilter);
        IPage<ProjectResponse> responsePage = projectPage.convert(p -> buildProjectResponse(p, false));
        return ResponseEntity.ok(responsePage);
    }

    /**
     * 获取项目详情（含成员列表）。
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
     * 创建项目。
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
     * 更新项目基本信息。
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
     * 更新项目状态（关闭或重开）。
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
     * 删除项目。
     * 权限：CEO only
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 修改项目配置（施工日志周期、合同号、客户名、描述）。
     * CEO 直接修改，无需审批。
     * 权限：CEO only
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
        if (request.contractNo() != null) project.setContractNo(request.contractNo());
        if (request.clientName() != null) project.setClientName(request.clientName());
        if (request.projectDescription() != null) project.setProjectDescription(request.projectDescription());
        project.setUpdatedAt(LocalDateTime.now());
        projectService.updateById(project);
        return ResponseEntity.ok(buildProjectResponse(project, false));
    }

    // ── Inner request records ─────────────────────────────────────────────

    /** 项目配置修改请求（施工日志周期 + 合同/客户信息） */
    public record ProjectConfigRequest(Integer logCycleDays, Integer logReportCycleDays,
                                       String contractNo, String clientName, String projectDescription) {}
}
