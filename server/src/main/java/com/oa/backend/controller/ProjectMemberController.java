package com.oa.backend.controller;

import com.oa.backend.dto.ProjectMemberRequest;
import com.oa.backend.dto.ProjectResponse;
import com.oa.backend.entity.Project;
import com.oa.backend.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 项目成员管理控制器。
 * 负责：添加成员、移除成员。
 * 项目基础 CRUD 见 ProjectController。
 *
 * 路径前缀 /projects/{id}/members，复用 ProjectController.buildProjectResponse 组装响应。
 */
@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
public class ProjectMemberController {

    private final ProjectService projectService;
    private final ProjectController projectController;

    /**
     * 添加项目成员。
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
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectController.buildProjectResponse(project, true));
    }

    /**
     * 移除项目成员。
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
