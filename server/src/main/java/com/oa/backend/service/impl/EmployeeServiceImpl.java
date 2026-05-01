package com.oa.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.oa.backend.dto.EmployeeCreateRequest;
import com.oa.backend.dto.EmployeeResponse;
import com.oa.backend.dto.EmployeeUpdateRequest;
import com.oa.backend.entity.Department;
import com.oa.backend.entity.EmergencyContact;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.Role;
import com.oa.backend.mapper.DepartmentMapper;
import com.oa.backend.mapper.EmergencyContactMapper;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.RoleMapper;
import com.oa.backend.service.EmployeeService;
import com.oa.backend.service.EmployeeStatusCache;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 员工服务实现类 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

  private final EmployeeMapper employeeMapper;
  private final EmergencyContactMapper emergencyContactMapper;
  private final DepartmentMapper departmentMapper;
  private final RoleMapper roleMapper;
  private final PasswordEncoder passwordEncoder;
  private final EmployeeStatusCache employeeStatusCache;

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
  public IPage<Employee> listEmployees(
      int page,
      int size,
      String keyword,
      String roleCode,
      String accountStatus,
      Long departmentId) {
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
    employee.setDepartmentId(request.departmentId());
    employee.setPositionId(request.positionId());
    employee.setLevelId(request.levelId());
    employee.setDirectSupervisorId(request.directSupervisorId());
    employee.setAccountStatus("ACTIVE");
    employee.setEntryDate(request.entryDate() != null ? request.entryDate() : LocalDate.now());
    employee.setSocialSeniority(request.socialSeniority());
    employee.setContractType(request.contractType());
    employee.setDailySubsidy(request.dailySubsidy());
    employee.setExpenseLimit(request.expenseLimit());
    employee.setPerformanceRatio(request.performanceRatio());
    if (request.gender() != null) employee.setGender(request.gender());
    if (request.idCardNo() != null) employee.setIdCardNo(request.idCardNo());
    if (request.birthDate() != null) employee.setBirthDate(request.birthDate());

    LocalDateTime now = LocalDateTime.now();
    employee.setCreatedAt(now);
    employee.setUpdatedAt(now);
    employee.setDeleted(0);

    employeeMapper.insert(employee);
    if (request.emergencyContacts() != null) {
      java.util.List<EmployeeUpdateRequest.EmergencyContactRequest> mapped =
          request.emergencyContacts().stream()
              .map(
                  c ->
                      new EmployeeUpdateRequest.EmergencyContactRequest(
                          c.name(), c.phone(), c.address()))
              .toList();
      replaceEmergencyContacts(employee.getId(), mapped);
    }
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
    if (request.socialSeniority() != null) {
      employee.setSocialSeniority(request.socialSeniority());
    }
    if (request.contractType() != null) {
      employee.setContractType(request.contractType());
    }
    if (request.dailySubsidy() != null) {
      employee.setDailySubsidy(request.dailySubsidy());
    }
    if (request.expenseLimit() != null) {
      employee.setExpenseLimit(request.expenseLimit());
    }
    if (request.performanceRatio() != null) {
      employee.setPerformanceRatio(request.performanceRatio());
    }
    if (request.gender() != null) employee.setGender(request.gender());
    if (request.idCardNo() != null) employee.setIdCardNo(request.idCardNo());
    if (request.birthDate() != null) employee.setBirthDate(request.birthDate());

    employee.setUpdatedAt(LocalDateTime.now());
    employeeMapper.updateById(employee);

    // 紧急联系人采用整表替换：传 null 不动；传空列表清空；传非空列表替换
    if (request.emergencyContacts() != null) {
      replaceEmergencyContacts(id, request.emergencyContacts());
    }
    return employee;
  }

  /** 整表替换某员工的紧急联系人（软删旧 + 插新）。null 列表不动；空列表清空。 */
  private void replaceEmergencyContacts(
      Long employeeId, java.util.List<EmployeeUpdateRequest.EmergencyContactRequest> contacts) {
    if (contacts == null) return;
    java.util.List<EmergencyContact> existing =
        emergencyContactMapper.selectList(
            new LambdaQueryWrapper<EmergencyContact>()
                .eq(EmergencyContact::getEmployeeId, employeeId)
                .eq(EmergencyContact::getDeleted, 0));
    for (EmergencyContact ec : existing) {
      emergencyContactMapper.deleteById(ec.getId());
    }
    for (EmployeeUpdateRequest.EmergencyContactRequest c : contacts) {
      if (c == null
          || c.name() == null
          || c.name().isBlank()
          || c.phone() == null
          || c.phone().isBlank()) continue;
      EmergencyContact ec = new EmergencyContact();
      ec.setEmployeeId(employeeId);
      ec.setName(c.name());
      ec.setPhone(c.phone());
      ec.setAddress(c.address());
      ec.setCreatedAt(LocalDateTime.now());
      ec.setUpdatedAt(LocalDateTime.now());
      emergencyContactMapper.insert(ec);
    }
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
    employeeStatusCache.invalidate(id);
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
  public Optional<Employee> findByEmail(String email) {
    if (email == null || email.isBlank()) return Optional.empty();
    QueryWrapper<Employee> wrapper = new QueryWrapper<>();
    wrapper.eq("email", email);
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

  @Override
  @Transactional
  public void updatePhone(Long id, String newPhone) {
    Employee employee = findById(id).orElseThrow(() -> new IllegalArgumentException("员工不存在"));
    employee.setPhone(newPhone);
    employee.setUpdatedAt(LocalDateTime.now());
    employeeMapper.updateById(employee);
  }

  @Override
  public Long resolveEmployeeIdByUsername(String username) {
    Employee employee =
        employeeMapper.selectOne(
            new LambdaQueryWrapper<Employee>()
                .eq(Employee::getEmployeeNo, username)
                .eq(Employee::getDeleted, 0));
    return employee != null ? employee.getId() : null;
  }

  @Override
  public String findRoleNameByCode(String roleCode) {
    if (roleCode == null) return null;
    try {
      Role role =
          roleMapper.selectOne(new LambdaQueryWrapper<Role>().eq(Role::getRoleCode, roleCode));
      if (role != null && role.getRoleName() != null) {
        return role.getRoleName();
      }
    } catch (Exception e) {
      log.warn("EmployeeService: failed to load role name for roleCode={}", roleCode, e);
    }
    // 查询失败时兜底返回原 roleCode
    return roleCode;
  }

  @Override
  public String findDepartmentNameById(Long departmentId) {
    if (departmentId == null) return "";
    try {
      Department dept = departmentMapper.selectById(departmentId);
      if (dept != null && dept.getName() != null) {
        return dept.getName();
      }
    } catch (Exception e) {
      log.warn(
          "EmployeeService: failed to load department name for departmentId={}", departmentId, e);
    }
    // 查询失败时兜底返回空字符串
    return "";
  }

  @Override
  public List<EmployeeResponse.EmergencyContact> findEmergencyContacts(Long employeeId) {
    List<EmployeeResponse.EmergencyContact> result = new ArrayList<>();
    try {
      List<com.oa.backend.entity.EmergencyContact> rows =
          emergencyContactMapper.selectList(
              new LambdaQueryWrapper<com.oa.backend.entity.EmergencyContact>()
                  .eq(com.oa.backend.entity.EmergencyContact::getEmployeeId, employeeId)
                  .eq(com.oa.backend.entity.EmergencyContact::getDeleted, 0));
      for (com.oa.backend.entity.EmergencyContact ec : rows) {
        result.add(
            new EmployeeResponse.EmergencyContact(
                ec.getId(), ec.getName(), ec.getPhone(), ec.getAddress()));
      }
    } catch (Exception e) {
      log.warn(
          "EmployeeService: failed to load emergency contacts for employeeId={}", employeeId, e);
    }
    return result;
  }
}
