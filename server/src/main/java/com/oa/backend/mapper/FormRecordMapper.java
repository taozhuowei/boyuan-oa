package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.FormRecord;
import org.apache.ibatis.annotations.Mapper;

/** 表单记录数据访问层接口，操作 form_record 表 */
@Mapper
public interface FormRecordMapper extends BaseMapper<FormRecord> {}
