package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;
import lombok.Data;

/** 审批流定义实体类，对应数据表 approval_flow_def */
@Data
@TableName("approval_flow_def")
public class ApprovalFlowDef {

  /** 主键 ID */
  @TableId(type = IdType.AUTO)
  private Long id;

  /** 业务类型 */
  @TableField("business_type")
  private String businessType;

  /** 版本号 */
  private Integer version;

  /** 是否激活 */
  @TableField("is_active")
  private Boolean isActive;

  /** 创建时间 */
  @TableField("created_at")
  private LocalDateTime createdAt;

  /** 更新时间 */
  @TableField("updated_at")
  private LocalDateTime updatedAt;

  /** 逻辑删除标志 */
  @TableLogic private Integer deleted;
}
