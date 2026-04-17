package com.oa.backend.controller;

import com.oa.backend.dto.DepartmentRequest;
import com.oa.backend.dto.DepartmentResponse;
import com.oa.backend.entity.Department;
import com.oa.backend.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 部门管理控制器
 */
@RestController
@RequestMapping("/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    /**
     * 获取所有部门（树形结构）
     * 权限：所有已认证用户
     */
    @GetMapping
    public ResponseEntity<List<DepartmentResponse>> listDepartments() {
        // 1. 查所有未删除部门
        List<Department> departments = departmentService.listAllActiveDepartments();

        // 2. 统计每个部门的员工数
        Map<Long, Integer> employeeCountMap = departmentService.countEmployeesByDepartment();

        // 3. 构建树形结构
        List<DepartmentResponse> tree = buildDepartmentTree(departments, employeeCountMap);

        return ResponseEntity.ok(tree);
    }

    /**
     * 构建部门树形结构
     */
    private List<DepartmentResponse> buildDepartmentTree(
            List<Department> departments, 
            Map<Long, Integer> employeeCountMap) {
        
        // 转换为DTO
        List<DepartmentResponse> allNodes = departments.stream()
            .map(dept -> new DepartmentResponse(
                dept.getId(),
                dept.getName(),
                dept.getParentId(),
                dept.getSort(),
                employeeCountMap.getOrDefault(dept.getId(), 0),
                new ArrayList<>()
            ))
            .toList();

        // 按parentId分组
        Map<Long, List<DepartmentResponse>> parentMap = allNodes.stream()
            .collect(Collectors.groupingBy(
                d -> d.parentId() != null ? d.parentId() : -1L
            ));

        // 递归构建树
        return buildTreeRecursive(-1L, parentMap);
    }

    /**
     * 递归构建树
     */
    private List<DepartmentResponse> buildTreeRecursive(
            Long parentId, 
            Map<Long, List<DepartmentResponse>> parentMap) {
        
        List<DepartmentResponse> children = parentMap.get(parentId);
        if (children == null) {
            return new ArrayList<>();
        }

        return children.stream()
            .map(child -> new DepartmentResponse(
                child.id(),
                child.name(),
                child.parentId(),
                child.sort(),
                child.employeeCount(),
                buildTreeRecursive(child.id(), parentMap)
            ))
            .sorted(Comparator.comparing(DepartmentResponse::sort)
                .thenComparing(DepartmentResponse::id))
            .collect(Collectors.toList());
    }

    /**
     * 创建部门
     * 权限：CEO only
     */
    @PostMapping
    @PreAuthorize("hasRole('CEO')")
    @com.oa.backend.annotation.OperationLogRecord(action = "DEPT_CREATE", targetType = "DEPARTMENT")
    public ResponseEntity<DepartmentResponse> createDepartment(@RequestBody DepartmentRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Department department = new Department();
        department.setName(request.name());
        department.setParentId(request.parentId());
        department.setSort(request.sort() != null ? request.sort() : 0);

        LocalDateTime now = LocalDateTime.now();
        department.setCreatedAt(now);
        department.setUpdatedAt(now);
        department.setDeleted(0);

        departmentService.createDepartment(department);

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(new DepartmentResponse(
                department.getId(),
                department.getName(),
                department.getParentId(),
                department.getSort(),
                0,
                new ArrayList<>()
            ));
    }

    /**
     * 更新部门
     * 权限：CEO only
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CEO')")
    @com.oa.backend.annotation.OperationLogRecord(action = "DEPT_UPDATE", targetType = "DEPARTMENT")
    public ResponseEntity<DepartmentResponse> updateDepartment(
            @PathVariable Long id,
            @RequestBody DepartmentRequest request) {

        Department department = departmentService.findActiveById(id);
        if (department == null) {
            return ResponseEntity.notFound().build();
        }

        if (request.name() != null) {
            department.setName(request.name());
        }
        if (request.parentId() != null) {
            department.setParentId(request.parentId());
        }
        if (request.sort() != null) {
            department.setSort(request.sort());
        }

        departmentService.updateDepartment(department);

        // 重新统计员工数
        Map<Long, Integer> employeeCountMap = departmentService.countEmployeesByDepartment();

        return ResponseEntity.ok(new DepartmentResponse(
            department.getId(),
            department.getName(),
            department.getParentId(),
            department.getSort(),
            employeeCountMap.getOrDefault(department.getId(), 0),
            new ArrayList<>()
        ));
    }

    /**
     * 删除部门
     * 权限：CEO only
     * 逻辑：检查是否有直属员工或子部门
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CEO')")
    @com.oa.backend.annotation.OperationLogRecord(action = "DEPT_DELETE", targetType = "DEPARTMENT")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Long id) {
        Department department = departmentService.findActiveById(id);
        if (department == null) {
            return ResponseEntity.notFound().build();
        }

        // 检查是否有直属员工
        if (departmentService.hasActiveEmployees(id)) {
            throw new IllegalArgumentException("该部门有员工，无法删除");
        }

        // 检查是否有子部门
        if (departmentService.hasActiveChildDepartments(id)) {
            throw new IllegalArgumentException("该部门有子部门，无法删除");
        }

        // 软删除
        departmentService.softDeleteDepartment(department);

        return ResponseEntity.noContent().build();
    }
}
