package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 第二角色分配，对应 second_role_assignment 表。
 * project_id 在 project_bound=TRUE 的 def 下必填。
 * revoked=TRUE 表示已撤销；查询有效分配时排除。
 */
@Data
@TableName("second_role_assignment")
public class SecondRoleAssignment {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("employee_id")
    private Long employeeId;

    @TableField("role_code")
    private String roleCode;

    @TableField("project_id")
    private Long projectId;

    @TableField("assigned_by")
    private Long assignedBy;

    private Boolean revoked;

    @TableField("revoked_at")
    private LocalDateTime revokedAt;

    private String note;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
