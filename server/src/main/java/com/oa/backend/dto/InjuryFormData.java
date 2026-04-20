package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

/**
 * 工伤表单数据 DTO — C+-F-07
 *
 * <p>用于从 FormSubmitRequest.formData (Map) 反序列化后执行字段校验。
 */
public record InjuryFormData(
    @NotNull(message = "请选择受伤日期") LocalDate injuryDate,
    @NotBlank(message = "请选择受伤时间") String injuryTime,
    @NotBlank(message = "请填写事故经过") String description,
    @NotBlank(message = "请填写医生诊断") String diagnosis,
    List<Long> attachmentIds,
    String remark) {}
