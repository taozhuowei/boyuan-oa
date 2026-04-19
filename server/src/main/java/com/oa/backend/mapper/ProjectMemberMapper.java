package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.ProjectMember;
import org.apache.ibatis.annotations.Mapper;

/** 项目成员数据访问层 */
@Mapper
public interface ProjectMemberMapper extends BaseMapper<ProjectMember> {}
