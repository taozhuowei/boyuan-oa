package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 项目进度日志实体，对应 project_progress_log 表。
 * PM 每次确认当日进度时写入一条记录，可关联里程碑。
 */
@Data
@TableName("project_progress_log")
public class ProjectProgressLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属项目 */
    private Long projectId;

    /** 记录人（PM）员工 ID */
    private Long pmId;

    /** 关联里程碑 ID（可为空） */
    private Long milestoneId;

    /** 完成时间 */
    private LocalDateTime completedAt;

    /** 进度备注 */
    private String note;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
