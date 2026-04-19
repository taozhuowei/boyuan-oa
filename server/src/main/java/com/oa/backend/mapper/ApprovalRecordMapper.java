package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.ApprovalRecord;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/** 审批记录数据访问层接口，操作 approval_record 表 */
@Mapper
public interface ApprovalRecordMapper extends BaseMapper<ApprovalRecord> {

  /** 根据表单 ID 查找所有审批记录，按节点顺序和操作时间排序 */
  @Select(
      "SELECT * FROM approval_record WHERE form_id = #{formId} ORDER BY node_order ASC, acted_at ASC")
  List<ApprovalRecord> findByFormId(@Param("formId") Long formId);
}
