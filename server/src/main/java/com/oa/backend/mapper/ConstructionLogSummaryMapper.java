package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.ConstructionLogSummary;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/** 施工日志汇总 Mapper。 */
@Mapper
public interface ConstructionLogSummaryMapper extends BaseMapper<ConstructionLogSummary> {

  /** 查询项目所有汇总报告，按创建时间降序 */
  @Select(
      "SELECT * FROM construction_log_summary WHERE project_id = #{projectId} AND deleted = 0 ORDER BY created_at DESC")
  List<ConstructionLogSummary> findByProjectId(Long projectId);
}
