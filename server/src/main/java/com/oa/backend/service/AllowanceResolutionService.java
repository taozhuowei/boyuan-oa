package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.AllowanceConfig;
import com.oa.backend.entity.AllowanceDef;
import com.oa.backend.entity.Employee;
import com.oa.backend.mapper.AllowanceConfigMapper;
import com.oa.backend.mapper.AllowanceDefMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * 补贴三级覆盖解析服务。
 * 解析顺序：EMPLOYEE > POSITION > GLOBAL。上层未命中则回落下一层，全部未命中则视为无该项补贴。
 */
@Service
@RequiredArgsConstructor
public class AllowanceResolutionService {

    private final AllowanceDefMapper allowanceDefMapper;
    private final AllowanceConfigMapper allowanceConfigMapper;

    /**
     * 解析单个员工所有已启用补贴项的最终金额。
     *
     * @param employee 员工（需含 id + position_id）
     * @return 该员工应享每一项补贴的结果列表（仅包含非零金额）
     */
    public List<Resolved> resolveForEmployee(Employee employee) {
        List<AllowanceDef> defs = allowanceDefMapper.selectList(
                new LambdaQueryWrapper<AllowanceDef>()
                        .eq(AllowanceDef::getIsEnabled, true)
                        .eq(AllowanceDef::getDeleted, 0)
                        .orderByAsc(AllowanceDef::getDisplayOrder)
        );

        List<Resolved> results = new ArrayList<>();
        for (AllowanceDef def : defs) {
            BigDecimal amount = resolveAmount(def.getId(), employee.getId(), employee.getPositionId());
            if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                results.add(new Resolved(def, amount));
            }
        }
        return results;
    }

    /**
     * 为指定 def + 员工 按三级覆盖返回金额。无命中返回 null。
     */
    public BigDecimal resolveAmount(Long allowanceDefId, Long employeeId, Long positionId) {
        AllowanceConfig emp = employeeId == null ? null : allowanceConfigMapper.selectOne(
                new LambdaQueryWrapper<AllowanceConfig>()
                        .eq(AllowanceConfig::getAllowanceDefId, allowanceDefId)
                        .eq(AllowanceConfig::getScope, "EMPLOYEE")
                        .eq(AllowanceConfig::getScopeTargetId, employeeId)
                        .eq(AllowanceConfig::getDeleted, 0)
                        .last("LIMIT 1")
        );
        if (emp != null) return emp.getAmount();

        AllowanceConfig pos = positionId == null ? null : allowanceConfigMapper.selectOne(
                new LambdaQueryWrapper<AllowanceConfig>()
                        .eq(AllowanceConfig::getAllowanceDefId, allowanceDefId)
                        .eq(AllowanceConfig::getScope, "POSITION")
                        .eq(AllowanceConfig::getScopeTargetId, positionId)
                        .eq(AllowanceConfig::getDeleted, 0)
                        .last("LIMIT 1")
        );
        if (pos != null) return pos.getAmount();

        AllowanceConfig glob = allowanceConfigMapper.selectOne(
                new LambdaQueryWrapper<AllowanceConfig>()
                        .eq(AllowanceConfig::getAllowanceDefId, allowanceDefId)
                        .eq(AllowanceConfig::getScope, "GLOBAL")
                        .isNull(AllowanceConfig::getScopeTargetId)
                        .eq(AllowanceConfig::getDeleted, 0)
                        .last("LIMIT 1")
        );
        return glob != null ? glob.getAmount() : null;
    }

    /** 解析结果：补贴定义 + 该员工应得金额 */
    public record Resolved(AllowanceDef def, BigDecimal amount) {}
}
