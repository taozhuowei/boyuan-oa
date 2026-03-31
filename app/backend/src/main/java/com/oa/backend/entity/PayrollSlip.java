package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 工资单实体类
 */
@Data
@TableName("payroll_slip")
public class PayrollSlip {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String slipNo;

    private Long cycleId;

    private String cycleNo;

    private Long employeeId;

    private String employeeName;

    private String department;

    private Integer version;

    private String status;

    private String items;

    private Double grossAmount;

    private Double netAmount;

    private LocalDateTime confirmTime;

    private String confirmIp;

    private String disputeReason;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
