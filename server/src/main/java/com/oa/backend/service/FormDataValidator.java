package com.oa.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.dto.InjuryFormData;
import com.oa.backend.dto.LeaveFormData;
import com.oa.backend.dto.OvertimeFormData;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 表单数据字段校验服务 — C+-F-07
 *
 * <p>职责：将 FormSubmitRequest.formData (Map&lt;String,Object&gt;) 反序列化为对应 DTO，执行 Bean Validation
 * 字段校验及跨字段校验。 由 AttendanceController / WorkLogController 中的提交接口在序列化 JSON 前调用，确保请假、加班、工伤数据完整。
 *
 * <p>校验失败时抛出 IllegalArgumentException，由 GlobalExceptionHandler 转换为 HTTP 400。
 */
@Service
@RequiredArgsConstructor
public class FormDataValidator {

  private final ObjectMapper objectMapper;
  private final Validator validator;

  /** 校验请假表单数据。 */
  public void validateLeave(Map<String, Object> formData) {
    LeaveFormData dto = objectMapper.convertValue(formData, LeaveFormData.class);
    validateBean(dto);
    dto.validateCrossFields();
  }

  /** 校验加班表单数据。 */
  public void validateOvertime(Map<String, Object> formData) {
    OvertimeFormData dto = objectMapper.convertValue(formData, OvertimeFormData.class);
    validateBean(dto);
    dto.validateCrossFields();
  }

  /** 校验工伤表单数据。 */
  public void validateInjury(Map<String, Object> formData) {
    InjuryFormData dto = objectMapper.convertValue(formData, InjuryFormData.class);
    validateBean(dto);
  }

  private <T> void validateBean(T bean) {
    Set<ConstraintViolation<T>> violations = validator.validate(bean);
    if (!violations.isEmpty()) {
      String message =
          violations.stream().map(ConstraintViolation::getMessage).collect(Collectors.joining("；"));
      throw new IllegalArgumentException(message);
    }
  }
}
