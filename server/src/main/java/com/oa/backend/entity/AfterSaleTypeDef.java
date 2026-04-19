package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;
import lombok.Data;

/** 售后问题类型定义，对应 after_sale_type_def 表。内置：QUALITY / CONSTRUCTION / NON_QUALITY。 */
@Data
@TableName("after_sale_type_def")
public class AfterSaleTypeDef {

  @TableId(type = IdType.AUTO)
  private Long id;

  private String code;
  private String name;

  @TableField("is_system")
  private Boolean isSystem;

  @TableField("is_enabled")
  private Boolean isEnabled;

  @TableField("display_order")
  private Integer displayOrder;

  @TableField("created_at")
  private LocalDateTime createdAt;

  @TableField("updated_at")
  private LocalDateTime updatedAt;

  @TableLogic private Integer deleted;
}
