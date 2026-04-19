package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

/** 创建备份任务请求 DTO */
public record BackupTaskCreateRequest(
    @NotBlank(message = "数据范围不能为空") String dataScope,
    String scopeId,
    String taskName,
    List<String> dataTypes,
    Boolean compress) {}
