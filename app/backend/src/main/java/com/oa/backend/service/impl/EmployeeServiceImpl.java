package com.oa.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.oa.backend.dto.EmployeeCreateRequest;
import com.oa.backend.dto.EmployeeUpdateRequest;
import com.oa.backend.entity.Employee;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

/**
 * 员工服务实现类
 */
@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeMapper employeeMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Optional<Employee> authenticate(String employeeNo, String rawPassword) {
        QueryWrapper<Employee> wrapper = new QueryWrapper<>();
        wrapper.eq("employee_no", employeeNo);
        wrapper.eq("account_status", "ACTIVE");
        wrapper.eq("deleted", 0);

        Employee employee = employeeMapper.selectOne(wrapper);
        if (employee == null) {
            return Optional.empty();
        }

        if (!passwordEncoder.matches(rawPassword, employee.getPasswordHash())) {
            return Optional.empty();
        }

        return Optional.of(employee);
    }

    @Override
    public IPage<Employee> listEmployees(int page, int size, String keyword, String roleCode,
                                          String employeeType, String accountStatus, Long departmentId) {
        Page<Employee> pageParam = new Page<>(page, size);
        QueryWrapper<Employee> wrapper = new QueryWrapper<>();
        wrapper.eq("deleted", 0);

        // 关键字搜索（姓名或工号）
        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w.like("name", keyword).or().like("employee_no", keyword));
        }

        // 角色筛选
        if (roleCode != null && !roleCode.isBlank()) {
            wrapper.eq("role_code", roleCode);
        }

        // 员工类型筛选
        if (employeeType != null && !employeeType.isBlank()) {
            wrapper.eq("employee_type", employeeType);
        }

        // 账号状态筛选
        if (accountStatus != null && !accountStatus.isBlank()) {
            wrapper.eq("account_status", accountStatus);
        }

        // 部门筛选
        if (departmentId != null) {
            wrapper.eq("department_id", departmentId);
        }

        // 按创建时间降序
        wrapper.orderByDesc("created_at");

        return employeeMapper.selectPage(pageParam, wrapper);
    }

    @Override
    public Optional<Employee> findById(Long id) {
        QueryWrapper<Employee> wrapper = new QueryWrapper<>();
        wrapper.eq("id", id);
        wrapper.eq("deleted", 0);
        return Optional.ofNullable(employeeMapper.selectOne(wrapper));
    }

    @Override
    @Transactional
    public Employee createEmployee(EmployeeCreateRequest request) {
        Employee employee = new Employee();
        employee.setEmployeeNo(generateEmployeeNo());
        // 初始密码 123456，bcrypt 加密
        employee.setPasswordHash(passwordEncoder.encode("123456"));
        employee.setIsDefaultPassword(true);

        // 设置基本信息
        employee.setName(request.name());
        employee.setPhone(request.phone());
        employee.setEmail(request.email());
        employee.setRoleCode(request.roleCode());
        employee.setEmployeeType(request.employeeType() != null ? request.employeeType() : "OFFICE");
        employee.setDepartmentId(request.departmentId());
        employee.setPositionId(request.positionId());
        employee.setLevelId(request.levelId());
        employee.setDirectSupervisorId(request.directSupervisorId());
        employee.setAccountStatus("ACTIVE");
        employee.setEntryDate(request.entryDate() != null ? request.entryDate() : LocalDate.now());

        LocalDateTime now = LocalDateTime.now();
        employee.setCreatedAt(now);
        employee.setUpdatedAt(now);
        employee.setDeleted(0);

        employeeMapper.insert(employee);
        return employee;
    }

    @Override
    @Transactional
    public Employee updateEmployee(Long id, EmployeeUpdateRequest request) {
        Employee employee = findById(id).orElseThrow(() -> new IllegalArgumentException("员工不存在"));

        // 更新字段
        if (request.name() != null) {
            employee.setName(request.name());
        }
        if (request.phone() != null) {
            employee.setPhone(request.phone());
        }
        if (request.email() != null) {
            employee.setEmail(request.email());
        }
        if (request.roleCode() != null) {
            employee.setRoleCode(request.roleCode());
        }
        if (request.employeeType() != null) {
            employee.setEmployeeType(request.employeeType());
        }
        if (request.departmentId() != null) {
            employee.setDepartmentId(request.departmentId());
        }
        if (request.positionId() != null) {
            employee.setPositionId(request.positionId());
        }
        if (request.levelId() != null) {
            employee.setLevelId(request.levelId());
        }
        if (request.directSupervisorId() != null) {
            employee.setDirectSupervisorId(request.directSupervisorId());
        }
        if (request.accountStatus() != null) {
            employee.setAccountStatus(request.accountStatus());
        }
        if (request.leaveDate() != null) {
            employee.setLeaveDate(request.leaveDate());
        }

        employee.setUpdatedAt(LocalDateTime.now());
        employeeMapper.updateById(employee);
        return employee;
    }

    @Override
    @Transactional
    public void deleteEmployee(Long id) {
        Employee employee = findById(id).orElseThrow(() -> new IllegalArgumentException("员工不存在"));
        employee.setDeleted(1);
        employee.setUpdatedAt(LocalDateTime.now());
        employeeMapper.updateById(employee);
    }

    @Override
    public String generateEmployeeNo() {
        String prefix = "EMP" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        
        // 查询当月最大序号
        QueryWrapper<Employee> wrapper = new QueryWrapper<>();
        wrapper.like("employee_no", prefix);
        wrapper.orderByDesc("employee_no");
        wrapper.last("LIMIT 1");
        
        Employee lastEmployee = employeeMapper.selectOne(wrapper);
        int seq = 1;
        if (lastEmployee != null) {
            String lastNo = lastEmployee.getEmployeeNo();
            try {
                seq = Integer.parseInt(lastNo.substring(prefix.length())) + 1;
            } catch (NumberFormatException e) {
                seq = 1;
            }
        }
        
        return prefix + String.format("%04d", seq);
    }

    @Override
    @Transactional
    public Employee updateAccountStatus(Long id, String status) {
        Employee employee = findById(id).orElseThrow(() -> new IllegalArgumentException("员工不存在"));
        employee.setAccountStatus(status);
        employee.setUpdatedAt(LocalDateTime.now());
        employeeMapper.updateById(employee);
        return employee;
    }

    @Override
    @Transactional
    public void resetPassword(Long id) {
        Employee employee = findById(id).orElseThrow(() -> new IllegalArgumentException("员工不存在"));
        employee.setPasswordHash(passwordEncoder.encode("123456"));
        employee.setIsDefaultPassword(true);
        employee.setUpdatedAt(LocalDateTime.now());
        employeeMapper.updateById(employee);
    }

    @Override
    public Optional<Employee> findByPhone(String phone) {
        QueryWrapper<Employee> wrapper = new QueryWrapper<>();
        wrapper.eq("phone", phone);
        wrapper.eq("deleted", 0);
        return Optional.ofNullable(employeeMapper.selectOne(wrapper));
    }

    @Override
    @Transactional
    public void updatePassword(Long id, String newPasswordHash, boolean isDefaultPassword) {
        Employee employee = employeeMapper.selectById(id);
        if (employee == null) {
            throw new IllegalArgumentException("员工不存在");
        }
        employee.setPasswordHash(newPasswordHash);
        employee.setIsDefaultPassword(isDefaultPassword);
        employee.setUpdatedAt(LocalDateTime.now());
        employeeMapper.updateById(employee);
    }
}
