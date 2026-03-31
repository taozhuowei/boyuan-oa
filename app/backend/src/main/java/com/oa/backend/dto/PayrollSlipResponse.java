package com.oa.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 工资单响应 DTO
 */
public record PayrollSlipResponse(
    Long id,
    String slipNo,
    String cycleNo,
    String cycleName,
    Long employeeId,
    String employeeName,
    String department,
    Integer version,
    String status,
    List<PayrollItem> items,
    Double grossAmount,
    Double netAmount,
    LocalDateTime confirmTime,
    String confirmIp,
    String disputeReason,
    LocalDateTime createdAt
) {
    public record PayrollItem(
        String itemType,
        String itemName,
        Double amount,
        String description
    ) {
    }
}
