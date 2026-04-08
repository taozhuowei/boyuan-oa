package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 数据保留策略实体类，对应数据表 retention_policy。
 * <p>
 * 用于配置不同数据类型的保留年限和提前警告天数。
 * 当数据即将到达保留期限时，系统会生成保留提醒。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@Data
@TableName("retention_policy")
public class RetentionPolicy {

    /** 策略主键 ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 数据类型，如：PAYROLL_SLIP, FORM_RECORD 等 */
    @TableField("data_type")
    private String dataType;

    /** 保留年限，默认 1 年 */
    @TableField("retention_years")
    private Integer retentionYears;

    /** 提前警告天数，默认 30 天 */
    @TableField("warn_before_days")
    private Integer warnBeforeDays;

    /** 创建时间 */
    @TableField("created_at")
    private LocalDateTime createdAt;

    /** 更新时间 */
    @TableField("updated_at")
    private LocalDateTime updatedAt;

    /** 逻辑删除标志，0=未删除，1=已删除 */
    @TableLogic
    private Integer deleted;
}
