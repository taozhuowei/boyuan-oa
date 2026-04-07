package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.PayrollSlipItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 工资条项目 Mapper。
 */
@Mapper
public interface PayrollSlipItemMapper extends BaseMapper<PayrollSlipItem> {

    /**
     * 查找指定工资条的所有项目
     */
    @Select("SELECT * FROM payroll_slip_item WHERE slip_id = #{slipId} ORDER BY created_at ASC")
    List<PayrollSlipItem> findBySlipId(Long slipId);
}
