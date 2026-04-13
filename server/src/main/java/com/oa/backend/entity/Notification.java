package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 通知实体类，对应数据表 notification。
 * <p>
 * 用于存储系统发送给用户的各类通知消息，包括审批提醒、工资条发布等。
 * 支持逻辑删除和已读状态追踪。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@Data
@TableName("notification")
public class Notification {

    /** 通知主键 ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 接收人 ID，关联 employee 表 */
    @TableField("recipient_id")
    private Long recipientId;

    /** 通知标题 */
    private String title;

    /** 通知内容 */
    private String content;

    /** 通知类型，如：APPROVAL, PAYROLL, SYSTEM */
    private String type;

    /** 关联业务类型，如：FORM_RECORD, PAYROLL_SLIP */
    @TableField("related_type")
    private String relatedType;

    /** 关联业务 ID */
    @TableField("related_id")
    private Long relatedId;

    /** 是否已读 */
    @TableField("is_read")
    private Boolean isRead;

    /** 创建时间 */
    @TableField("created_at")
    private LocalDateTime createdAt;

    /** 更新时间 */
    @TableField("updated_at")
    private LocalDateTime updatedAt;

    /** 逻辑删除标志，0=未删除，1=已删除 */
    @TableLogic
    private Integer deleted;
}
