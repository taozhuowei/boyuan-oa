package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.SystemConfig;
import org.apache.ibatis.annotations.Mapper;

/**
 * 系统配置 Mapper，提供 key-value 配置的持久化操作。
 */
@Mapper
public interface SystemConfigMapper extends BaseMapper<SystemConfig> {
}
