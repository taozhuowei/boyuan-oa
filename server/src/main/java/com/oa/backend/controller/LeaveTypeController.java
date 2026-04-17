package com.oa.backend.controller;

import com.oa.backend.entity.LeaveTypeDef;
import com.oa.backend.service.LeaveTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 请假类型配置控制器
 * 职责：提供请假类型的增删改查接口，支持 HR 管理以及考勤表单下拉框使用。
 */
@RestController
@RequestMapping("/config/leave-types")
@RequiredArgsConstructor
public class LeaveTypeController {

    private final LeaveTypeService leaveTypeService;

    /**
     * 获取启用的请假类型列表（用于考勤表单下拉框）
     * 权限：无需认证
     */
    @GetMapping
    @ResponseBody
    public ResponseEntity<List<LeaveTypeDef>> getEnabledLeaveTypes() {
        return ResponseEntity.ok(leaveTypeService.listEnabledLeaveTypes());
    }

    /**
     * 获取全部请假类型列表（包含禁用项）
     * 权限：HR
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('HR')")
    @ResponseBody
    public ResponseEntity<List<LeaveTypeDef>> getAllLeaveTypes() {
        return ResponseEntity.ok(leaveTypeService.listAllLeaveTypes());
    }

    /**
     * 创建请假类型
     * 权限：HR
     */
    @PostMapping
    @PreAuthorize("hasRole('HR')")
    @ResponseBody
    public ResponseEntity<?> createLeaveType(@RequestBody LeaveTypeCreateRequest req) {
        if (leaveTypeService.existsByCode(req.code())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Leave type code already exists: " + req.code()));
        }
        LeaveTypeDef entity = leaveTypeService.createLeaveType(
                req.code(), req.name(), req.quotaDays(), req.deductionRate(), req.deductionBasis());
        return ResponseEntity.status(201).body(entity);
    }

    /**
     * 更新请假类型
     * 权限：HR
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    @ResponseBody
    public ResponseEntity<LeaveTypeDef> updateLeaveType(
            @PathVariable Long id,
            @RequestBody LeaveTypeUpdateRequest req) {
        LeaveTypeDef entity = leaveTypeService.findActiveById(id);
        if (entity == null) {
            return ResponseEntity.notFound().build();
        }
        LeaveTypeDef updated = leaveTypeService.updateLeaveType(
                entity, req.name(), req.quotaDays(), req.deductionRate(), req.deductionBasis(), req.isEnabled());
        return ResponseEntity.ok(updated);
    }

    /**
     * 删除请假类型（软删除）
     * 权限：HR
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    @ResponseBody
    public ResponseEntity<?> deleteLeaveType(@PathVariable Long id) {
        LeaveTypeDef entity = leaveTypeService.findActiveById(id);
        if (entity == null) {
            return ResponseEntity.notFound().build();
        }
        if (Boolean.TRUE.equals(entity.getIsSystem())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete system-defined leave type"));
        }
        leaveTypeService.deleteLeaveType(id);
        return ResponseEntity.noContent().build();
    }

    // ── Request / Response types ─────────────────────────────────────────

    public record LeaveTypeCreateRequest(
            String code,
            String name,
            Integer quotaDays,
            BigDecimal deductionRate,
            String deductionBasis) {
    }

    public record LeaveTypeUpdateRequest(
            String name,
            Integer quotaDays,
            BigDecimal deductionRate,
            String deductionBasis,
            Boolean isEnabled) {
    }
}
