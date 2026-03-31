package com.oa.backend.controller;

import com.oa.backend.dto.ProjectResponse;
import com.oa.backend.service.OaDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 项目管理控制器
 */
@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final OaDataService oaDataService;

    /**
     * 获取项目列表
     * 权限：员工、财务、项目经理、CEO、劳工
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE','FINANCE','PROJECT_MANAGER','CEO','WORKER')")
    public ResponseEntity<List<ProjectResponse>> listProjects() {
        return ResponseEntity.ok(oaDataService.listProjects());
    }
}
