package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.Role;
import org.apache.ibatis.annotations.Mapper;

/**
 * 角色数据访问层接口，操作 sys_role 表
 */
@Mapper
public interface RoleMapper extends BaseMapper<Role> {
}
