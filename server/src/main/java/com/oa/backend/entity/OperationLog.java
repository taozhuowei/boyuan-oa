package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 操作日志实体类，对应数据表 operation_log
 * 注：此表无 deleted 字段，不归档删除，保留历史记录
 */
@Data
@TableName("operation_log")
public class OperationLog {

    /** 主键 ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 操作人 ID */
    @TableField("operator_id")
    private Long operatorId;

    /** 动作 */
    private String action;

    /** 目标类型 */
    @TableField("target_type")
    private String targetType;

    /** 目标 ID */
    @TableField("target_id")
    private Long targetId;

    /** 详情 */
    private String detail;

    /** 操作时间 */
    @TableField("acted_at")
    private LocalDateTime actedAt;
}
