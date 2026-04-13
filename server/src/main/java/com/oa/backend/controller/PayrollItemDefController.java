package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.PayrollItemDef;
import com.oa.backend.mapper.PayrollItemDefMapper;
import com.oa.backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 工资项定义控制器
 * 职责：管理系统内置与自定义工资项定义（Finance 可操作自定义项）。
 *
 * 数据流：
 * - 读取：所有认证用户可查询启用的工资项定义列表
 * - 写入：Finance 角色可创建、更新、软删除自定义项（isSystem=false）
 * - 系统内置项（isSystem=true）受保护，不可修改 code/type，不可删除
 *
 * 路由概览：
 * - GET    /payroll/item-defs           查询所有启用的工资项定义（所有认证用户）
 * - POST   /payroll/item-defs           创建自定义工资项定义（FINANCE only，isSystem=false）
 * - PUT    /payroll/item-defs/{id}      更新工资项定义（FINANCE only，不能修改系统项的 code/type）
 * - DELETE /payroll/item-defs/{id}      软删除工资项定义（FINANCE only，不能删除系统项）
 */
@RestController
@RequestMapping("/payroll/item-defs")
@RequiredArgsConstructor
public class PayrollItemDefController {

    private final PayrollItemDefMapper itemDefMapper;

    /**
     * 查询所有启用的工资项定义，按显示顺序升序返回。
     * 权限：所有认证用户
     *
     * 数据流：查询 payroll_item_def 表中 is_enabled=true 且 deleted=0 的记录
     *
     * @return 启用的工资项定义列表
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PayrollItemDef>> listEnabledDefs() {
        List<PayrollItemDef> defs = itemDefMapper.selectList(
                new LambdaQueryWrapper<PayrollItemDef>()
                        .eq(PayrollItemDef::getIsEnabled, true)
                        .eq(PayrollItemDef::getDeleted, 0)
                        .orderByAsc(PayrollItemDef::getDisplayOrder)
        );
        return ResponseEntity.ok(defs);
    }

    /**
     * 创建自定义工资项定义。
     * 权限：FINANCE only
     * 约束：isSystem 强制设为 false（只允许创建自定义项）
     *
     * 数据流：
     * 1. 校验 code 唯一性
     * 2. 强制设置 isSystem=false, isEnabled=true（默认启用）
     * 3. 插入数据库
     *
     * @param request 创建请求体（code, name, type, displayOrder）
     * @return 创建后的工资项定义
     */
    @PostMapping
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<?> createDef(@RequestBody CreateDefRequest request) {
        if (request.code() == null || request.code().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "code 不能为空"));
        }
        if (request.name() == null || request.name().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "name 不能为空"));
        }
        if (request.type() == null || request.type().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "type 不能为空（EARNING 或 DEDUCTION）"));
        }

        // 校验 code 唯一性
        PayrollItemDef existing = itemDefMapper.selectOne(
                new LambdaQueryWrapper<PayrollItemDef>()
                        .eq(PayrollItemDef::getCode, request.code())
                        .eq(PayrollItemDef::getDeleted, 0)
        );
        if (existing != null) {
            return ResponseEntity.badRequest().body(Map.of("message", "code 已存在: " + request.code()));
        }

        PayrollItemDef def = new PayrollItemDef();
        def.setCode(request.code());
        def.setName(request.name());
        def.setType(request.type());
        def.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        def.setIsEnabled(true);
        def.setIsSystem(false);
        def.setCreatedAt(LocalDateTime.now());
        def.setUpdatedAt(LocalDateTime.now());

        itemDefMapper.insert(def);
        return ResponseEntity.ok(def);
    }

    /**
     * 更新工资项定义。
     * 权限：FINANCE only
     * 约束：不能修改系统内置项（isSystem=true）的 code 和 type
     *
     * 数据流：
     * 1. 查询目标定义
     * 2. 检查是否为系统项，若是则拒绝修改 code/type
     * 3. 更新允许的字段（name, displayOrder, isEnabled）
     *
     * @param id      工资项定义 ID
     * @param request 更新请求体（name, displayOrder, isEnabled）
     * @return 更新后的工资项定义
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<?> updateDef(@PathVariable Long id, @RequestBody UpdateDefRequest request) {
        PayrollItemDef def = itemDefMapper.selectById(id);
        if (def == null || def.getDeleted() == 1) {
            return ResponseEntity.notFound().build();
        }

        // 系统内置项保护：不能修改 code 和 type
        if (Boolean.TRUE.equals(def.getIsSystem())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "系统内置项不能修改（code 和 type 受保护）"
            ));
        }

        // 更新允许的字段
        if (request.name() != null) {
            def.setName(request.name());
        }
        if (request.displayOrder() != null) {
            def.setDisplayOrder(request.displayOrder());
        }
        if (request.isEnabled() != null) {
            def.setIsEnabled(request.isEnabled());
        }
        def.setUpdatedAt(LocalDateTime.now());

        itemDefMapper.updateById(def);
        return ResponseEntity.ok(def);
    }

    /**
     * 软删除工资项定义。
     * 权限：FINANCE only
     * 约束：不能删除系统内置项（isSystem=true）
     *
     * 数据流：
     * 1. 查询目标定义
     * 2. 检查是否为系统项，若是则拒绝删除
     * 3. 执行软删除（MyBatis-Plus @TableLogic）
     *
     * @param id 工资项定义 ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<?> deleteDef(@PathVariable Long id) {
        PayrollItemDef def = itemDefMapper.selectById(id);
        if (def == null || def.getDeleted() == 1) {
            return ResponseEntity.notFound().build();
        }

        // 系统内置项保护：不能删除
        if (Boolean.TRUE.equals(def.getIsSystem())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "系统内置项不能删除"
            ));
        }

        itemDefMapper.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "已删除", "id", id));
    }

    // ── Inner request records ─────────────────────────────────────────────

    /**
     * 创建工资项定义请求
     *
     * @param code          项目代码（唯一）
     * @param name          项目名称
     * @param type          类型（EARNING 或 DEDUCTION）
     * @param displayOrder  显示顺序
     */
    public record CreateDefRequest(String code, String name, String type, Integer displayOrder) {}

    /**
     * 更新工资项定义请求
     *
     * @param name          项目名称
     * @param displayOrder  显示顺序
     * @param isEnabled     是否启用
     */
    public record UpdateDefRequest(String name, Integer displayOrder, Boolean isEnabled) {}
}
