package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 岗位实体类，对应数据表 position
 */
@Data
@TableName("position")
public class Position {

    /** 岗位主键 ID */
    @TableId(type = IdType.INPUT)
    private Long id;

    /** 岗位编码 */
    @TableField("position_code")
    private String positionCode;

    /** 岗位名称 */
    @TableField("position_name")
    private String positionName;

    /** 员工类别（OFFICE/LABOR） */
    @TableField("employee_category")
    private String employeeCategory;

    /** 默认角色编码 */
    @TableField("default_role_code")
    private String defaultRoleCode;

    /** 上级岗位编码 */
    @TableField("supervisor_position_code")
    private String supervisorPositionCode;

    /** 是否需要施工日志 */
    @TableField("requires_construction_log")
    private Boolean requiresConstructionLog;

    /** 是否有绩效奖金 */
    @TableField("has_performance_bonus")
    private Boolean hasPerformanceBonus;

    /** 基本工资 */
    @TableField("base_salary")
    private BigDecimal baseSalary;

    /** 加班计算基准类型 */
    @TableField("overtime_base_type")
    private String overtimeBaseType;

    /** 加班计算基准金额 */
    @TableField("overtime_base_amount")
    private BigDecimal overtimeBaseAmount;

    /** 工作日加班倍率 */
    @TableField("overtime_rate_weekday")
    private BigDecimal overtimeRateWeekday;

    /** 周末加班倍率 */
    @TableField("overtime_rate_weekend")
    private BigDecimal overtimeRateWeekend;

    /** 节假日加班倍率 */
    @TableField("overtime_rate_holiday")
    private BigDecimal overtimeRateHoliday;

    /** 默认绩效奖金 */
    @TableField("default_performance_bonus")
    private BigDecimal defaultPerformanceBonus;

    /** 年假天数 */
    @TableField("annual_leave")
    private Integer annualLeave;

    /** 请假扣款基准类型 */
    @TableField("leave_deduct_base_type")
    private String leaveDeductBaseType;

    /** 社保模式 */
    @TableField("social_insurance_mode")
    private String socialInsuranceMode;

    /** 创建时间 */
    @TableField("created_at")
    private LocalDateTime createdAt;

    /** 更新时间 */
    @TableField("updated_at")
    private LocalDateTime updatedAt;

    /** 逻辑删除标志 */
    @TableLogic
    private Integer deleted;
}
