package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.oa.backend.dto.DepartmentResponse;
import com.oa.backend.entity.Department;
import com.oa.backend.mapper.DepartmentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 部门管理控制器
 */
@RestController
@RequestMapping("/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentMapper departmentMapper;

    /**
     * 获取全部未删除的部门列表
     * 权限：CEO、财务、项目经理
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('CEO','FINANCE','PROJECT_MANAGER')")
    public ResponseEntity<List<DepartmentResponse>> listDepartments() {
        QueryWrapper<Department> wrapper = new QueryWrapper<>();
        wrapper.eq("deleted", 0);
        wrapper.orderByAsc("sort", "id");

        List<Department> departments = departmentMapper.selectList(wrapper);
        
        List<DepartmentResponse> response = departments.stream()
            .map(dept -> new DepartmentResponse(
                dept.getId(),
                dept.getName(),
                dept.getParentId(),
                dept.getSort()
            ))
            .toList();

        return ResponseEntity.ok(response);
    }
}
