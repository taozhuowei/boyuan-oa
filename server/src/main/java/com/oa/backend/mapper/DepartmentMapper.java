package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.Department;
import org.apache.ibatis.annotations.Mapper;

/**
 * 部门数据访问层
 */
@Mapper
public interface DepartmentMapper extends BaseMapper<Department> {
}
