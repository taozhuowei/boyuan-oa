package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.FormRecord;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.FormRecordMapper;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 团队服务类。
 *
 * <p>负责部门成员查询和月度出勤/加班统计，封装 EmployeeMapper 和 FormRecordMapper 的调用。 数据来源：employee 表、form_record
 * 表（LEAVE / OVERTIME 类型）。
 */
@Service
@RequiredArgsConstructor
public class TeamService {

  private final EmployeeMapper employeeMapper;
  private final FormRecordMapper formRecordMapper;

  /**
   * 根据员工 ID 查询员工实体。
   *
   * @param employeeId 员工 ID
   * @return 员工实体，不存在时返回 null
   */
  public Employee findEmployeeById(Long employeeId) {
    return employeeMapper.selectById(employeeId);
  }

  /**
   * 查询指定部门内所有活跃成员（排除经理本人）。
   *
   * @param departmentId 部门 ID
   * @param excludeId 需要排除的员工 ID（通常为当前登录的部门经理）
   * @return 部门成员列表
   */
  public List<Employee> listActiveDepartmentMembers(Long departmentId, Long excludeId) {
    return employeeMapper.selectList(
        new LambdaQueryWrapper<Employee>()
            .eq(Employee::getDepartmentId, departmentId)
            .eq(Employee::getAccountStatus, "ACTIVE")
            .eq(Employee::getDeleted, 0)
            .ne(Employee::getId, excludeId));
  }

  /**
   * 查询指定员工在给定起始时间之后的已审批请假和加班表单。
   *
   * @param employeeId 员工 ID
   * @param monthStart 统计起始时间（通常为当月第一天零时）
   * @return 已审批的请假/加班表单列表
   */
  public List<FormRecord> listApprovedLeaveAndOvertimeForms(
      Long employeeId, LocalDateTime monthStart) {
    return formRecordMapper.selectList(
        new LambdaQueryWrapper<FormRecord>()
            .eq(FormRecord::getSubmitterId, employeeId)
            .in(FormRecord::getFormType, "LEAVE", "OVERTIME")
            .eq(FormRecord::getStatus, "APPROVED")
            .ge(FormRecord::getCreatedAt, monthStart)
            .eq(FormRecord::getDeleted, 0));
  }
}
