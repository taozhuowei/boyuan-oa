package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;
import lombok.Data;

/** 部门实体类，对应数据表 department */
@Data
@TableName("department")
public class Department {

  /** 部门主键 ID */
  @TableId(type = IdType.AUTO)
  private Long id;

  /** 上级部门 ID */
  private Long parentId;

  /** 部门名称 */
  private String name;

  /** 排序号 */
  private Integer sort;

  /** 创建时间 */
  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createdAt;

  /** 更新时间 */
  @TableField(fill = FieldFill.INSERT_UPDATE)
  private LocalDateTime updatedAt;

  /** 逻辑删除标志 */
  @TableLogic private Integer deleted;
}
