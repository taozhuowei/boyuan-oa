package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;
import lombok.Data;

/**
 * 薪资更正/调整实体，对应 payroll_adjustment 表。 财务发起 → CEO 审批 → 通过后将原 payroll_slip 标记 SUPERSEDED，version+1 生成新
 * PayrollSlip。
 *
 * <p>字段： slip_id 目标工资条 id form_id 关联的 form_record id（用于审批流接入） corrections_json 更正项
 * JSON：[{itemDefId, amount, remark}, ...] new_slip_id 审批通过后生成的新 PayrollSlip id applied 是否已应用（true
 * 表示新工资条已生成，原工资条已 SUPERSEDED）
 */
@Data
@TableName("payroll_adjustment")
public class PayrollAdjustment {

  @TableId(type = IdType.AUTO)
  private Long id;

  @TableField("cycle_id")
  private Long cycleId;

  @TableField("employee_id")
  private Long employeeId;

  @TableField("initiator_id")
  private Long initiatorId;

  /** 更正原因 */
  private String reason;

  /** 状态：PENDING / APPROVED / REJECTED */
  private String status;

  @TableField("slip_id")
  private Long slipId;

  @TableField("form_id")
  private Long formId;

  @TableField("corrections_json")
  private String correctionsJson;

  @TableField("new_slip_id")
  private Long newSlipId;

  /** 是否已应用（apply 完成置 true） */
  private Boolean applied;

  @TableField("created_at")
  private LocalDateTime createdAt;

  @TableField("updated_at")
  private LocalDateTime updatedAt;

  @TableLogic private Integer deleted;
}
