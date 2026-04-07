package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 项目里程碑实体，对应 project_milestone 表。
 * 每个里程碑标记一个阶段性目标，完成后填写实际完成日期。
 */
@Data
@TableName("project_milestone")
public class ProjectMilestone {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属项目 */
    private Long projectId;

    /** 里程碑名称 */
    private String name;

    /** 排序序号（升序显示） */
    private Integer sort;

    /** 实际完成日期（null 表示未完成） */
    private LocalDate actualCompletionDate;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
