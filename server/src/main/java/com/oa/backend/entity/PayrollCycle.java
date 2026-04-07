package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 工资周期实体类
 */
@Data
@TableName("payroll_cycle")
public class PayrollCycle {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String cycleNo;

    private String cycleName;

    private LocalDate startDate;

    private LocalDate endDate;

    private String status;

    private Integer version;

    private Boolean locked;

    private LocalDateTime precheckTime;

    private LocalDateTime settleTime;

    private Integer employeeCount;

    private Double totalAmount;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
