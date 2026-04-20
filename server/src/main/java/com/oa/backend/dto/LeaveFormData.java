package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 请假表单数据 DTO — C+-F-07
 *
 * <p>用于从 FormSubmitRequest.formData (Map) 反序列化后执行字段校验。 跨字段校验：endDate >= startDate。
 */
public record LeaveFormData(
    @NotBlank(message = "请选择假种") String leaveType,
    @NotNull(message = "请选择开始日期") LocalDate startDate,
    @NotNull(message = "请选择结束日期") LocalDate endDate,
    @NotBlank(message = "请填写请假原因") String reason,
    BigDecimal days,
    List<Long> attachmentIds) {

  /** 跨字段校验：结束日期不能早于开始日期。由 Service 层在 Validator.validate() 通过后手动调用。 */
  public void validateCrossFields() {
    if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
      throw new IllegalArgumentException("结束日期不能早于开始日期");
    }
  }
}
