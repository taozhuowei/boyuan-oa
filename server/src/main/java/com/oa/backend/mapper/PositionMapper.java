package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.Position;
import org.apache.ibatis.annotations.Mapper;

/**
 * 岗位数据访问层接口，操作 position 表
 */
@Mapper
public interface PositionMapper extends BaseMapper<Position> {
}
