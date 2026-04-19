package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

/**
 * 周期临时补贴/奖金实体，对应 payroll_bonus 表。 财务在薪资窗口期内录入；系统配置 payroll_bonus_approval_required=true 时会触发 CEO
 * 审批。 结算时只累加 status=APPROVED 的记录。
 */
@Data
@TableName("payroll_bonus")
public class PayrollBonus {

  @TableId(type = IdType.AUTO)
  private Long id;

  @TableField("cycle_id")
  private Long cycleId;

  @TableField("employee_id")
  private Long employeeId;

  /** 条目名称，如 "春节奖金" / "临时补贴" */
  private String name;

  /** 金额（正数） */
  private BigDecimal amount;

  /** 类型：EARNING（补贴/奖金）/ DEDUCTION（扣款） */
  private String type;

  /** 状态：PENDING / APPROVED / REJECTED */
  private String status;

  /** 备注 */
  private String remark;

  /** 审批开启时，对应的 form_record.id */
  @TableField("form_id")
  private Long formId;

  /** 创建者员工 ID */
  @TableField("created_by")
  private Long createdBy;

  @TableField("created_at")
  private LocalDateTime createdAt;

  @TableField("updated_at")
  private LocalDateTime updatedAt;

  @TableLogic private Integer deleted;
}
