package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;

/** 项目实体类，对应数据表 project */
@Data
@TableName("project")
public class Project {

  /** 项目主键 ID */
  @TableId(type = IdType.AUTO)
  private Long id;

  /** 项目名称 */
  private String name;

  /** 状态：ACTIVE | CLOSED */
  private String status;

  /** 开始日期 */
  @TableField("start_date")
  private LocalDate startDate;

  /** 实际结束日期 */
  @TableField("actual_end_date")
  private LocalDate actualEndDate;

  /** 日志周期天数 */
  @TableField("log_cycle_days")
  private Integer logCycleDays;

  /** 日志报告周期天数 */
  @TableField("log_report_cycle_days")
  private Integer logReportCycleDays;

  @TableField("contract_no")
  private String contractNo;

  @TableField("contract_attachment_id")
  private Long contractAttachmentId;

  @TableField("client_name")
  private String clientName;

  @TableField("project_description")
  private String projectDescription;

  /** 工长劳工 ID（设计 §8.3 — 未指定 → PM 自填日志免审批，直接通知 CEO） */
  @TableField("foreman_employee_id")
  private Long foremanEmployeeId;

  /** 创建时间 */
  @TableField("created_at")
  private LocalDateTime createdAt;

  /** 更新时间 */
  @TableField("updated_at")
  private LocalDateTime updatedAt;

  /** 逻辑删除标志 */
  @TableLogic private Integer deleted;
}
