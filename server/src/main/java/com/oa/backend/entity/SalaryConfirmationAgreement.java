package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 工资确认协议实体，对应 salary_confirmation_agreement 表。
 * 财务上传协议文件，员工确认工资条时需同意最新版本协议。
 */
@Data
@TableName("salary_confirmation_agreement")
public class SalaryConfirmationAgreement {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 协议版本号（如 "v1.0"） */
    private String version;

    /** 协议文件存储路径 */
    private String filePath;

    /** 协议内容（纯文本） */
    private String content;

    /** 上传人 */
    private Long uploadedBy;

    /** 是否为当前生效版本 */
    private Boolean isActive;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
