package com.oa.backend.dto;

import java.util.List;

/** 表单配置响应 DTO */
public record FormConfigResponse(
    String formType,
    String formName,
    List<FormField> fields,
    List<FormAction> actions,
    ApprovalFlow flow) {
  public record FormField(
      String fieldCode,
      String fieldName,
      String fieldType,
      Boolean required,
      String defaultValue,
      List<String> options,
      String placeholder,
      Integer order) {}

  public record FormAction(
      String actionCode, String actionName, String style, List<String> requiredRoles) {}

  public record ApprovalFlow(String type, List<FlowNode> nodes) {
    public record FlowNode(String nodeCode, String nodeName, String handlerRole, Integer order) {}
  }
}
