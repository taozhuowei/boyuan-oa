package com.oa.backend.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.dto.FormApprovalRequest;
import com.oa.backend.dto.FormRecordResponse;
import com.oa.backend.dto.FormSubmitRequest;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.FormRecord;
import com.oa.backend.entity.Project;
import com.oa.backend.service.ApprovalFlowService;
import com.oa.backend.service.ConstructionAttendanceService;
import com.oa.backend.service.FormDataValidator;
import com.oa.backend.service.FormService;
import com.oa.backend.service.NotificationService;
import com.oa.backend.service.WorkLogService;
import jakarta.validation.Valid;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 施工日志与工伤申报控制器 职责：处理劳工的施工日志提交与工伤申报，以及项目经理的审批操作。 使用 FormService + ApprovalFlowService 代替
 * OaDataService 内存实现。
 */
@Slf4j
@RestController
@RequestMapping("/logs")
@RequiredArgsConstructor
public class WorkLogController {

  private final FormService formService;
  private final ApprovalFlowService approvalFlowService;
  private final WorkLogService workLogService;
  private final ObjectMapper objectMapper;
  private final ConstructionAttendanceService attendanceService;
  private final NotificationService notificationService;
  // C+-F-07: 表单数据字段校验
  private final FormDataValidator formDataValidator;

  // FormService provides getDetail() to build a full response after status change

  /** 提交施工日志 权限：劳工（WORKER） */
  @PostMapping
  @PreAuthorize("hasAnyRole('WORKER','PROJECT_MANAGER','CEO')")
  public ResponseEntity<FormRecordResponse> submitLog(
      @Valid @RequestBody FormSubmitRequest request,
      @RequestHeader(value = "X-Idempotency-Key", required = false) String idemKey,
      Authentication authentication) {
    Long submitterId = getCurrentEmployeeId(authentication);
    if (submitterId == null) {
      return ResponseEntity.badRequest().build();
    }
    String formDataJson;
    try {
      formDataJson = objectMapper.writeValueAsString(request.formData());
    } catch (JsonProcessingException e) {
      log.warn("序列化 formData 失败 type={}", "LOG", e);
      return ResponseEntity.badRequest().build();
    }

    // 设计 §8.3：未配置工长 → PM 自填免审批，直接通知 CEO；否则走标准 LOG 审批流
    Long projectId = extractLong(request.formData(), "projectId");
    Project project = projectId != null ? workLogService.findProjectById(projectId) : null;
    boolean foremanAbsent = project != null && project.getForemanEmployeeId() == null;
    boolean submitterIsPm =
        authentication.getAuthorities().stream()
            .anyMatch(
                a ->
                    "ROLE_PROJECT_MANAGER".equals(a.getAuthority())
                        || "ROLE_CEO".equals(a.getAuthority()));

    FormRecordResponse resp;
    if (foremanAbsent && submitterIsPm) {
      // 直接创建 APPROVED form_record（无 approval flow），写入出勤，通知 CEO
      FormRecord fr = new FormRecord();
      fr.setFormType("LOG");
      fr.setSubmitterId(submitterId);
      fr.setFormData(formDataJson);
      fr.setStatus("APPROVED");
      fr.setCurrentNodeOrder(0);
      fr.setRemark(request.remark());
      fr.setIdemKey(idemKey);
      fr.setCreatedAt(java.time.LocalDateTime.now());
      fr.setUpdatedAt(java.time.LocalDateTime.now());
      fr.setDeleted(0);
      workLogService.saveFormRecord(fr);
      attendanceService.recordFromLogForm(fr, projectId, "LOG");
      notifyCeoOfPmSelfLog(projectId, fr.getId(), submitterId);
      resp = formService.getDetail(fr.getId(), submitterId);
    } else {
      resp = formService.submitForm(submitterId, "LOG", formDataJson, request.remark(), idemKey);
      // 标准流程：先按 PENDING/APPROVING 写入出勤；驳回后通过 softDeleteByForm 撤回
      if (projectId != null && resp != null) {
        FormRecord persisted = workLogService.findFormRecordById(resp.id());
        if (persisted != null) attendanceService.recordFromLogForm(persisted, projectId, "LOG");
      }
    }
    return ResponseEntity.ok(resp);
  }

  private Long extractLong(java.util.Map<String, Object> data, String key) {
    if (data == null) return null;
    Object v = data.get(key);
    if (v == null) return null;
    if (v instanceof Number n) return n.longValue();
    try {
      return Long.parseLong(v.toString());
    } catch (NumberFormatException e) {
      return null;
    }
  }

  private void notifyCeoOfPmSelfLog(Long projectId, Long formId, Long submitterId) {
    try {
      List<Employee> ceos = workLogService.listCeoEmployees();
      for (Employee c : ceos) {
        notificationService.send(
            c.getId(),
            "PM 自填施工日志",
            String.format("项目 #%s 由 PM #%s 自填日志（无工长，无需审批）", projectId, submitterId),
            "SYSTEM",
            "FORM_RECORD",
            formId);
      }
    } catch (Exception e) {
      // 保留原因：异步通知 CEO 失败不应影响施工日志提交主流程
      log.warn("PmSelfLog: failed to notify CEO, projectId={}, formId={}", projectId, formId, e);
    }
  }

  /** 提交工伤申报 权限：劳工（WORKER）或项目经理（PROJECT_MANAGER 代录，触发 skipCondition 跳过 PM Review） */
  @PostMapping("/injury")
  @PreAuthorize("hasAnyRole('WORKER','PROJECT_MANAGER','CEO')")
  public ResponseEntity<FormRecordResponse> submitInjury(
      @Valid @RequestBody FormSubmitRequest request,
      @RequestHeader(value = "X-Idempotency-Key", required = false) String idemKey,
      Authentication authentication) {
    Long submitterId = getCurrentEmployeeId(authentication);
    if (submitterId == null) {
      return ResponseEntity.badRequest().build();
    }

    // C+-F-07: 校验工伤表单数据字段（抛 IllegalArgumentException → 400）
    formDataValidator.validateInjury(request.formData());

    String formDataJson;
    try {
      formDataJson = objectMapper.writeValueAsString(request.formData());
    } catch (JsonProcessingException e) {
      log.warn("序列化 formData 失败 type={}", "INJURY", e);
      return ResponseEntity.badRequest().build();
    }
    return ResponseEntity.ok(
        formService.submitForm(submitterId, "INJURY", formDataJson, request.remark(), idemKey));
  }

  /** 获取记录列表 WORKER: 查看本人提交的施工日志/工伤申报 PROJECT_MANAGER: 查看所有相关记录（CEO 也可查看） */
  @GetMapping("/records")
  @PreAuthorize("hasAnyRole('WORKER','PROJECT_MANAGER','CEO','FINANCE')")
  public ResponseEntity<List<FormRecordResponse>> getRecords(Authentication authentication) {
    Long currentEmployeeId = getCurrentEmployeeId(authentication);
    if (currentEmployeeId == null) {
      return ResponseEntity.badRequest().build();
    }
    String roleCode = getCurrentRoleCode(authentication);
    return ResponseEntity.ok(
        formService.getHistory(currentEmployeeId, roleCode, Arrays.asList("LOG", "INJURY")));
  }

  /** 获取待审批列表 权限：项目经理（PROJECT_MANAGER） */
  @GetMapping("/todo")
  @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
  public ResponseEntity<List<FormRecordResponse>> getTodoList(Authentication authentication) {
    Long currentEmployeeId = getCurrentEmployeeId(authentication);
    if (currentEmployeeId == null) {
      return ResponseEntity.badRequest().build();
    }
    return ResponseEntity.ok(approvalFlowService.getTodo(currentEmployeeId));
  }

  /** 审批通过 权限：项目经理（PROJECT_MANAGER） */
  @PostMapping("/{id}/approve")
  @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
  public ResponseEntity<FormRecordResponse> approve(
      @PathVariable Long id,
      @Valid @RequestBody FormApprovalRequest request,
      Authentication authentication) {
    Long currentEmployeeId = getCurrentEmployeeId(authentication);
    if (currentEmployeeId == null) {
      return ResponseEntity.badRequest().build();
    }
    return ResponseEntity.ok(
        approvalFlowService.advance(id, currentEmployeeId, "APPROVE", request.comment()));
  }

  /** 审批驳回 权限：项目经理（PROJECT_MANAGER） */
  @PostMapping("/{id}/reject")
  @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
  public ResponseEntity<FormRecordResponse> reject(
      @PathVariable Long id,
      @Valid @RequestBody FormApprovalRequest request,
      Authentication authentication) {
    Long currentEmployeeId = getCurrentEmployeeId(authentication);
    if (currentEmployeeId == null) {
      return ResponseEntity.badRequest().build();
    }
    return ResponseEntity.ok(
        approvalFlowService.advance(id, currentEmployeeId, "REJECT", request.comment()));
  }

  /**
   * 提交施工日志（支持 workItems 动态列表） 功能等同于 POST /logs，但路径语义更清晰；workItems 字段会被序列化进 formData 权限：劳工（WORKER）
   */
  @PostMapping("/construction-logs")
  @PreAuthorize("hasRole('WORKER')")
  public ResponseEntity<FormRecordResponse> submitConstructionLog(
      @Valid @RequestBody FormSubmitRequest request,
      @RequestHeader(value = "X-Idempotency-Key", required = false) String idemKey,
      Authentication authentication) {
    Long submitterId = getCurrentEmployeeId(authentication);
    if (submitterId == null) {
      return ResponseEntity.badRequest().build();
    }
    String formDataJson;
    try {
      formDataJson = objectMapper.writeValueAsString(request.formData());
    } catch (JsonProcessingException e) {
      log.warn("序列化 formData 失败 type={}", "LOG", e);
      return ResponseEntity.badRequest().build();
    }
    return ResponseEntity.ok(
        formService.submitForm(submitterId, "LOG", formDataJson, request.remark(), idemKey));
  }

  /** PM 批注施工日志（不影响审批状态，仅写入 pmNote 字段） 权限：PROJECT_MANAGER / CEO */
  @PatchMapping("/construction-logs/{id}/review")
  @PreAuthorize("hasAnyRole('PROJECT_MANAGER','CEO')")
  public ResponseEntity<Void> reviewLog(
      @PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
    FormRecord record = workLogService.findFormRecordById(id);
    if (record == null) {
      return ResponseEntity.notFound().build();
    }
    // pmNote 写入 remark 字段（不影响审批流程）
    String pmNote = body.getOrDefault("pmNote", "");
    record.setRemark(pmNote);
    record.setUpdatedAt(java.time.LocalDateTime.now());
    workLogService.updateFormRecord(record);
    return ResponseEntity.noContent().build();
  }

  /** CEO 追溯驳回施工日志（APPROVED → RECALLED） 权限：CEO */
  @PostMapping("/construction-logs/{id}/recall")
  @PreAuthorize("hasRole('CEO')")
  public ResponseEntity<FormRecordResponse> recallLog(
      @PathVariable Long id,
      @RequestBody(required = false) java.util.Map<String, String> body,
      Authentication authentication) {
    FormRecord record = workLogService.findFormRecordById(id);
    if (record == null) {
      return ResponseEntity.notFound().build();
    }
    if (!"APPROVED".equals(record.getStatus())) {
      return ResponseEntity.badRequest().build();
    }
    record.setStatus("RECALLED");
    record.setUpdatedAt(java.time.LocalDateTime.now());
    workLogService.updateFormRecord(record);
    Long ceoId = workLogService.resolveEmployeeId(authentication);
    return ResponseEntity.ok(formService.getDetail(id, ceoId));
  }

  private Long getCurrentEmployeeId(Authentication authentication) {
    return workLogService.resolveEmployeeId(authentication);
  }

  private String getCurrentRoleCode(Authentication authentication) {
    return workLogService.resolveRoleCode(authentication);
  }
}
