package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 工资周期实体，对应 payroll_cycle 表。
 * 状态流转：OPEN → WINDOW_OPEN → WINDOW_CLOSED → SETTLED → LOCKED（→ CORRECTING）
 * window_status 由 PayrollWindowScheduler 自动维护，不提供手动关闭接口。
 */
@Data
@TableName("payroll_cycle")
public class PayrollCycle {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 结算周期标识，如 "2026-04" */
    private String period;

    /** 结算类型，当前仅支持 MONTHLY */
    private String settlementType;

    /** 周期起始日 */
    private LocalDate startDate;

    /** 周期截止日 */
    private LocalDate endDate;

    /** 计划发薪日 */
    private LocalDate payDate;

    /** 申报窗口天数，默认7天 */
    private Integer windowDays;

    /** 申报窗口状态：OPEN | CLOSED */
    private String windowStatus;

    /** 窗口开放日 */
    private LocalDate windowStartDate;

    /** 窗口截止日 */
    private LocalDate windowEndDate;

    /** 周期状态：OPEN | WINDOW_OPEN | WINDOW_CLOSED | SETTLED | LOCKED | CORRECTING */
    private String status;

    /** 锁定时间（SETTLED/LOCKED 时写入） */
    private LocalDateTime lockedAt;

    /** 版本号，更正后递增 */
    private Integer version;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
