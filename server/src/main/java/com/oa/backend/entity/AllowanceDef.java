package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 补贴项定义实体，对应 allowance_def 表。
 * 例如：餐补、交通补贴、住房补贴等。每项补贴可按 GLOBAL / POSITION / EMPLOYEE 三级配置金额。
 */
@Data
@TableName("allowance_def")
public class AllowanceDef {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 补贴代码，唯一 */
    private String code;

    /** 补贴名称（展示用） */
    private String name;

    /** 说明 */
    private String description;

    /** 显示顺序 */
    @TableField("display_order")
    private Integer displayOrder;

    /** 是否启用 */
    @TableField("is_enabled")
    private Boolean isEnabled;

    /** 是否系统内置（不可删除） */
    @TableField("is_system")
    private Boolean isSystem;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
