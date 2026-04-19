package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.ProjectProgressLog;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/** 项目进度日志 Mapper。 */
@Mapper
public interface ProjectProgressLogMapper extends BaseMapper<ProjectProgressLog> {

  /** 查询项目所有进度日志，按创建时间降序 */
  @Select(
      "SELECT * FROM project_progress_log WHERE project_id = #{projectId} ORDER BY created_at DESC")
  List<ProjectProgressLog> findByProjectId(Long projectId);
}
