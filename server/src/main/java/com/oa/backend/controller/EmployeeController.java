package com.oa.backend.controller;

import com.oa.backend.annotation.OperationLogRecord;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.oa.backend.dto.EmployeeCreateRequest;
import com.oa.backend.dto.EmployeeResponse;
import com.oa.backend.dto.EmployeeUpdateRequest;
import com.oa.backend.dto.SalaryOverrideRequest;
import java.math.BigDecimal;
import com.oa.backend.entity.Department;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.Role;
import com.oa.backend.mapper.DepartmentMapper;
import com.oa.backend.mapper.RoleMapper;
import com.oa.backend.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 员工管理控制器
 */
@RestController
@RequestMapping("/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;
    private final DepartmentMapper departmentMapper;
    private final RoleMapper roleMapper;

    /**
     * 获取员工列表（分页）
     * 权限：CEO、财务、项目经理
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('CEO','FINANCE','PROJECT_MANAGER')")
    public ResponseEntity<Map<String, Object>> listEmployees(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String roleCode,
            @RequestParam(required = false) String employeeType,
            @RequestParam(required = false) String accountStatus,
            @RequestParam(required = false) Long departmentId) {

        IPage<Employee> employeePage = employeeService.listEmployees(
            page, size, keyword, roleCode, employeeType, accountStatus, departmentId);

        // 转换为响应DTO
        Map<String, Object> result = new HashMap<>();
        result.put("content", employeePage.getRecords().stream().map(this::toResponse).toList());
        result.put("totalElements", employeePage.getTotal());
        result.put("totalPages", employeePage.getPages());
        result.put("number", employeePage.getCurrent());
        result.put("size", employeePage.getSize());

        return ResponseEntity.ok(result);
    }

    /**
     * 获取员工详情
     * 权限：CEO、财务、项目经理
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CEO','FINANCE','PROJECT_MANAGER')")
    public ResponseEntity<EmployeeResponse> getEmployee(@PathVariable Long id) {
        return employeeService.findById(id)
            .map(emp -> ResponseEntity.ok(toResponse(emp)))
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 创建员工
     * 权限：CEO only
     */
    @PostMapping
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<EmployeeResponse> createEmployee(@Valid @RequestBody EmployeeCreateRequest request) {
        Employee employee = employeeService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(employee));
    }

    /**
     * 更新员工
     * 权限：CEO only
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CEO')")
    @OperationLogRecord(action = "UPDATE_EMPLOYEE", targetType = "EMPLOYEE")
    public ResponseEntity<EmployeeResponse> updateEmployee(
            @PathVariable Long id,
            @RequestBody EmployeeUpdateRequest request) {
        Employee employee = employeeService.updateEmployee(id, request);
        return ResponseEntity.ok(toResponse(employee));
    }

    /**
     * 删除员工（软删除）
     * 权限：CEO only
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 职责：更新员工账号状态（禁用/启用）
     * 请求含义：修改指定员工的账号状态为 ACTIVE 或 DISABLED
     * 响应含义：返回更新后的员工信息
     * 权限期望：仅 CEO 可操作
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<EmployeeResponse> updateAccountStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String status = request.get("accountStatus");
        if (!"ACTIVE".equals(status) && !"DISABLED".equals(status)) {
            throw new IllegalArgumentException("账号状态必须是 ACTIVE 或 DISABLED");
        }
        Employee employee = employeeService.updateAccountStatus(id, status);
        return ResponseEntity.ok(toResponse(employee));
    }

    /**
     * 职责：重置员工密码为初始密码
     * 请求含义：将指定员工的密码重置为默认初始密码 123456
     * 响应含义：无内容返回（204 No Content）
     * 权限期望：仅 CEO 可操作
     */
    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id) {
        employeeService.resetPassword(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 职责：更新员工薪资覆盖
     * 请求含义：修改指定员工的薪资覆盖字段
     * 响应含义：返回更新后的员工信息
     * 权限期望：财务或 CEO 可操作
     */
    @PatchMapping("/{id}/salary-override")
    @PreAuthorize("hasAnyRole('FINANCE','CEO')")
    public ResponseEntity<EmployeeResponse> updateSalaryOverride(
            @PathVariable Long id,
            @RequestBody SalaryOverrideRequest request) {
        Employee employee = employeeService.applySalaryOverride(id, request);
        return ResponseEntity.ok(toResponse(employee));
    }

    /**
     * 将 Employee 实体转换为 EmployeeResponse DTO
     */
    private EmployeeResponse toResponse(Employee employee) {
        // 查询角色名称
        String roleName = employee.getRoleCode();
        try {
            Role role = roleMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<Role>()
                    .eq("role_code", employee.getRoleCode())
            );
            if (role != null && role.getRoleName() != null) {
                roleName = role.getRoleName();
            }
        } catch (Exception e) {
            // 忽略查询失败
        }

        // 查询部门名称
        String departmentName = "";
        if (employee.getDepartmentId() != null) {
            try {
                Department dept = departmentMapper.selectById(employee.getDepartmentId());
                if (dept != null && dept.getName() != null) {
                    departmentName = dept.getName();
                }
            } catch (Exception e) {
                // 忽略查询失败
            }
        }

        return new EmployeeResponse(
            employee.getId(),
            employee.getEmployeeNo(),
            employee.getName(),
            employee.getPhone(),
            employee.getEmail(),
            employee.getRoleCode(),
            roleName,
            employee.getEmployeeType(),
            employee.getDepartmentId(),
            departmentName,
            employee.getPositionId(),
            employee.getLevelId(),
            employee.getDirectSupervisorId(),
            employee.getAccountStatus(),
            employee.getEntryDate(),
            employee.getLeaveDate(),
            employee.getIsDefaultPassword(),
            employee.getBaseSalaryOverride(),
            employee.getPerformanceBaseOverride(),
            employee.getSalaryOverrideNote(),
            employee.getCreatedAt(),
            employee.getUpdatedAt()
        );
    }
}
