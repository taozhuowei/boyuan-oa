package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;

/**
 * 结构化施工出勤记录，对应 construction_attendance 表。 设计 §8.4：保险成本按出勤天数 × daily_rate 自动累计；保险/工资聚合从此表查询，不再解析自由
 * JSON。
 *
 * <p>写入路径： - WorkLogController.submitLog → 解析 form_data.attendees + date 后批量插入 - PM/CEO 审批通过后亦可
 * manually backfill
 */
@Data
@TableName("construction_attendance")
public class ConstructionAttendance {

  @TableId(type = IdType.AUTO)
  private Long id;

  @TableField("project_id")
  private Long projectId;

  @TableField("employee_id")
  private Long employeeId;

  @TableField("attendance_date")
  private LocalDate attendanceDate;

  /** LOG / MANUAL / OT_SELF_REPORT */
  private String source;

  @TableField("source_form_id")
  private Long sourceFormId;

  @TableField("created_at")
  private LocalDateTime createdAt;

  @TableField("updated_at")
  private LocalDateTime updatedAt;

  @TableLogic private Integer deleted;
}
