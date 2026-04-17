package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.LeaveTypeDef;
import com.oa.backend.mapper.LeaveTypeDefMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 请假类型服务
 * 职责：封装请假类型定义（LeaveTypeDef）的增删改查逻辑，
 *      供 LeaveTypeController 调用，隔离控制器与持久层细节。
 */
@Service
@RequiredArgsConstructor
public class LeaveTypeService {

    private final LeaveTypeDefMapper leaveTypeDefMapper;

    /**
     * 查询启用中的请假类型列表（用于考勤表单下拉框）。
     * 结果按 displayOrder 升序排列，已软删除的记录不返回。
     *
     * @return 启用状态的请假类型列表
     */
    public List<LeaveTypeDef> listEnabledLeaveTypes() {
        LambdaQueryWrapper<LeaveTypeDef> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LeaveTypeDef::getIsEnabled, true)
               .eq(LeaveTypeDef::getDeleted, 0)
               .orderByAsc(LeaveTypeDef::getDisplayOrder);
        return leaveTypeDefMapper.selectList(wrapper);
    }

    /**
     * 查询全部请假类型（含禁用项），供 HR 管理界面使用。
     * 结果按 displayOrder 升序排列，已软删除的记录不返回。
     *
     * @return 所有未删除的请假类型列表
     */
    public List<LeaveTypeDef> listAllLeaveTypes() {
        LambdaQueryWrapper<LeaveTypeDef> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LeaveTypeDef::getDeleted, 0)
               .orderByAsc(LeaveTypeDef::getDisplayOrder);
        return leaveTypeDefMapper.selectList(wrapper);
    }

    /**
     * 检查指定 code 是否已存在（包含已禁用项）。
     *
     * @param code 请假类型编码
     * @return true 表示 code 已被使用
     */
    public boolean existsByCode(String code) {
        LambdaQueryWrapper<LeaveTypeDef> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LeaveTypeDef::getCode, code);
        return leaveTypeDefMapper.selectCount(wrapper) > 0;
    }

    /**
     * 创建新请假类型。
     * isSystem 固定为 false，isEnabled 固定为 true，displayOrder 自动追加到末尾。
     *
     * @param code          请假类型编码
     * @param name          请假类型名称
     * @param quotaDays     年度配额天数
     * @param deductionRate 扣薪比例
     * @param deductionBasis 扣薪基准
     * @return 已持久化的请假类型实体
     */
    public LeaveTypeDef createLeaveType(String code, String name, Integer quotaDays,
                                        BigDecimal deductionRate, String deductionBasis) {
        LeaveTypeDef entity = new LeaveTypeDef();
        entity.setCode(code);
        entity.setName(name);
        entity.setQuotaDays(quotaDays);
        entity.setDeductionRate(deductionRate);
        entity.setDeductionBasis(deductionBasis);
        entity.setIsSystem(false);
        entity.setIsEnabled(true);
        entity.setDeleted(0);
        entity.setDisplayOrder(nextDisplayOrder());
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        leaveTypeDefMapper.insert(entity);
        return entity;
    }

    /**
     * 按 id 查询请假类型；若不存在或已软删除则返回 null。
     *
     * @param id 主键
     * @return 请假类型实体，或 null
     */
    public LeaveTypeDef findActiveById(Long id) {
        LeaveTypeDef entity = leaveTypeDefMapper.selectById(id);
        return (entity == null || entity.getDeleted() != 0) ? null : entity;
    }

    /**
     * 更新请假类型字段（null 字段不覆盖原值）。
     *
     * @param entity        待更新的实体（已从数据库加载）
     * @param name          新名称，null 表示不变
     * @param quotaDays     新配额天数，null 表示不变
     * @param deductionRate 新扣薪比例，null 表示不变
     * @param deductionBasis 新扣薪基准，null 表示不变
     * @param isEnabled     新启用状态，null 表示不变
     * @return 更新后的实体
     */
    public LeaveTypeDef updateLeaveType(LeaveTypeDef entity, String name, Integer quotaDays,
                                        BigDecimal deductionRate, String deductionBasis,
                                        Boolean isEnabled) {
        if (name != null) entity.setName(name);
        if (quotaDays != null) entity.setQuotaDays(quotaDays);
        if (deductionRate != null) entity.setDeductionRate(deductionRate);
        if (deductionBasis != null) entity.setDeductionBasis(deductionBasis);
        if (isEnabled != null) entity.setIsEnabled(isEnabled);
        entity.setUpdatedAt(LocalDateTime.now());
        leaveTypeDefMapper.updateById(entity);
        return entity;
    }

    /**
     * 软删除请假类型（MyBatis-Plus 逻辑删除）。
     *
     * @param id 主键
     */
    public void deleteLeaveType(Long id) {
        leaveTypeDefMapper.deleteById(id);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    /**
     * 计算下一个 displayOrder 值（当前最大值 + 1，无记录时返回 1）。
     */
    private Integer nextDisplayOrder() {
        LambdaQueryWrapper<LeaveTypeDef> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(LeaveTypeDef::getDisplayOrder).last("LIMIT 1");
        LeaveTypeDef last = leaveTypeDefMapper.selectOne(wrapper);
        return (last != null && last.getDisplayOrder() != null)
                ? last.getDisplayOrder() + 1
                : 1;
    }
}
