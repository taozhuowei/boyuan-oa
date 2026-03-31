package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.User;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户数据访问层接口，操作 sys_user 表
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
}
