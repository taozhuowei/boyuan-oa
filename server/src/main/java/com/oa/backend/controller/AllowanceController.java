package com.oa.backend.controller;

import com.oa.backend.entity.AllowanceConfig;
import com.oa.backend.entity.AllowanceDef;
import com.oa.backend.service.AllowanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 补贴项（allowance_def）及三级覆盖配置（allowance_config）控制器。
 * 底层 Mapper 操作均委托给 AllowanceService。
 *
 * 读：allowance_def 及配置均属于薪资敏感数据，仅 CEO/HR/FINANCE 可查。
 * 写：HR / CEO。
 *
 * Routes:
 *   GET    /allowances                          列表（CEO/HR/FINANCE）
 *   POST   /allowances                          创建
 *   PUT    /allowances/{id}                     更新
 *   DELETE /allowances/{id}                     软删除（系统项不可删）
 *   GET    /allowances/{id}/configs             列出三级覆盖配置
 *   PUT    /allowances/{id}/configs             批量覆盖保存（整张表覆盖写入）
 */
@RestController
@RequestMapping("/allowances")
@RequiredArgsConstructor
public class AllowanceController {

    private final AllowanceService allowanceService;

    // ── allowance_def ────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('CEO','HR','FINANCE')")
    public ResponseEntity<List<AllowanceDef>> list() {
        return ResponseEntity.ok(allowanceService.listAllDefs());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CEO','HR')")
    public ResponseEntity<?> create(@RequestBody DefRequest req) {
        if (req.code() == null || req.code().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "code 不能为空"));
        }
        if (req.name() == null || req.name().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "name 不能为空"));
        }
        if (allowanceService.isCodeDuplicate(req.code())) {
            return ResponseEntity.badRequest().body(Map.of("message", "code 已存在: " + req.code()));
        }
        AllowanceDef def = allowanceService.createDef(
                req.code(), req.name(), req.description(), req.displayOrder(), req.isEnabled());
        return ResponseEntity.ok(def);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CEO','HR')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody DefRequest req) {
        AllowanceDef def = allowanceService.findDefById(id);
        if (def == null) {
            return ResponseEntity.notFound().build();
        }
        AllowanceDef updated = allowanceService.updateDef(
                id, req.name(), req.description(), req.displayOrder(), req.isEnabled());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CEO','HR')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        AllowanceDef def = allowanceService.findDefById(id);
        if (def == null) {
            return ResponseEntity.notFound().build();
        }
        if (Boolean.TRUE.equals(def.getIsSystem())) {
            return ResponseEntity.badRequest().body(Map.of("message", "系统内置项不可删除"));
        }
        allowanceService.deleteDef(id);
        return ResponseEntity.ok(Map.of("message", "已删除", "id", id));
    }

    // ── allowance_config 三级覆盖 ────────────────────────────────────

    @GetMapping("/{id}/configs")
    @PreAuthorize("hasAnyRole('CEO','HR','FINANCE')")
    public ResponseEntity<List<AllowanceConfig>> listConfigs(@PathVariable Long id) {
        return ResponseEntity.ok(allowanceService.listConfigs(id));
    }

    /**
     * 批量覆盖保存该补贴项的所有三级配置（整表替换）。
     * 请求体为当前页保存的全部配置项；服务端会删除旧配置再插入新配置，保持一致性。
     */
    @PutMapping("/{id}/configs")
    @PreAuthorize("hasAnyRole('CEO','HR')")
    public ResponseEntity<?> saveConfigs(@PathVariable Long id, @RequestBody List<ConfigItem> items) {
        AllowanceDef def = allowanceService.findDefById(id);
        if (def == null) {
            return ResponseEntity.notFound().build();
        }

        // 基础校验
        for (ConfigItem it : items) {
            if (it.scope() == null || !List.of("GLOBAL", "POSITION", "EMPLOYEE").contains(it.scope())) {
                return ResponseEntity.badRequest().body(Map.of("message", "scope 必须为 GLOBAL/POSITION/EMPLOYEE"));
            }
            if ("GLOBAL".equals(it.scope()) && it.scopeTargetId() != null) {
                return ResponseEntity.badRequest().body(Map.of("message", "GLOBAL 不允许指定 scopeTargetId"));
            }
            if (!"GLOBAL".equals(it.scope()) && it.scopeTargetId() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "POSITION/EMPLOYEE 必须指定 scopeTargetId"));
            }
            if (it.amount() == null || it.amount().compareTo(BigDecimal.ZERO) < 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "amount 必须为非负数"));
            }
        }

        // Convert controller records to service records
        List<AllowanceService.ConfigItem> serviceItems = items.stream()
                .map(it -> new AllowanceService.ConfigItem(it.scope(), it.scopeTargetId(), it.amount()))
                .toList();
        allowanceService.replaceConfigs(id, serviceItems);

        return ResponseEntity.ok(Map.of("message", "已保存", "count", items.size()));
    }

    // ── Request records ───────────────────────────────────────────────

    public record DefRequest(String code, String name, String description,
                             Integer displayOrder, Boolean isEnabled) {}

    public record ConfigItem(String scope, Long scopeTargetId, BigDecimal amount) {}
}
