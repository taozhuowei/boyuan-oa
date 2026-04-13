package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 表单记录实体类，对应数据表 form_record
 */
@Data
@TableName("form_record")
public class FormRecord {

    /** 主键 ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 表单类型 */
    @TableField("form_type")
    private String formType;

    /** 提交人 ID */
    @TableField("submitter_id")
    private Long submitterId;

    /** 目标员工 ID（如代填时） */
    @TableField("target_employee_id")
    private Long targetEmployeeId;

    /** 项目 ID */
    @TableField("project_id")
    private Long projectId;

    /** 表单数据（JSON 格式） */
    @TableField("form_data")
    private String formData;

    /** 状态：PENDING, APPROVING, APPROVED, REJECTED, ARCHIVED, RECALLED */
    private String status;

    /** 当前节点顺序 */
    @TableField("current_node_order")
    private Integer currentNodeOrder;

    /** 备注 */
    private String remark;

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
