package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;
import lombok.Data;

/**
 * 第二角色定义，对应 second_role_def 表。 系统内置：AFTER_SALES（员工，售后）/ MATERIAL_MANAGER（员工，物资管理）/ FOREMAN（劳工，工长）。
 * project_bound=TRUE 表示分配时必须绑定项目；否则可全局生效。
 */
@Data
@TableName("second_role_def")
public class SecondRoleDef {

  @TableId(type = IdType.AUTO)
  private Long id;

  private String code;
  private String name;

  /** 适用员工类别：OFFICE / LABOR */
  @TableField("applies_to")
  private String appliesTo;

  @TableField("project_bound")
  private Boolean projectBound;

  private String description;

  @TableField("is_system")
  private Boolean isSystem;

  @TableField("is_enabled")
  private Boolean isEnabled;

  @TableField("created_at")
  private LocalDateTime createdAt;

  @TableField("updated_at")
  private LocalDateTime updatedAt;

  @TableLogic private Integer deleted;
}
