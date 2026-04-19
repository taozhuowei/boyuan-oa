package com.oa.backend.controller;

import com.oa.backend.service.SystemConfigService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 系统配置控制器 职责：提供全局系统配置的读写接口，如考勤计量单位配置。
 *
 * <p>Routes: GET /config/attendance-unit — 读取考勤计量单位配置（请假/加班最小计量单位） POST /config/attendance-unit —
 * 更新考勤计量单位配置 GET /config/company-name — 读取企业名称 PUT /config/company-name — 更新企业名称 GET
 * /config/payroll-cycle — 读取发薪周期配置 PUT /config/payroll-cycle — 更新发薪周期配置 GET
 * /config/retention-period — 读取数据保留天数配置 PUT /config/retention-period — 更新数据保留天数配置
 */
@RestController
@RequestMapping("/config")
@RequiredArgsConstructor
public class SystemConfigController {

  private static final String KEY_LEAVE_UNIT = "attendance.leave.unit";
  private static final String KEY_OVERTIME_UNIT = "attendance.overtime.unit";

  /** 默认值：小时 */
  private static final String DEFAULT_UNIT = "HOUR";

  private final SystemConfigService systemConfigService;

  /** 获取考勤计量单位配置 权限：所有登录用户可查看 */
  @GetMapping("/attendance-unit")
  public ResponseEntity<AttendanceUnitConfig> getAttendanceUnit() {
    String leaveUnit = getConfigValue(KEY_LEAVE_UNIT, DEFAULT_UNIT);
    String overtimeUnit = getConfigValue(KEY_OVERTIME_UNIT, DEFAULT_UNIT);
    return ResponseEntity.ok(new AttendanceUnitConfig(leaveUnit, overtimeUnit));
  }

  /** 更新考勤计量单位配置 权限：HR 或 CEO */
  @PostMapping("/attendance-unit")
  @PreAuthorize("hasAnyRole('CEO')")
  public ResponseEntity<AttendanceUnitConfig> updateAttendanceUnit(
      @RequestBody AttendanceUnitUpdateRequest req) {
    if (req.leaveUnit() != null) {
      upsertConfig(KEY_LEAVE_UNIT, req.leaveUnit(), "请假最小计量单位（HOUR/HALF_DAY/DAY）");
    }
    if (req.overtimeUnit() != null) {
      upsertConfig(KEY_OVERTIME_UNIT, req.overtimeUnit(), "加班最小计量单位（HOUR/HALF_DAY/DAY）");
    }
    return getAttendanceUnit();
  }

  // ── Company name (A6.1) ────────────────────────────────────────────────

  /** 获取企业名称 权限：所有登录用户可查看 */
  @GetMapping("/company-name")
  public ResponseEntity<Map<String, String>> getCompanyName() {
    String value = getConfigValue("company_name", null);
    Map<String, String> result = new java.util.HashMap<>();
    result.put("companyName", value);
    return ResponseEntity.ok(result);
  }

  /** 更新企业名称 权限：CEO */
  @PutMapping("/company-name")
  @PreAuthorize("hasRole('CEO')")
  public ResponseEntity<Map<String, String>> updateCompanyName(
      @RequestBody Map<String, String> body) {
    String name = body.get("companyName");
    if (name == null || name.isBlank()) {
      return ResponseEntity.badRequest().build();
    }
    upsertConfig("company_name", name.trim(), "企业名称");
    return getCompanyName();
  }

  // ── Payroll cycle (A6.2) ───────────────────────────────────────────────

  /** 获取发薪周期配置 权限：CEO 或 FINANCE */
  @GetMapping("/payroll-cycle")
  @PreAuthorize("hasAnyRole('CEO','FINANCE')")
  public ResponseEntity<PayrollCycleConfig> getPayrollCycle() {
    int payday = Integer.parseInt(getConfigValue("payroll.payday", "15"));
    int settlementCutoff = Integer.parseInt(getConfigValue("payroll.settlement.cutoff", "5"));
    return ResponseEntity.ok(new PayrollCycleConfig(payday, settlementCutoff));
  }

  /** 更新发薪周期配置 权限：CEO */
  @PutMapping("/payroll-cycle")
  @PreAuthorize("hasRole('CEO')")
  public ResponseEntity<PayrollCycleConfig> updatePayrollCycle(
      @RequestBody PayrollCycleUpdateRequest req) {
    if (req.payday() != null) {
      if (req.payday() < 1 || req.payday() > 28) return ResponseEntity.badRequest().build();
      upsertConfig("payroll.payday", String.valueOf(req.payday()), "月发薪日（1-28）");
    }
    if (req.settlementCutoff() != null) {
      upsertConfig(
          "payroll.settlement.cutoff", String.valueOf(req.settlementCutoff()), "结算截止日（发薪日前 N 天）");
    }
    return getPayrollCycle();
  }

  // ── Retention period (A6.3) ────────────────────────────────────────────

  /** 获取数据保留天数配置 权限：CEO */
  @GetMapping("/retention-period")
  @PreAuthorize("hasAnyRole('CEO')")
  public ResponseEntity<RetentionPeriodConfig> getRetentionPeriod() {
    int days = Integer.parseInt(getConfigValue("data.retention.days", "1095"));
    return ResponseEntity.ok(new RetentionPeriodConfig(days));
  }

  /** 更新数据保留天数配置 权限：CEO */
  @PutMapping("/retention-period")
  @PreAuthorize("hasRole('CEO')")
  public ResponseEntity<RetentionPeriodConfig> updateRetentionPeriod(
      @RequestBody RetentionPeriodUpdateRequest req) {
    if (req.days() != null && req.days() >= 365) {
      upsertConfig("data.retention.days", String.valueOf(req.days()), "数据保留天数");
    }
    return getRetentionPeriod();
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private String getConfigValue(String key, String defaultValue) {
    return systemConfigService.getConfigValue(key, defaultValue);
  }

  private void upsertConfig(String key, String value, String description) {
    systemConfigService.upsertConfig(key, value, description);
  }

  // ── Request / Response types ─────────────────────────────────────────

  public record PayrollCycleConfig(int payday, int settlementCutoff) {}

  public record PayrollCycleUpdateRequest(Integer payday, Integer settlementCutoff) {}

  public record RetentionPeriodConfig(int days) {}

  public record RetentionPeriodUpdateRequest(Integer days) {}

  public record AttendanceUnitConfig(String leaveUnit, String overtimeUnit) {}

  public record AttendanceUnitUpdateRequest(String leaveUnit, String overtimeUnit) {}
}
