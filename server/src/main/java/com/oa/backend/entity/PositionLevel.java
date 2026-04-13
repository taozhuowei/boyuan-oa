package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 岗位等级实体类，对应数据表 position_level
 */
@Data
@TableName("position_level")
public class PositionLevel {

    /** 等级主键 ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属岗位 ID */
    @TableField("position_id")
    private Long positionId;

    /** 等级名称 */
    @TableField("level_name")
    private String levelName;

    /** 等级排序 */
    @TableField("level_order")
    private Integer levelOrder;

    /** 基本工资覆盖值 */
    @TableField("base_salary_override")
    private BigDecimal baseSalaryOverride;

    /** 绩效奖金覆盖值 */
    @TableField("performance_bonus_override")
    private BigDecimal performanceBonusOverride;

    /** 年假覆盖值 */
    @TableField("annual_leave_override")
    private Integer annualLeaveOverride;

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
