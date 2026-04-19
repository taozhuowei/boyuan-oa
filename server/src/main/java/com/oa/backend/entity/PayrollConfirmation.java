package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;
import lombok.Data;

/** 工资条确认存证实体，对应 payroll_confirmation 表。 员工通过电子签名确认工资条后，系统生成存证记录（含签名哈希、PDF路径等）。 */
@Data
@TableName("payroll_confirmation")
public class PayrollConfirmation {

  @TableId(type = IdType.AUTO)
  private Long id;

  /** 关联工资条 */
  private Long slipId;

  /** 确认员工 */
  private Long employeeId;

  /** 确认时间 */
  private LocalDateTime confirmedAt;

  /** 客户端 IP */
  private String clientIp;

  /** User-Agent */
  private String userAgent;

  /** 工资单内容哈希（SHA-256） */
  private String payrollContentHash;

  /** 签名哈希 */
  private String signatureHash;

  /** 确认协议版本 */
  private String agreementVersion;

  /** 存证 PDF 路径 */
  private String evidencePdfPath;

  @TableField("created_at")
  private LocalDateTime createdAt;

  @TableField("updated_at")
  private LocalDateTime updatedAt;
}
