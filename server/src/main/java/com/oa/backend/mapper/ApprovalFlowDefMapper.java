package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.ApprovalFlowDef;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 审批流定义数据访问层接口，操作 approval_flow_def 表
 */
@Mapper
public interface ApprovalFlowDefMapper extends BaseMapper<ApprovalFlowDef> {

    /**
     * 根据业务类型查找激活的审批流定义
     */
    @Select("SELECT * FROM approval_flow_def WHERE business_type = #{businessType} AND is_active = TRUE AND deleted = 0 LIMIT 1")
    ApprovalFlowDef findActiveByBusinessType(@Param("businessType") String businessType);
}
