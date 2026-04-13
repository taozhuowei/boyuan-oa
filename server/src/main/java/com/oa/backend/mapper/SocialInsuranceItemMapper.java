package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.SocialInsuranceItem;
import org.apache.ibatis.annotations.Mapper;

/**
 * 社保项目数据访问层接口，操作 social_insurance_item 表
 */
@Mapper
public interface SocialInsuranceItemMapper extends BaseMapper<SocialInsuranceItem> {
}
