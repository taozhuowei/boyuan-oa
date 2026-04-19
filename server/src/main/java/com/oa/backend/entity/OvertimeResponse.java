package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;
import lombok.Data;

/** 加班响应实体，对应 overtime_response 表。 员工对加班通知的确认或拒绝记录。 */
@Data
@TableName("overtime_response")
public class OvertimeResponse {

  @TableId(type = IdType.AUTO)
  private Long id;

  /** 关联加班通知 ID */
  @TableField("notification_id")
  private Long notificationId;

  /** 响应员工 ID */
  @TableField("employee_id")
  private Long employeeId;

  /** true = 接受，false = 拒绝 */
  private Boolean accepted;

  /** 拒绝原因（仅 accepted=false 时填写） */
  @TableField("reject_reason")
  private String rejectReason;

  /** 拒绝审批状态（需直系领导审批）：PENDING / APPROVED / REJECTED */
  @TableField("reject_approval_status")
  private String rejectApprovalStatus;

  @TableField("created_at")
  private LocalDateTime createdAt;

  @TableField("updated_at")
  private LocalDateTime updatedAt;

  @TableLogic private Integer deleted;
}
