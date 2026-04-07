package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 审批记录实体类，对应数据表 approval_record
 * 注：此表无 deleted 字段，不归档删除，保留历史记录
 */
@Data
@TableName("approval_record")
public class ApprovalRecord {

    /** 主键 ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 表单 ID */
    @TableField("form_id")
    private Long formId;

    /** 节点顺序 */
    @TableField("node_order")
    private Integer nodeOrder;

    /** 审批人 ID */
    @TableField("approver_id")
    private Long approverId;

    /** 动作：APPROVE, REJECT, SKIP, RECALL */
    private String action;

    /** 审批意见 */
    private String comment;

    /** 操作时间 */
    @TableField("acted_at")
    private LocalDateTime actedAt;
}
