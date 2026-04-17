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
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.RoleMapper;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 员工管理控制器
 */
@Slf4j
@RestController
@RequestMapping("/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;
    private final DepartmentMapper departmentMapper;
    private final RoleMapper roleMapper;
    private final com.oa.backend.mapper.EmergencyContactMapper emergencyContactMapper;
    private final EmployeeMapper employeeMapper;

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
            @RequestParam(required = false) Long departmentId,
            Authentication authentication) {

        IPage<Employee> employeePage = employeeService.listEmployees(
            page, size, keyword, roleCode, employeeType, accountStatus, departmentId);

        // 转换为响应DTO（根据调用者身份脱敏）
        // Resolve currentEmployeeId once to avoid N+1 DB queries inside toResponse per element.
        Long currentEmployeeId = SecurityUtils.getEmployeeIdFromUsername(authentication.getName(), employeeMapper);
        Map<String, Object> result = new HashMap<>();
        result.put("content", employeePage.getRecords().stream()
                .map(e -> toResponse(e, currentEmployeeId, authentication)).toList());
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
    public ResponseEntity<EmployeeResponse> getEmployee(@PathVariable Long id, Authentication authentication) {
        return employeeService.findById(id)
            .map(emp -> ResponseEntity.ok(toResponse(emp, authentication)))
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 创建员工
     * 权限：CEO only
     */
    @PostMapping
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<EmployeeResponse> createEmployee(@Valid @RequestBody EmployeeCreateRequest request,
                                                           Authentication authentication) {
        Employee employee = employeeService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(employee, authentication));
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
            @RequestBody EmployeeUpdateRequest request,
            Authentication authentication) {
        Employee employee = employeeService.updateEmployee(id, request);
        return ResponseEntity.ok(toResponse(employee, authentication));
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
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        String status = request.get("accountStatus");
        if (!"ACTIVE".equals(status) && !"DISABLED".equals(status)) {
            throw new IllegalArgumentException("账号状态必须是 ACTIVE 或 DISABLED");
        }
        Employee employee = employeeService.updateAccountStatus(id, status);
        return ResponseEntity.ok(toResponse(employee, authentication));
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
            @RequestBody SalaryOverrideRequest request,
            Authentication authentication) {
        Employee employee = employeeService.applySalaryOverride(id, request);
        return ResponseEntity.ok(toResponse(employee, authentication));
    }

    /**
     * 将 Employee 实体转换为 EmployeeResponse DTO（按调用者身份脱敏）。
     * 单记录端点入口（getEmployee、createEmployee 等）；每次调用会解析一次 currentEmployeeId，
     * 不在列表场景下使用，因此单次 DB 查询可接受。
     *
     * 脱敏规则：
     *  - idCardNo：仅本人、CEO、HR 可见；其他角色返回 null
     *  - isDefaultPassword：仅本人可见；查看他人时返回 null，避免向攻击者暴露弱默认密码状态
     *
     * 保留字段结构（record 不变），仅将敏感字段置 null 以维持向后兼容。
     */
    private EmployeeResponse toResponse(Employee employee, Authentication authentication) {
        Long currentEmployeeId = authentication != null
                ? SecurityUtils.getEmployeeIdFromUsername(authentication.getName(), employeeMapper)
                : null;
        return toResponse(employee, currentEmployeeId, authentication);
    }

    /**
     * 列表端点专用重载，接受预计算的 currentEmployeeId 以消除 N+1 查询。
     * 由 listEmployees 在流处理前一次性解析 currentEmployeeId，然后传入此方法。
     */
    private EmployeeResponse toResponse(Employee employee, Long currentEmployeeId, Authentication authentication) {
        boolean isSelf = false;
        boolean canSeeIdCard = false;
        if (authentication != null) {
            if (currentEmployeeId != null && currentEmployeeId.equals(employee.getId())) {
                isSelf = true;
            }
            for (GrantedAuthority ga : authentication.getAuthorities()) {
                String a = ga.getAuthority();
                if ("ROLE_CEO".equals(a) || "ROLE_HR".equals(a)) {
                    canSeeIdCard = true;
                    break;
                }
            }
        }
        final boolean selfFinal = isSelf;
        final boolean idCardVisible = isSelf || canSeeIdCard;
        // 查询角色名称（响应辅助字段，失败不阻塞主流程）
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
            // 保留原因：响应辅助字段查询失败兜底为 roleCode
            log.warn("EmployeeDetail: failed to load role name for employeeId={}", employee.getId(), e);
        }

        // 查询部门名称（同上，失败不阻塞主流程）
        String departmentName = "";
        if (employee.getDepartmentId() != null) {
            try {
                Department dept = departmentMapper.selectById(employee.getDepartmentId());
                if (dept != null && dept.getName() != null) {
                    departmentName = dept.getName();
                }
            } catch (Exception e) {
                // 保留原因：响应辅助字段查询失败兜底为空
                log.warn("EmployeeDetail: failed to load department name for employeeId={}, departmentId={}",
                        employee.getId(), employee.getDepartmentId(), e);
            }
        }

        // 紧急联系人列表（失败兜底为空列表）
        java.util.List<EmployeeResponse.EmergencyContact> contacts = new java.util.ArrayList<>();
        try {
            java.util.List<com.oa.backend.entity.EmergencyContact> rows = emergencyContactMapper.selectList(
                    new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.oa.backend.entity.EmergencyContact>()
                            .eq(com.oa.backend.entity.EmergencyContact::getEmployeeId, employee.getId())
                            .eq(com.oa.backend.entity.EmergencyContact::getDeleted, 0));
            for (com.oa.backend.entity.EmergencyContact ec : rows) {
                contacts.add(new EmployeeResponse.EmergencyContact(
                        ec.getId(), ec.getName(), ec.getPhone(), ec.getAddress()));
            }
        } catch (Exception e) {
            // 保留原因：紧急联系人查询失败兜底为空，不阻塞员工详情主流程
            log.warn("EmployeeDetail: failed to load emergency contacts for employeeId={}", employee.getId(), e);
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
            selfFinal ? employee.getIsDefaultPassword() : null,
            employee.getBaseSalaryOverride(),
            employee.getPerformanceBaseOverride(),
            employee.getSalaryOverrideNote(),
            employee.getSocialSeniority(),
            employee.getContractType(),
            employee.getDailySubsidy(),
            employee.getExpenseLimit(),
            employee.getPerformanceRatio(),
            contacts,
            employee.getCreatedAt(),
            employee.getUpdatedAt(),
            employee.getGender(),
            idCardVisible ? employee.getIdCardNo() : null,
            employee.getBirthDate()
        );
    }
}
