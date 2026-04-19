package com.oa.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.FormRecord;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.TeamService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/team")
@RequiredArgsConstructor
public class TeamController {

  private final TeamService teamService;
  private final ObjectMapper objectMapper;

  @GetMapping("/members")
  @PreAuthorize("hasAnyRole('DEPARTMENT_MANAGER','PROJECT_MANAGER')")
  public ResponseEntity<List<TeamMemberResponse>> getTeamMembers(Authentication authentication) {
    Long managerId = SecurityUtils.getCurrentEmployeeId(authentication);
    if (managerId == null) {
      return ResponseEntity.ok(new ArrayList<>());
    }

    Employee manager = teamService.findEmployeeById(managerId);
    if (manager == null || manager.getDepartmentId() == null) {
      return ResponseEntity.ok(new ArrayList<>());
    }

    Long departmentId = manager.getDepartmentId();
    LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();

    List<Employee> members = teamService.listActiveDepartmentMembers(departmentId, managerId);

    List<TeamMemberResponse> result =
        members.stream()
            .map(
                emp -> {
                  TeamMemberResponse dto = new TeamMemberResponse();
                  dto.id = emp.getId();
                  dto.name = emp.getName();
                  dto.roleCode = emp.getRoleCode();
                  dto.employeeType = emp.getEmployeeType();
                  dto.accountStatus = emp.getAccountStatus();

                  double leaveDays = 0.0;
                  double overtimeHours = 0.0;

                  List<FormRecord> forms =
                      teamService.listApprovedLeaveAndOvertimeForms(emp.getId(), monthStart);

                  for (FormRecord form : forms) {
                    if (form.getFormData() == null || form.getFormData().isBlank()) {
                      continue;
                    }
                    try {
                      JsonNode node = objectMapper.readTree(form.getFormData());
                      if ("LEAVE".equals(form.getFormType())) {
                        leaveDays += node.path("leaveDays").asDouble(0.0);
                      } else if ("OVERTIME".equals(form.getFormType())) {
                        overtimeHours += node.path("hours").asDouble(0.0);
                      }
                    } catch (Exception e) {
                      // 保留原因：单条表单 JSON 解析失败不阻塞团队月度统计聚合，兜底为该条不计入
                      log.warn(
                          "TeamMembers: failed to parse form_data for formId={}, type={}",
                          form.getId(),
                          form.getFormType(),
                          e);
                    }
                  }

                  dto.thisMonthLeaveDays = leaveDays;
                  dto.thisMonthOvertimeHours = overtimeHours;
                  return dto;
                })
            .collect(Collectors.toList());

    return ResponseEntity.ok(result);
  }

  public static class TeamMemberResponse {
    public Long id;
    public String name;
    public String roleCode;
    public String employeeType;
    public String accountStatus;
    public double thisMonthLeaveDays;
    public double thisMonthOvertimeHours;
  }
}
