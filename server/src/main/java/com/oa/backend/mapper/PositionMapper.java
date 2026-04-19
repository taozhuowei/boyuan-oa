package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.Position;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/** 岗位数据访问层接口，操作 position 表 */
@Mapper
public interface PositionMapper extends BaseMapper<Position> {

  /**
   * Returns the highest position_code with 'POS' prefix across ALL rows (including soft-deleted).
   * Used by generatePositionCode so it never re-uses a code that already exists in the table.
   */
  @Select(
      "SELECT position_code FROM position WHERE position_code LIKE 'POS%' ORDER BY position_code DESC LIMIT 1")
  String findMaxPositionCode();
}
