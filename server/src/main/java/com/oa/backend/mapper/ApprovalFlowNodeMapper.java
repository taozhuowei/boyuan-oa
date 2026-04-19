package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.ApprovalFlowNode;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/** 审批流节点数据访问层接口，操作 approval_flow_node 表 */
@Mapper
public interface ApprovalFlowNodeMapper extends BaseMapper<ApprovalFlowNode> {

  /** 根据审批流 ID 查找所有节点，按 node_order 排序 */
  @Select(
      "SELECT * FROM approval_flow_node WHERE flow_id = #{flowId} AND deleted = 0 ORDER BY node_order ASC")
  List<ApprovalFlowNode> findByFlowId(@Param("flowId") Long flowId);

  /** 根据审批流 ID 和节点顺序查找节点 */
  @Select(
      "SELECT * FROM approval_flow_node WHERE flow_id = #{flowId} AND node_order = #{nodeOrder} AND deleted = 0 LIMIT 1")
  ApprovalFlowNode findByFlowIdAndNodeOrder(
      @Param("flowId") Long flowId, @Param("nodeOrder") Integer nodeOrder);
}
