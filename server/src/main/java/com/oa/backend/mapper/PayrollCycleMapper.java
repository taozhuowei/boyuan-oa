package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.PayrollCycle;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/** 工资周期 Mapper。 */
@Mapper
public interface PayrollCycleMapper extends BaseMapper<PayrollCycle> {

  /** 查找所有开放申报窗口且已过期的周期（用于 Scheduler 自动关闭） */
  @Select(
      "SELECT * FROM payroll_cycle WHERE window_status = 'OPEN' AND window_end_date <= CURRENT_DATE AND deleted = 0")
  List<PayrollCycle> findExpiredOpenWindows();

  /** 按 period 查找周期 */
  @Select("SELECT * FROM payroll_cycle WHERE period = #{period} AND deleted = 0 LIMIT 1")
  PayrollCycle findByPeriod(String period);

  /**
   * 行级锁查询（FOR UPDATE）— C+-F-12 幂等结算防并发。
   *
   * <p>必须在 @Transactional 事务内调用，否则锁立即释放无效。
   */
  @Select("SELECT * FROM payroll_cycle WHERE id = #{id} AND deleted = 0 FOR UPDATE")
  PayrollCycle selectForUpdate(Long id);
}
