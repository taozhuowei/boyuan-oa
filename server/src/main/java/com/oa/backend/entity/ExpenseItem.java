package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 报销明细实体
 */
@Data
@TableName("expense_item")
public class ExpenseItem {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long expenseClaimId;

    private String itemType;

    private LocalDate expenseDate;

    private BigDecimal amount;

    private String invoiceNo;

    private String description;

    private Long attachmentId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Integer deleted;
}
