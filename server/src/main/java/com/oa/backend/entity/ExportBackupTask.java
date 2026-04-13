package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 导出备份任务实体类，对应数据表 export_backup_task。
 * <p>
 * 用于记录数据导出备份任务的执行状态，包括任务发起人、数据类型、
 * 执行状态、生成的文件路径和下载令牌等信息。
 * <p>
 * 状态流转：PENDING → RUNNING → DONE/FAILED
 *
 * @author OA Backend Team
 * @since 1.0
 */
@Data
@TableName("export_backup_task")
public class ExportBackupTask {

    /** 任务主键 ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 任务发起人 ID */
    @TableField("initiator_id")
    private Long initiatorId;

    /** 数据类型，多个类型以逗号分隔存储 */
    @TableField("data_types")
    private String dataTypes;

    /** 任务状态：PENDING, RUNNING, DONE, FAILED */
    private String status;

    /** 生成的导出文件路径 */
    @TableField("file_path")
    private String filePath;

    /** 下载令牌（UUID） */
    @TableField("download_token")
    private String downloadToken;

    /** 下载令牌过期时间 */
    @TableField("token_expires_at")
    private LocalDateTime tokenExpiresAt;

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
