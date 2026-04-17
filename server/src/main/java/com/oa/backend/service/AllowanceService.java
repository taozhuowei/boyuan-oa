package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.AllowanceConfig;
import com.oa.backend.entity.AllowanceDef;
import com.oa.backend.mapper.AllowanceConfigMapper;
import com.oa.backend.mapper.AllowanceDefMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 补贴项（allowance_def）及三级覆盖配置（allowance_config）CRUD 服务。
 * 负责补贴定义的创建、更新、软删除以及配置项的批量替换。
 * 补贴解析逻辑（三级优先级查找）由 AllowanceResolutionService 负责。
 */
@Service
@RequiredArgsConstructor
public class AllowanceService {

    private final AllowanceDefMapper defMapper;
    private final AllowanceConfigMapper configMapper;

    // ── AllowanceDef 管理 ────────────────────────────────────────────────────

    /**
     * 查询所有启用中的补贴定义（未软删除），按显示顺序升序
     */
    public List<AllowanceDef> listAllDefs() {
        return defMapper.selectList(
                new LambdaQueryWrapper<AllowanceDef>()
                        .eq(AllowanceDef::getDeleted, 0)
                        .orderByAsc(AllowanceDef::getDisplayOrder));
    }

    /**
     * 根据 ID 查询补贴定义（含已软删除）；未找到或已软删除返回 null
     */
    public AllowanceDef findDefById(Long id) {
        AllowanceDef def = defMapper.selectById(id);
        if (def == null || (def.getDeleted() != null && def.getDeleted() == 1)) {
            return null;
        }
        return def;
    }

    /**
     * 校验 code 是否已被其他未删除的补贴项占用
     */
    public boolean isCodeDuplicate(String code) {
        return defMapper.selectOne(
                new LambdaQueryWrapper<AllowanceDef>()
                        .eq(AllowanceDef::getCode, code)
                        .eq(AllowanceDef::getDeleted, 0)) != null;
    }

    /**
     * 创建自定义补贴定义（isSystem 固定为 false）
     *
     * @param code         补贴代码（唯一）
     * @param name         补贴名称
     * @param description  描述
     * @param displayOrder 显示顺序
     * @param isEnabled    是否启用
     * @return 创建后的实体
     */
    @Transactional
    public AllowanceDef createDef(String code, String name, String description,
                                  Integer displayOrder, Boolean isEnabled) {
        AllowanceDef def = new AllowanceDef();
        def.setCode(code);
        def.setName(name);
        def.setDescription(description);
        def.setDisplayOrder(displayOrder != null ? displayOrder : 0);
        def.setIsEnabled(isEnabled == null || isEnabled);
        def.setIsSystem(false);
        def.setCreatedAt(LocalDateTime.now());
        def.setUpdatedAt(LocalDateTime.now());
        defMapper.insert(def);
        return def;
    }

    /**
     * 更新补贴定义（仅允许修改 name/description/displayOrder/isEnabled）
     *
     * @param id           补贴定义 ID
     * @param name         名称（null 表示不修改）
     * @param description  描述（null 表示不修改）
     * @param displayOrder 显示顺序（null 表示不修改）
     * @param isEnabled    是否启用（null 表示不修改）
     * @return 更新后的实体；未找到返回 null
     */
    @Transactional
    public AllowanceDef updateDef(Long id, String name, String description,
                                  Integer displayOrder, Boolean isEnabled) {
        AllowanceDef def = findDefById(id);
        if (def == null) return null;
        if (name != null) def.setName(name);
        if (description != null) def.setDescription(description);
        if (displayOrder != null) def.setDisplayOrder(displayOrder);
        if (isEnabled != null) def.setIsEnabled(isEnabled);
        def.setUpdatedAt(LocalDateTime.now());
        defMapper.updateById(def);
        return def;
    }

    /**
     * 软删除补贴定义。系统内置项（isSystem=true）不可删除，调用方应在调用前校验。
     *
     * @param id 补贴定义 ID
     * @return true 删除成功，false 未找到
     */
    @Transactional
    public boolean deleteDef(Long id) {
        AllowanceDef def = findDefById(id);
        if (def == null) return false;
        defMapper.deleteById(id);
        return true;
    }

    // ── AllowanceConfig 管理 ─────────────────────────────────────────────────

    /**
     * 查询指定补贴项的所有有效配置项（未软删除），按 scope + scopeTargetId 升序
     */
    public List<AllowanceConfig> listConfigs(Long allowanceDefId) {
        return configMapper.selectList(
                new LambdaQueryWrapper<AllowanceConfig>()
                        .eq(AllowanceConfig::getAllowanceDefId, allowanceDefId)
                        .eq(AllowanceConfig::getDeleted, 0)
                        .orderByAsc(AllowanceConfig::getScope)
                        .orderByAsc(AllowanceConfig::getScopeTargetId));
    }

    /**
     * 批量替换指定补贴项的全部配置项（整表替换策略）。
     * 先物理删除旧配置，再插入新配置，保持一致性。
     *
     * @param allowanceDefId 补贴定义 ID
     * @param items          新配置项列表
     */
    @Transactional
    public void replaceConfigs(Long allowanceDefId, List<ConfigItem> items) {
        // 删除旧配置
        List<AllowanceConfig> old = configMapper.selectList(
                new LambdaQueryWrapper<AllowanceConfig>()
                        .eq(AllowanceConfig::getAllowanceDefId, allowanceDefId)
                        .eq(AllowanceConfig::getDeleted, 0));
        for (AllowanceConfig o : old) {
            configMapper.deleteById(o.getId());
        }
        // 插入新配置
        LocalDateTime now = LocalDateTime.now();
        for (ConfigItem it : items) {
            AllowanceConfig c = new AllowanceConfig();
            c.setAllowanceDefId(allowanceDefId);
            c.setScope(it.scope());
            c.setScopeTargetId(it.scopeTargetId());
            c.setAmount(it.amount());
            c.setCreatedAt(now);
            c.setUpdatedAt(now);
            configMapper.insert(c);
        }
    }

    /**
     * 配置项数据传输结构（controller → service）
     *
     * @param scope         作用域：GLOBAL / POSITION / EMPLOYEE
     * @param scopeTargetId POSITION 或 EMPLOYEE 对应的目标 ID；GLOBAL 时为 null
     * @param amount        金额（非负）
     */
    public record ConfigItem(String scope, Long scopeTargetId, BigDecimal amount) {}
}
