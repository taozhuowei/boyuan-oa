package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;
import lombok.Data;

/** 附件元数据实体，对应 attachment_meta 表 存储上传文件的路径、类型、大小等元信息；不含 deleted 字段 */
@Data
@TableName("attachment_meta")
public class AttachmentMeta {

  @TableId(type = IdType.AUTO)
  private Long id;

  /** 关联的业务类型（如 LOG、INJURY） */
  private String businessType;

  /** 关联的业务记录 ID */
  private Long businessId;

  /** 原始文件名 */
  private String fileName;

  /** 存储路径（相对于上传根目录） */
  private String storagePath;

  /** 文件 MD5（用于去重） */
  private String fileMd5;

  /** 文件大小（字节） */
  private Long fileSize;

  /** MIME 类型 */
  private String mimeType;

  /** 上传人 ID */
  private Long uploadedBy;

  /** 上传时间 */
  private LocalDateTime uploadedAt;
}
