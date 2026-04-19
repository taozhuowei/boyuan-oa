package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;

/** 报销申请实体 */
@Data
@TableName("expense_claim")
public class ExpenseClaim {

  @TableId(type = IdType.AUTO)
  private Long id;

  private Long formId;

  private Long employeeId;

  private String expenseType;

  private LocalDate tripStartDate;

  private LocalDate tripEndDate;

  private String tripDestination;

  private String tripPurpose;

  private BigDecimal totalAmount;

  private String invoicesJson;

  private Long projectId;

  private Boolean includedInPayroll;

  private Long payrollCycleId;

  private String remark;

  private LocalDateTime createdAt;

  private LocalDateTime updatedAt;

  private Integer deleted;
}
