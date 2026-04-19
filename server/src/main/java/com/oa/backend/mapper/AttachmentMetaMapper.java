package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.AttachmentMeta;
import org.apache.ibatis.annotations.Mapper;

/** 附件元数据 Mapper，继承 BaseMapper 获得基础 CRUD 能力 */
@Mapper
public interface AttachmentMetaMapper extends BaseMapper<AttachmentMeta> {}
