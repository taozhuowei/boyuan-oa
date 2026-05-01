package com.oa.backend.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.oa.backend.dto.EmployeeCreateRequest;
import com.oa.backend.dto.EmployeeResponse;
import com.oa.backend.dto.EmployeeUpdateRequest;
import com.oa.backend.entity.Employee;
import java.util.List;
import java.util.Optional;

/** 员工服务接口 */
public interface EmployeeService {

  /** 认证：根据 employee_no 和密码验证，成功返回 Employee */
  Optional<Employee> authenticate(String employeeNo, String rawPassword);

  /** 分页列表，支持过滤 — C+-F-16 移除 employeeType 参数 */
  IPage<Employee> listEmployees(
      int page, int size, String keyword, String roleCode, String accountStatus, Long departmentId);

  /** 根据 ID 查询（排除已删除） */
  Optional<Employee> findById(Long id);

  /** 创建员工 */
  Employee createEmployee(EmployeeCreateRequest request);

  /** 更新员工 */
  Employee updateEmployee(Long id, EmployeeUpdateRequest request);

  /** 软删除（deleted=1） */
  void deleteEmployee(Long id);

  /** 生成员工编号（格式：EMP + 年月 + 4位序号） */
  String generateEmployeeNo();

  /** 更新账号状态（ACTIVE/DISABLED） */
  Employee updateAccountStatus(Long id, String status);

  /** 重置密码为初始密码 123456 */
  void resetPassword(Long id);

  /** 根据手机号查找员工 */
  Optional<Employee> findByPhone(String phone);

  /** 根据绑定邮箱查找员工（未删除、非空邮箱） */
  Optional<Employee> findByEmail(String email);

  /** 更新员工密码 */
  void updatePassword(Long id, String newPasswordHash, boolean isDefaultPassword);

  /** 更新员工手机号 */
  void updatePhone(Long id, String newPhone);

  /** 根据用户名（employee_no）解析员工 ID；用于 controller 脱离 EmployeeMapper 直注入 */
  Long resolveEmployeeIdByUsername(String username);

  /** 根据角色代码查询角色名称（响应辅助字段，未找到返回 roleCode 本身） */
  String findRoleNameByCode(String roleCode);

  /** 根据部门 ID 查询部门名称（响应辅助字段，未找到返回空字符串） */
  String findDepartmentNameById(Long departmentId);

  /** 查询员工的紧急联系人列表（已过滤软删除） */
  List<EmployeeResponse.EmergencyContact> findEmergencyContacts(Long employeeId);
}
