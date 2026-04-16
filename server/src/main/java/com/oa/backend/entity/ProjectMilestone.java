package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 项目里程碑实体，对应 project_milestone 表。
 * 每个里程碑标记一个阶段性目标，完成后填写实际完成日期。
 */
@Data
@TableName("project_milestone")
public class ProjectMilestone {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属项目 */
    private Long projectId;

    /** 里程碑名称 */
    private String name;

    /** 排序序号（升序显示） */
    private Integer sort;

    /** 实际完成日期（null 表示未完成） */
    private LocalDate actualCompletionDate;

    /** 合同收款金额（设计 §8.2/§8.5）— 由 PM 在里程碑配置时填写 */
    @TableField("contract_amount")
    private java.math.BigDecimal contractAmount;

    /** 收款状态：PENDING（待收款）/ RECEIVED（已收款）— 财务更新 */
    @TableField("receipt_status")
    private String receiptStatus;

    /** 实际收款金额（财务收款时填写） */
    @TableField("actual_receipt_amount")
    private java.math.BigDecimal actualReceiptAmount;

    /** 实际收款日期 */
    @TableField("receipt_date")
    private LocalDate receiptDate;

    /** 收款备注 */
    @TableField("receipt_remark")
    private String receiptRemark;

    /** 待审批合同金额变更（设计 §8.5）— 非空表示有未决变更 */
    @TableField("pending_change_amount")
    private java.math.BigDecimal pendingChangeAmount;

    /** 变更发起方角色：FINANCE / PROJECT_MANAGER（决定对方审批人） */
    @TableField("pending_change_role")
    private String pendingChangeRole;

    /** 变更发起人 employee_id */
    @TableField("pending_change_initiator")
    private Long pendingChangeInitiator;

    /** 关联的 form_record id */
    @TableField("pending_change_form_id")
    private Long pendingChangeFormId;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
