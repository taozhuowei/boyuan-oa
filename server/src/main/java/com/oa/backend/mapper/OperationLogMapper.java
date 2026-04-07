package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.OperationLog;
import org.apache.ibatis.annotations.Mapper;

/**
 * 操作日志数据访问层接口，操作 operation_log 表
 */
@Mapper
public interface OperationLogMapper extends BaseMapper<OperationLog> {
}
