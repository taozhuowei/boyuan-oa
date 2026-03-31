package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 表单记录实体类
 */
@Data
@TableName("biz_form_record")
public class FormRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String formNo;

    private String formType;

    private Long submitterId;

    private String submitterName;

    private String department;

    private LocalDateTime submitTime;

    private String status;

    private String currentNode;

    private String formData;

    private String history;

    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
