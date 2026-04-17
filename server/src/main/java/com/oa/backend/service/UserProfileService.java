package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.Department;
import com.oa.backend.entity.Employee;
import com.oa.backend.mapper.DepartmentMapper;
import com.oa.backend.mapper.EmployeeMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

/**
 * 用户档案查询服务（可缓存层）。
 *
 * 职责：封装 employee + department 的联合查询，并通过 @Cacheable 在 Spring AOP 代理上缓存结果。
 * 数据来源：employee 表（按 employee_no 查询）、department 表（按 department_id 查询）。
 * 缓存键：employee_no（即 JWT sub，在一次登录会话期间不变），TTL = 60s（见 CacheConfig）。
 *
 * 注意：@Cacheable 需要方法被外部 bean 调用（Spring AOP 代理机制），因此本类独立于
 * WorkbenchService；WorkbenchService 注入此 bean 后调用 loadByEmployeeNo 才能命中缓存。
 */
@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final EmployeeMapper employeeMapper;
    private final DepartmentMapper departmentMapper;

    /**
     * 按员工编号加载员工档案（employee + department），结果缓存 60s。
     *
     * @param employeeNo 员工编号（与 JWT subject / username 一致）
     * @return 员工档案记录；employee 表中找不到时返回 null
     */
    @Cacheable(value = "userProfile", key = "#employeeNo")
    public EmployeeProfile loadByEmployeeNo(String employeeNo) {
        Employee employee = employeeMapper.selectOne(
                new LambdaQueryWrapper<Employee>()
                        .eq(Employee::getEmployeeNo, employeeNo)
                        .eq(Employee::getDeleted, 0)
        );
        if (employee == null) {
            return null;
        }

        String departmentName = "未分配";
        if (employee.getDepartmentId() != null) {
            Department dept = departmentMapper.selectById(employee.getDepartmentId());
            if (dept != null && dept.getName() != null && !dept.getName().isBlank()) {
                departmentName = dept.getName();
            }
        }
        return new EmployeeProfile(employee, departmentName);
    }

    /**
     * 员工档案值对象，聚合 employee 实体与已解析的部门名称。
     * 不暴露为 public 外部使用，故设为包私有；调用方仅通过 loadByEmployeeNo 获取。
     */
    public record EmployeeProfile(Employee employee, String departmentName) {}
}
