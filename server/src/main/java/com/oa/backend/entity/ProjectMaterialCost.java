package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;

/** 项目实体成本，对应 project_material_cost 表。 由 PM 或持有"物资管理"第二角色的员工录入；含小计 quantity*unit_price 由前端展示，不存表。 */
@Data
@TableName("project_material_cost")
public class ProjectMaterialCost {

  @TableId(type = IdType.AUTO)
  private Long id;

  @TableField("project_id")
  private Long projectId;

  @TableField("item_name")
  private String itemName;

  private String spec;
  private BigDecimal quantity;
  private String unit;

  @TableField("unit_price")
  private BigDecimal unitPrice;

  @TableField("occurred_on")
  private LocalDate occurredOn;

  private String remark;

  @TableField("recorded_by")
  private Long recordedBy;

  @TableField("created_at")
  private LocalDateTime createdAt;

  @TableField("updated_at")
  private LocalDateTime updatedAt;

  @TableLogic private Integer deleted;
}
