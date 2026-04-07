package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 员工电子签名实体，对应 employee_signature 表。
 * 存储员工绑定的手写签名（加密存储）和 PIN 哈希，用于工资条确认。
 */
@Data
@TableName("employee_signature")
public class EmployeeSignature {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 员工 ID（唯一） */
    private Long employeeId;

    /** 签名图片（AES 加密后的 base64 字符串） */
    private String signatureImageEncrypted;

    /** 签名内容哈希（SHA-256，用于存证比对） */
    private String signatureHash;

    /** PIN 哈希（bcrypt） */
    private String pinHash;

    /** 绑定时间 */
    private LocalDateTime boundAt;

    /** 最后使用的确认协议版本 */
    private String lastAgreementVersion;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
