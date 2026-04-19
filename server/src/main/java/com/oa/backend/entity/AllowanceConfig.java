package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

/**
 * 补贴三级覆盖配置实体，对应 allowance_config 表。 scope: GLOBAL（scope_target_id 为 NULL）/ POSITION（scope_target_id
 * 为 position.id）/ EMPLOYEE（scope_target_id 为 employee.id）。 同一 (def_id, scope, target_id) 唯一有效；结算时按
 * EMPLOYEE > POSITION > GLOBAL 解析。
 */
@Data
@TableName("allowance_config")
public class AllowanceConfig {

  @TableId(type = IdType.AUTO)
  private Long id;

  @TableField("allowance_def_id")
  private Long allowanceDefId;

  /** 作用域：GLOBAL / POSITION / EMPLOYEE */
  private String scope;

  /** 作用域目标 ID（GLOBAL 时为 null） */
  @TableField("scope_target_id")
  private Long scopeTargetId;

  /** 金额（非负） */
  private BigDecimal amount;

  @TableField("created_at")
  private LocalDateTime createdAt;

  @TableField("updated_at")
  private LocalDateTime updatedAt;

  @TableLogic private Integer deleted;
}
