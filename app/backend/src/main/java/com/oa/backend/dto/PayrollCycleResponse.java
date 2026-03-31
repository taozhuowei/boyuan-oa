package com.oa.backend.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * 工资周期响应 DTO
 */
public record PayrollCycleResponse(
    Long id,
    String cycleNo,
    String cycleName,
    LocalDate startDate,
    LocalDate endDate,
    String status,
    Integer version,
    Boolean locked,
    LocalDate precheckTime,
    LocalDate settleTime,
    Integer employeeCount,
    Double totalAmount
) {
}
