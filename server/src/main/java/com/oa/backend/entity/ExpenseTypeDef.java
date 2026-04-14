package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 费用类型定义实体
 */
@Data
@TableName("expense_type_def")
public class ExpenseTypeDef {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String code;

    private String name;

    private String description;

    private Boolean requireInvoice;

    private BigDecimal dailyLimit;

    private Integer displayOrder;

    private Boolean isEnabled;

    private Boolean isSystem;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Integer deleted;
}
