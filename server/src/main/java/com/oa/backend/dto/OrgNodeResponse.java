package com.oa.backend.dto;

import java.util.List;

/**
 * 组织架构节点响应 DTO
 */
public record OrgNodeResponse(
    Long id,
    String employeeNo,
    String name,
    String roleCode,
    String roleName,
    Long departmentId,
    String departmentName,
    Long positionId,
    String positionName,
    Long directSupervisorId,
    List<OrgNodeResponse> children
) {}
