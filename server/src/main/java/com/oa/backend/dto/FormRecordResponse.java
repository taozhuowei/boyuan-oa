package com.oa.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 表单记录响应 DTO
 */
public record FormRecordResponse(
    Long id,
    String formNo,
    String formType,
    String formTypeName,
    String submitter,
    String department,
    LocalDateTime submitTime,
    String status,
    String currentNode,
    Map<String, Object> formData,
    List<ApprovalHistory> history,
    String remark
) {
    public record ApprovalHistory(
        String nodeName,
        String approver,
        String action,
        String comment,
        LocalDateTime time
    ) {
    }
}
