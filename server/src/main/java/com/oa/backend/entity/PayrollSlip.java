package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

/**
 * 工资条实体，对应 payroll_slip 表。 状态流转：DRAFT → PUBLISHED → CONFIRMED（员工电子签名后）； 异议后进入 DISPUTED；更正后旧版本变为
 * SUPERSEDED。
 */
@Data
@TableName("payroll_slip")
public class PayrollSlip {

  @TableId(type = IdType.AUTO)
  private Long id;

  /** 所属周期 */
  private Long cycleId;

  /** 员工 ID */
  private Long employeeId;

  /** 版本号（更正后递增） */
  private Integer version;

  /** 状态：DRAFT | PUBLISHED | CONFIRMED | DISPUTED | SUPERSEDED */
  private String status;

  /** 实发工资 */
  private BigDecimal netPay;

  @TableField("created_at")
  private LocalDateTime createdAt;

  @TableField("updated_at")
  private LocalDateTime updatedAt;

  @TableLogic private Integer deleted;
}
