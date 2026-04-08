package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.WorkItemTemplate;
import org.apache.ibatis.annotations.Mapper;

/**
 * 工作项模板 Mapper，继承 BaseMapper 获得基础 CRUD 能力
 */
@Mapper
public interface WorkItemTemplateMapper extends BaseMapper<WorkItemTemplate> {
}
