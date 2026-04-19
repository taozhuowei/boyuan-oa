package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.PayrollSlip;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/** 工资条 Mapper。 */
@Mapper
public interface PayrollSlipMapper extends BaseMapper<PayrollSlip> {

  /** 查找指定周期的所有工资条 */
  @Select("SELECT * FROM payroll_slip WHERE cycle_id = #{cycleId} AND deleted = 0")
  List<PayrollSlip> findByCycleId(Long cycleId);

  /** 查找指定员工的所有工资条 */
  @Select(
      "SELECT * FROM payroll_slip WHERE employee_id = #{employeeId} AND deleted = 0 ORDER BY created_at DESC")
  List<PayrollSlip> findByEmployeeId(Long employeeId);

  /** 查找指定周期中特定状态的工资条数量 */
  @Select(
      "SELECT COUNT(*) FROM payroll_slip WHERE cycle_id = #{cycleId} AND status = #{status} AND deleted = 0")
  int countByStatus(Long cycleId, String status);
}
