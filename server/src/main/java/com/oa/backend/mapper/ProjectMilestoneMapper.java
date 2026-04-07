package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.ProjectMilestone;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 项目里程碑 Mapper。
 */
@Mapper
public interface ProjectMilestoneMapper extends BaseMapper<ProjectMilestone> {

    /**
     * 查询项目所有里程碑，按 sort 升序排列
     */
    @Select("SELECT * FROM project_milestone WHERE project_id = #{projectId} AND deleted = 0 ORDER BY sort ASC, id ASC")
    List<ProjectMilestone> findByProjectId(Long projectId);
}
