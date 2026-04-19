package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.PositionLevel;
import org.apache.ibatis.annotations.Mapper;

/** 岗位等级数据访问层接口，操作 position_level 表 */
@Mapper
public interface PositionLevelMapper extends BaseMapper<PositionLevel> {}
