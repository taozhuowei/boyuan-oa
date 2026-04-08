package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 工作项模板实体，对应 work_item_template 表
 * 数据来源：PM/CEO 创建，可派生子模板
 */
@Data
@TableName("work_item_template")
public class WorkItemTemplate {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 模板名称 */
    private String name;

    /** 关联项目 ID（可为空，表示通用模板） */
    private Long projectId;

    /** 创建人 ID */
    private Long createdBy;

    /** 工作项列表（JSON 数组：[{name, defaultUnit}]） */
    private String items;

    /** 派生自哪个模板 ID（派生时写入） */
    private Long derivedFrom;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
