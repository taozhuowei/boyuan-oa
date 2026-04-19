package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.InjuryClaim;
import org.apache.ibatis.annotations.Mapper;

/** 工伤理赔 Mapper，继承 BaseMapper 获得基础 CRUD 能力 */
@Mapper
public interface InjuryClaimMapper extends BaseMapper<InjuryClaim> {}
