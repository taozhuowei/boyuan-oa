package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.Project;
import org.apache.ibatis.annotations.Mapper;

/**
 * 项目数据访问层
 */
@Mapper
public interface ProjectMapper extends BaseMapper<Project> {
}
