package com.oa.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

/** 工作项模板响应 DTO */
public record WorkItemTemplateResponse(
    Long id,
    String name,
    Long projectId,
    Long createdBy,
    List<ItemDef> items,
    Long derivedFrom,
    LocalDateTime createdAt) {
  public record ItemDef(String name, String defaultUnit) {}
}
