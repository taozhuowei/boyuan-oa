package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;
import lombok.Data;

/** 工资项定义实体，对应 payroll_item_def 表。 系统内置项（is_system=true）不可删除；财务可新增自定义项。 */
@Data
@TableName("payroll_item_def")
public class PayrollItemDef {

  @TableId(type = IdType.AUTO)
  private Long id;

  /** 项目代码，唯一 */
  private String code;

  /** 项目名称 */
  private String name;

  /** 类型：EARNING（收入）| DEDUCTION（扣款） */
  private String type;

  /** 分类：EARNING（应发收入）| DEDUCTION（扣减项）| OTHER（其它）— 工资条分段展示 */
  private String category;

  /** 显示顺序 */
  private Integer displayOrder;

  /** 是否启用 */
  private Boolean isEnabled;

  /** 是否系统内置（不可删除） */
  private Boolean isSystem;

  @TableField("created_at")
  private LocalDateTime createdAt;

  @TableField("updated_at")
  private LocalDateTime updatedAt;

  @TableLogic private Integer deleted;
}
