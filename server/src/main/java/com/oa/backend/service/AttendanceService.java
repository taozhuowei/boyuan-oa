package com.oa.backend.service;

import com.oa.backend.entity.Employee;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

/**
 * 考勤辅助服务 职责：封装考勤模块对 EmployeeMapper 的依赖， 提供从 Authentication 解析当前员工 ID 和角色代码的工具方法， 供
 * AttendanceController 调用，避免控制器直接持有 Mapper。
 */
@Service
@RequiredArgsConstructor
public class AttendanceService {

  private final EmployeeMapper employeeMapper;

  /**
   * 从当前登录的 Authentication 中解析员工 ID。 若 authentication 为 null 或用户名对应员工不存在则返回 null。
   *
   * @param authentication Spring Security 认证对象
   * @return 员工 ID，或 null
   */
  public Long resolveEmployeeId(Authentication authentication) {
    if (authentication == null) {
      return null;
    }
    Employee employee =
        SecurityUtils.getEmployeeFromUsername(authentication.getName(), employeeMapper);
    return employee != null ? employee.getId() : null;
  }

  /**
   * 从当前登录的 Authentication 中解析员工角色代码。 若 authentication 为 null 或用户名对应员工不存在则返回 null。
   *
   * @param authentication Spring Security 认证对象
   * @return 角色代码字符串，或 null
   */
  public String resolveRoleCode(Authentication authentication) {
    if (authentication == null) {
      return null;
    }
    Employee employee =
        SecurityUtils.getEmployeeFromUsername(authentication.getName(), employeeMapper);
    return employee != null ? employee.getRoleCode() : null;
  }
}
