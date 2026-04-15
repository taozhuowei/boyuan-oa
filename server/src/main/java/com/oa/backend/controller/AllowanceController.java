package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.AllowanceConfig;
import com.oa.backend.entity.AllowanceDef;
import com.oa.backend.mapper.AllowanceConfigMapper;
import com.oa.backend.mapper.AllowanceDefMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 补贴项（allowance_def）及三级覆盖配置（allowance_config）控制器。
 *
 * 读：所有认证用户可查 allowance_def 列表（前端下拉/展示用）；配置列表仅 HR/CEO 可查。
 * 写：HR / CEO。
 *
 * Routes:
 *   GET    /allowances                          列表（所有认证用户）
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

    private final AllowanceDefMapper defMapper;
    private final AllowanceConfigMapper configMapper;

    // ── allowance_def ────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AllowanceDef>> list() {
        return ResponseEntity.ok(defMapper.selectList(
                new LambdaQueryWrapper<AllowanceDef>()
                        .eq(AllowanceDef::getDeleted, 0)
                        .orderByAsc(AllowanceDef::getDisplayOrder)
        ));
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
        AllowanceDef existing = defMapper.selectOne(
                new LambdaQueryWrapper<AllowanceDef>()
                        .eq(AllowanceDef::getCode, req.code())
                        .eq(AllowanceDef::getDeleted, 0)
        );
        if (existing != null) {
            return ResponseEntity.badRequest().body(Map.of("message", "code 已存在: " + req.code()));
        }

        AllowanceDef def = new AllowanceDef();
        def.setCode(req.code());
        def.setName(req.name());
        def.setDescription(req.description());
        def.setDisplayOrder(req.displayOrder() != null ? req.displayOrder() : 0);
        def.setIsEnabled(req.isEnabled() == null || req.isEnabled());
        def.setIsSystem(false);
        def.setCreatedAt(LocalDateTime.now());
        def.setUpdatedAt(LocalDateTime.now());
        defMapper.insert(def);
        return ResponseEntity.ok(def);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CEO','HR')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody DefRequest req) {
        AllowanceDef def = defMapper.selectById(id);
        if (def == null || (def.getDeleted() != null && def.getDeleted() == 1)) {
            return ResponseEntity.notFound().build();
        }
        if (req.name() != null) def.setName(req.name());
        if (req.description() != null) def.setDescription(req.description());
        if (req.displayOrder() != null) def.setDisplayOrder(req.displayOrder());
        if (req.isEnabled() != null) def.setIsEnabled(req.isEnabled());
        def.setUpdatedAt(LocalDateTime.now());
        defMapper.updateById(def);
        return ResponseEntity.ok(def);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CEO','HR')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        AllowanceDef def = defMapper.selectById(id);
        if (def == null || (def.getDeleted() != null && def.getDeleted() == 1)) {
            return ResponseEntity.notFound().build();
        }
        if (Boolean.TRUE.equals(def.getIsSystem())) {
            return ResponseEntity.badRequest().body(Map.of("message", "系统内置项不可删除"));
        }
        defMapper.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "已删除", "id", id));
    }

    // ── allowance_config 三级覆盖 ────────────────────────────────────

    @GetMapping("/{id}/configs")
    @PreAuthorize("hasAnyRole('CEO','HR','FINANCE')")
    public ResponseEntity<List<AllowanceConfig>> listConfigs(@PathVariable Long id) {
        return ResponseEntity.ok(configMapper.selectList(
                new LambdaQueryWrapper<AllowanceConfig>()
                        .eq(AllowanceConfig::getAllowanceDefId, id)
                        .eq(AllowanceConfig::getDeleted, 0)
                        .orderByAsc(AllowanceConfig::getScope)
                        .orderByAsc(AllowanceConfig::getScopeTargetId)
        ));
    }

    /**
     * 批量覆盖保存该补贴项的所有三级配置（整表替换）。
     * 请求体为当前页保存的全部配置项；服务端会删除旧配置再插入新配置，保持一致性。
     */
    @PutMapping("/{id}/configs")
    @PreAuthorize("hasAnyRole('CEO','HR')")
    @Transactional
    public ResponseEntity<?> saveConfigs(@PathVariable Long id, @RequestBody List<ConfigItem> items) {
        AllowanceDef def = defMapper.selectById(id);
        if (def == null || (def.getDeleted() != null && def.getDeleted() == 1)) {
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

        // 软删旧的
        List<AllowanceConfig> old = configMapper.selectList(
                new LambdaQueryWrapper<AllowanceConfig>()
                        .eq(AllowanceConfig::getAllowanceDefId, id)
                        .eq(AllowanceConfig::getDeleted, 0)
        );
        for (AllowanceConfig o : old) {
            configMapper.deleteById(o.getId());
        }

        // 写入新的
        LocalDateTime now = LocalDateTime.now();
        for (ConfigItem it : items) {
            AllowanceConfig c = new AllowanceConfig();
            c.setAllowanceDefId(id);
            c.setScope(it.scope());
            c.setScopeTargetId(it.scopeTargetId());
            c.setAmount(it.amount());
            c.setCreatedAt(now);
            c.setUpdatedAt(now);
            configMapper.insert(c);
        }

        return ResponseEntity.ok(Map.of("message", "已保存", "count", items.size()));
    }

    // ── Request records ───────────────────────────────────────────────

    public record DefRequest(String code, String name, String description,
                             Integer displayOrder, Boolean isEnabled) {}

    public record ConfigItem(String scope, Long scopeTargetId, BigDecimal amount) {}
}
