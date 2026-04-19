package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

/** 工资条项目实体，对应 payroll_slip_item 表。 一条 payroll_slip 包含多条 payroll_slip_item（基本工资、加班费、扣款等）。 */
@Data
@TableName("payroll_slip_item")
public class PayrollSlipItem {

  @TableId(type = IdType.AUTO)
  private Long id;

  /** 所属工资条 */
  private Long slipId;

  /** 工资项定义 */
  private Long itemDefId;

  /** 金额（正数为收入，负数为扣款） */
  private BigDecimal amount;

  /** 备注说明 */
  private String remark;

  @TableField("created_at")
  private LocalDateTime createdAt;

  @TableField("updated_at")
  private LocalDateTime updatedAt;
}
