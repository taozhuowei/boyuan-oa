package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.PayrollBonus;
import org.apache.ibatis.annotations.Mapper;

/**
 * 周期临时补贴/奖金 Mapper。
 */
@Mapper
public interface PayrollBonusMapper extends BaseMapper<PayrollBonus> {
}
