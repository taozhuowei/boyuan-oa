package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.PayrollConfirmation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/** 工资条确认存证 Mapper。 */
@Mapper
public interface PayrollConfirmationMapper extends BaseMapper<PayrollConfirmation> {

  /** 按工资条 ID 查找存证记录 */
  @Select("SELECT * FROM payroll_confirmation WHERE slip_id = #{slipId} LIMIT 1")
  PayrollConfirmation findBySlipId(Long slipId);
}
