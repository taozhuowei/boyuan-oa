package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 项目成员实体类，对应数据表 project_member
 */
@Data
@TableName("project_member")
public class ProjectMember {

    /** 主键 ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 项目 ID */
    @TableField("project_id")
    private Long projectId;

    /** 员工 ID */
    @TableField("employee_id")
    private Long employeeId;

    /** 角色：PM | MEMBER */
    private String role;

    /** 创建时间 */
    @TableField("created_at")
    private LocalDateTime createdAt;

    /** 更新时间 */
    @TableField("updated_at")
    private LocalDateTime updatedAt;

    /** 逻辑删除标志 */
    @TableLogic
    private Integer deleted;
}
