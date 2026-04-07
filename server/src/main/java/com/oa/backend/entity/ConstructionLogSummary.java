package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 施工日志汇总实体，对应 construction_log_summary 表。
 * PM 生成汇总报告后写入，并通知 CEO。
 */
@Data
@TableName("construction_log_summary")
public class ConstructionLogSummary {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属项目 */
    private Long projectId;

    /** 汇报人（PM）员工 ID */
    private Long pmId;

    /** 汇总期间起始日 */
    private LocalDate periodStart;

    /** 汇总期间截止日 */
    private LocalDate periodEnd;

    /** 聚合工作项 JSON 文本 */
    private String aggregatedItems;

    /** 劳工出勤汇总 */
    private String workerSummary;

    /** 可视化组件配置 JSON */
    private String vizComponents;

    /** PM 备注 */
    private String pmNote;

    /** CEO 通知时间（null 表示尚未通知） */
    private LocalDateTime ceoNotifiedAt;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
