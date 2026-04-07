package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.SystemConfig;
import com.oa.backend.mapper.SystemConfigMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 系统配置控制器
 * 职责：提供全局系统配置的读写接口，如考勤计量单位配置。
 *
 * Routes:
 *   GET  /config/attendance-unit — 读取考勤计量单位配置（请假/加班最小计量单位）
 *   POST /config/attendance-unit — 更新考勤计量单位配置
 */
@RestController
@RequestMapping("/config")
@RequiredArgsConstructor
public class SystemConfigController {

    private static final String KEY_LEAVE_UNIT = "attendance.leave.unit";
    private static final String KEY_OVERTIME_UNIT = "attendance.overtime.unit";

    /** 默认值：小时 */
    private static final String DEFAULT_UNIT = "HOUR";

    private final SystemConfigMapper configMapper;

    /**
     * 获取考勤计量单位配置
     * 权限：所有登录用户可查看
     */
    @GetMapping("/attendance-unit")
    public ResponseEntity<AttendanceUnitConfig> getAttendanceUnit() {
        String leaveUnit = getConfigValue(KEY_LEAVE_UNIT, DEFAULT_UNIT);
        String overtimeUnit = getConfigValue(KEY_OVERTIME_UNIT, DEFAULT_UNIT);
        return ResponseEntity.ok(new AttendanceUnitConfig(leaveUnit, overtimeUnit));
    }

    /**
     * 更新考勤计量单位配置
     * 权限：HR 或 CEO
     */
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

    // ── Helpers ────────────────────────────────────────────────────────────

    private String getConfigValue(String key, String defaultValue) {
        SystemConfig config = configMapper.selectById(key);
        return config != null ? config.getConfigValue() : defaultValue;
    }

    private void upsertConfig(String key, String value, String description) {
        SystemConfig existing = configMapper.selectById(key);
        if (existing != null) {
            existing.setConfigValue(value);
            configMapper.updateById(existing);
        } else {
            SystemConfig config = new SystemConfig();
            config.setConfigKey(key);
            config.setConfigValue(value);
            config.setDescription(description);
            configMapper.insert(config);
        }
    }

    // ── Request / Response types ──────────────────────────────────────────

    public record AttendanceUnitConfig(String leaveUnit, String overtimeUnit) {}

    public record AttendanceUnitUpdateRequest(String leaveUnit, String overtimeUnit) {}
}
