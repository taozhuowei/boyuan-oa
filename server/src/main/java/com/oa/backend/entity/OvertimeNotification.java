package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 加班通知实体，对应 overtime_notification 表。
 * 由 PM/CEO 发起，通知关联项目的劳工当日加班情况；员工可确认或拒绝。
 */
@Data
@TableName("overtime_notification")
public class OvertimeNotification {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 关联项目 ID（可选） */
    @TableField("project_id")
    private Long projectId;

    /** 发起人员工 ID（PM 或 CEO） */
    @TableField("initiator_id")
    private Long initiatorId;

    /** 加班日期 */
    @TableField("overtime_date")
    private LocalDate overtimeDate;

    /** 加班类型：WEEKDAY / WEEKEND / HOLIDAY */
    @TableField("overtime_type")
    private String overtimeType;

    /** 通知内容说明 */
    private String content;

    /** 状态：NOTIFIED / ARCHIVED / CLOSED */
    private String status;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
