package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.LeaveTypeDef;
import com.oa.backend.mapper.LeaveTypeDefMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    private final LeaveTypeDefMapper leaveTypeDefMapper;

    /**
     * 获取启用的请假类型列表（用于考勤表单下拉框）
     * 权限：无需认证
     */
    @GetMapping
    @ResponseBody
    public ResponseEntity<List<LeaveTypeDef>> getEnabledLeaveTypes() {
        LambdaQueryWrapper<LeaveTypeDef> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LeaveTypeDef::getIsEnabled, true)
               .eq(LeaveTypeDef::getDeleted, 0)
               .orderByAsc(LeaveTypeDef::getDisplayOrder);
        return ResponseEntity.ok(leaveTypeDefMapper.selectList(wrapper));
    }

    /**
     * 获取全部请假类型列表（包含禁用项）
     * 权限：HR
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('HR')")
    @ResponseBody
    public ResponseEntity<List<LeaveTypeDef>> getAllLeaveTypes() {
        LambdaQueryWrapper<LeaveTypeDef> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LeaveTypeDef::getDeleted, 0)
               .orderByAsc(LeaveTypeDef::getDisplayOrder);
        return ResponseEntity.ok(leaveTypeDefMapper.selectList(wrapper));
    }

    /**
     * 创建请假类型
     * 权限：HR
     */
    @PostMapping
    @PreAuthorize("hasRole('HR')")
    @ResponseBody
    public ResponseEntity<?> createLeaveType(@RequestBody LeaveTypeCreateRequest req) {
        LambdaQueryWrapper<LeaveTypeDef> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LeaveTypeDef::getCode, req.code());
        if (leaveTypeDefMapper.selectCount(wrapper) > 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Leave type code already exists: " + req.code()));
        }

        LeaveTypeDef entity = new LeaveTypeDef();
        entity.setCode(req.code());
        entity.setName(req.name());
        entity.setQuotaDays(req.quotaDays());
        entity.setDeductionRate(req.deductionRate());
        entity.setDeductionBasis(req.deductionBasis());
        entity.setIsSystem(false);
        entity.setIsEnabled(true);
        entity.setDeleted(0);
        entity.setDisplayOrder(getNextDisplayOrder());
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());

        leaveTypeDefMapper.insert(entity);
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
        LeaveTypeDef entity = leaveTypeDefMapper.selectById(id);
        if (entity == null || entity.getDeleted() != 0) {
            return ResponseEntity.notFound().build();
        }

        if (req.name() != null) {
            entity.setName(req.name());
        }
        if (req.quotaDays() != null) {
            entity.setQuotaDays(req.quotaDays());
        }
        if (req.deductionRate() != null) {
            entity.setDeductionRate(req.deductionRate());
        }
        if (req.deductionBasis() != null) {
            entity.setDeductionBasis(req.deductionBasis());
        }
        if (req.isEnabled() != null) {
            entity.setIsEnabled(req.isEnabled());
        }
        entity.setUpdatedAt(LocalDateTime.now());

        leaveTypeDefMapper.updateById(entity);
        return ResponseEntity.ok(entity);
    }

    /**
     * 删除请假类型（软删除）
     * 权限：HR
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    @ResponseBody
    public ResponseEntity<?> deleteLeaveType(@PathVariable Long id) {
        LeaveTypeDef entity = leaveTypeDefMapper.selectById(id);
        if (entity == null || entity.getDeleted() != 0) {
            return ResponseEntity.notFound().build();
        }
        if (Boolean.TRUE.equals(entity.getIsSystem())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete system-defined leave type"));
        }
        leaveTypeDefMapper.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private Integer getNextDisplayOrder() {
        LambdaQueryWrapper<LeaveTypeDef> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(LeaveTypeDef::getDisplayOrder).last("LIMIT 1");
        LeaveTypeDef last = leaveTypeDefMapper.selectOne(wrapper);
        return last != null && last.getDisplayOrder() != null
                ? last.getDisplayOrder() + 1
                : 1;
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
