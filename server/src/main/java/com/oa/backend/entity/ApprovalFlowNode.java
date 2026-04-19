package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;
import lombok.Data;

/** 审批流节点实体类，对应数据表 approval_flow_node */
@Data
@TableName("approval_flow_node")
public class ApprovalFlowNode {

  /** 节点主键 ID */
  @TableId(type = IdType.AUTO)
  private Long id;

  /** 所属审批流 ID */
  private Long flowId;

  /** 节点顺序 */
  private Integer nodeOrder;

  /** 节点名称 */
  private String nodeName;

  /** 审批模式（SEQUENTIAL-顺序审批） */
  private String approvalMode;

  /** 审批人类型（DIRECT_SUPERVISOR-直系领导, ROLE-角色, DESIGNATED-指定人员） */
  private String approverType;

  /** 审批人引用（角色编码或用户ID等） */
  private String approverRef;

  /** 跳过条件（JSON 字符串） */
  private String skipCondition;

  /** 创建时间 */
  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createdAt;

  /** 更新时间 */
  @TableField(fill = FieldFill.INSERT_UPDATE)
  private LocalDateTime updatedAt;

  /** 逻辑删除标志 */
  @TableLogic private Integer deleted;
}
