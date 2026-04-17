package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 请假类型定义，对应 leave_type_def 表。
 */
@Data
@TableName("leave_type_def")
public class LeaveTypeDef {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String code;
    private String name;

    @TableField("quota_days")
    private Integer quotaDays;

    @TableField("deduction_rate")
    private BigDecimal deductionRate;

    @TableField("deduction_basis")
    private String deductionBasis;

    @TableField("is_system")
    private Boolean isSystem;

    @TableField("is_enabled")
    private Boolean isEnabled;

    @TableField("display_order")
    private Integer displayOrder;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
