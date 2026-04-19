package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;
import lombok.Data;

/** 角色实体类，对应数据表 sys_role */
@Data
@TableName("sys_role")
public class Role {

  /** 角色主键 ID */
  @TableId(type = IdType.AUTO)
  private Long id;

  /** 角色编码 */
  private String roleCode;

  /** 角色名称 */
  private String roleName;

  /** 角色描述 */
  private String description;

  /** 是否系统预设角色 */
  private Integer isSystem;

  /** 状态 */
  private Integer status;

  /** 创建时间 */
  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createTime;

  /** 更新时间 */
  @TableField(fill = FieldFill.INSERT_UPDATE)
  private LocalDateTime updateTime;

  /** 逻辑删除标志 */
  @TableLogic private Integer deleted;
}
