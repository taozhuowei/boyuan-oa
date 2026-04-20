package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * 加班表单数据 DTO — C+-F-07
 *
 * <p>用于从 FormSubmitRequest.formData (Map) 反序列化后执行字段校验。 跨字段校验：endTime > startTime（解析为 LocalTime
 * 后比较）。
 */
public record OvertimeFormData(
    @NotNull(message = "请选择加班日期") LocalDate date,
    @NotBlank(message = "请选择开始时间")
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "开始时间格式不正确（HH:mm）")
        String startTime,
    @NotBlank(message = "请选择结束时间")
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "结束时间格式不正确（HH:mm）")
        String endTime,
    BigDecimal hours,
    String type,
    String reason,
    List<Long> attachmentIds) {

  /** 跨字段校验：结束时间须晚于开始时间（解析 LocalTime 确保零填充无关）。由 Service 层调用。 */
  public void validateCrossFields() {
    if (startTime != null && endTime != null) {
      LocalTime start = LocalTime.parse(startTime);
      LocalTime end = LocalTime.parse(endTime);
      if (!end.isAfter(start)) {
        throw new IllegalArgumentException("结束时间须晚于开始时间");
      }
    }
  }
}
