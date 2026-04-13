package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 清理任务实体类，对应数据表 cleanup_task。
 * <p>
 * 用于记录数据清理任务的执行状态，包括要清理的数据类型、
 * 目标日期、执行状态和删除记录数等信息。
 * <p>
 * 状态流转：PENDING → RUNNING → DONE/FAILED
 *
 * @author OA Backend Team
 * @since 1.0
 */
@Data
@TableName("cleanup_task")
public class CleanupTask {

    /** 任务主键 ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 数据类型，如：PAYROLL_SLIP, FORM_RECORD 等 */
    @TableField("data_type")
    private String dataType;

    /** 目标清理日期（删除此日期之前的记录） */
    @TableField("target_date")
    private LocalDate targetDate;

    /** 任务状态：PENDING, RUNNING, DONE, FAILED */
    private String status;

    /** 实际删除的记录数 */
    @TableField("records_deleted")
    private Integer recordsDeleted;

    /** 任务开始时间 */
    @TableField("started_at")
    private LocalDateTime startedAt;

    /** 任务完成时间 */
    @TableField("finished_at")
    private LocalDateTime finishedAt;

    /** 错误信息（失败时记录） */
    @TableField("error_msg")
    private String errorMsg;

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
