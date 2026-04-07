package com.oa.backend.controller;

import com.auth0.jwt.interfaces.DecodedJWT;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.oa.backend.dto.*;
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

import java.util.List;

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
}
