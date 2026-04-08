package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 保留提醒实体类，对应数据表 retention_reminder。
 * <p>
 * 用于记录数据保留策略的提醒信息，当数据即将到达保留期限时创建提醒记录。
 * 提醒状态包括：PENDING（待处理）、REMINDED（已提醒）。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@Data
@TableName("retention_reminder")
public class RetentionReminder {

    /** 提醒主键 ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 策略 ID，关联 retention_policy 表 */
    @TableField("policy_id")
    private Long policyId;

    /** 数据类型 */
    @TableField("data_type")
    private String dataType;

    /** 预计删除日期 */
    @TableField("expected_delete_date")
    private LocalDate expectedDeleteDate;

    /** 提醒发送时间 */
    @TableField("reminded_at")
    private LocalDateTime remindedAt;

    /** 状态：PENDING, REMINDED */
    private String status;

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
