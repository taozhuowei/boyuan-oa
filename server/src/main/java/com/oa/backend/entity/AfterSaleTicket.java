package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;

/** 售后问题单，对应 after_sale_ticket 表。 项目结束后由"售后"第二角色员工处理；状态：PENDING / PROCESSING / CLOSED。 */
@Data
@TableName("after_sale_ticket")
public class AfterSaleTicket {

  @TableId(type = IdType.AUTO)
  private Long id;

  @TableField("project_id")
  private Long projectId;

  @TableField("type_code")
  private String typeCode;

  @TableField("incident_date")
  private LocalDate incidentDate;

  private String description;

  @TableField("customer_feedback")
  private String customerFeedback;

  private String resolution;

  @TableField("attachment_id")
  private Long attachmentId;

  private String status;

  @TableField("created_by")
  private Long createdBy;

  @TableField("handler_id")
  private Long handlerId;

  @TableField("closed_at")
  private LocalDateTime closedAt;

  @TableField("created_at")
  private LocalDateTime createdAt;

  @TableField("updated_at")
  private LocalDateTime updatedAt;

  @TableLogic private Integer deleted;
}
