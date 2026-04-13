package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 工资条确认存证链实体，对应 evidence_chain 表。
 * 记录员工确认工资条的完整证据链，包含内容哈希、协议版本、PDF路径等。
 * 此表为审计记录，数据不可变，无 deleted 字段。
 *
 * @author OA Backend Team
 * @since 1.0.0
 */
@Data
@TableName("evidence_chain")
public class EvidenceChain {

    /**
     * 主键 ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 工资条 ID（外键关联 payroll_slip）
     */
    private Long slipId;

    /**
     * 员工 ID（外键关联 employee）
     */
    private Long employeeId;

    /**
     * 内容哈希（SHA-256，用于存证比对）
     * 由 employeeId + slipId + confirmedAt 计算得出
     */
    private String contentHash;

    /**
     * 确认时间戳
     */
    private LocalDateTime confirmedAt;

    /**
     * 协议版本号（如 "v1.0"）
     */
    private String agreementVersion;

    /**
     * 存证 PDF 文件路径
     */
    private String pdfPath;

    /**
     * 记录创建时间
     */
    private LocalDateTime createdAt;
}
