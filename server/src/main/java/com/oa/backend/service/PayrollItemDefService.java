package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.PayrollItemDef;
import com.oa.backend.mapper.PayrollItemDefMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 工资项定义服务。
 * 职责：管理系统内置与自定义工资项定义（CRUD）。
 * 系统内置项（isSystem=true）code/type 受保护，不可删除。
 */
@Service
@RequiredArgsConstructor
public class PayrollItemDefService {

    private final PayrollItemDefMapper itemDefMapper;

    /**
     * 查询所有启用的工资项定义（未软删除），按显示顺序升序
     */
    public List<PayrollItemDef> listEnabled() {
        return itemDefMapper.selectList(
                new LambdaQueryWrapper<PayrollItemDef>()
                        .eq(PayrollItemDef::getIsEnabled, true)
                        .eq(PayrollItemDef::getDeleted, 0)
                        .orderByAsc(PayrollItemDef::getDisplayOrder));
    }

    /**
     * 根据 ID 查询工资项定义（含已软删除）；未找到或已软删除返回 null
     */
    public PayrollItemDef findById(Long id) {
        PayrollItemDef def = itemDefMapper.selectById(id);
        if (def == null || def.getDeleted() == 1) return null;
        return def;
    }

    /**
     * 校验 code 是否已被其他未删除的工资项占用
     */
    public boolean isCodeDuplicate(String code) {
        return itemDefMapper.selectOne(
                new LambdaQueryWrapper<PayrollItemDef>()
                        .eq(PayrollItemDef::getCode, code)
                        .eq(PayrollItemDef::getDeleted, 0)) != null;
    }

    /**
     * 创建自定义工资项定义（isSystem 固定为 false，isEnabled 默认 true）
     *
     * @param code         项目代码（唯一）
     * @param name         项目名称
     * @param type         类型（EARNING 或 DEDUCTION）
     * @param displayOrder 显示顺序
     * @return 创建后的实体
     */
    @Transactional
    public PayrollItemDef create(String code, String name, String type, Integer displayOrder) {
        PayrollItemDef def = new PayrollItemDef();
        def.setCode(code);
        def.setName(name);
        def.setType(type);
        def.setDisplayOrder(displayOrder != null ? displayOrder : 0);
        def.setIsEnabled(true);
        def.setIsSystem(false);
        def.setCreatedAt(LocalDateTime.now());
        def.setUpdatedAt(LocalDateTime.now());
        itemDefMapper.insert(def);
        return def;
    }

    /**
     * 更新工资项定义。
     * 系统内置项（isSystem=true）的 code/type 受保护（不在此更新，调用方应先校验）。
     *
     * @param id           工资项定义 ID
     * @param name         名称（null 表示不修改）
     * @param displayOrder 显示顺序（null 表示不修改）
     * @param isEnabled    是否启用（null 表示不修改）
     * @return 更新后的实体；未找到返回 null
     */
    @Transactional
    public PayrollItemDef update(Long id, String name, Integer displayOrder, Boolean isEnabled) {
        PayrollItemDef def = findById(id);
        if (def == null) return null;
        if (name != null) def.setName(name);
        if (displayOrder != null) def.setDisplayOrder(displayOrder);
        if (isEnabled != null) def.setIsEnabled(isEnabled);
        def.setUpdatedAt(LocalDateTime.now());
        itemDefMapper.updateById(def);
        return def;
    }

    /**
     * 软删除工资项定义。
     * 系统内置项不可删除，调用方应在调用前校验 isSystem。
     *
     * @param id 工资项定义 ID
     * @return true 删除成功，false 未找到
     */
    @Transactional
    public boolean delete(Long id) {
        PayrollItemDef def = findById(id);
        if (def == null) return false;
        itemDefMapper.deleteById(id);
        return true;
    }
}
