package com.oa.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.oa.backend.dto.*;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.Position;
import com.oa.backend.entity.PositionLevel;
import com.oa.backend.entity.SocialInsuranceItem;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.PositionLevelMapper;
import com.oa.backend.mapper.PositionMapper;
import com.oa.backend.mapper.SocialInsuranceItemMapper;
import com.oa.backend.service.PositionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 岗位服务实现类
 */
@Service
@RequiredArgsConstructor
public class PositionServiceImpl implements PositionService {

    private final PositionMapper positionMapper;
    private final PositionLevelMapper positionLevelMapper;
    private final SocialInsuranceItemMapper socialInsuranceItemMapper;
    private final EmployeeMapper employeeMapper;

    @Override
    public List<PositionResponse> listPositions() {
        QueryWrapper<Position> wrapper = new QueryWrapper<>();
        wrapper.eq("deleted", 0);
        wrapper.orderByAsc("position_code");
        return positionMapper.selectList(wrapper).stream()
            .map(this::toPositionResponse)
            .collect(Collectors.toList());
    }

    @Override
    public PositionResponse getPosition(Long id) {
        Position position = positionMapper.selectById(id);
        if (position == null || position.getDeleted() != 0) {
            throw new IllegalArgumentException("岗位不存在");
        }
        PositionResponse baseResponse = toPositionResponse(position);
        
        // 查询等级列表
        List<PositionLevelResponse> levels = listLevels(id);
        
        // 查询社保项目列表
        List<SocialInsuranceItemResponse> items = listSocialInsuranceItems(id);
        
        return new PositionResponse(
            baseResponse.id(),
            baseResponse.positionCode(),
            baseResponse.positionName(),
            baseResponse.employeeCategory(),
            baseResponse.defaultRoleCode(),
            baseResponse.baseSalary(),
            baseResponse.overtimeRateWeekday(),
            baseResponse.overtimeRateWeekend(),
            baseResponse.overtimeRateHoliday(),
            baseResponse.defaultPerformanceBonus(),
            baseResponse.annualLeave(),
            baseResponse.leaveDeductBaseType(),
            baseResponse.socialInsuranceMode(),
            baseResponse.requiresConstructionLog(),
            baseResponse.hasPerformanceBonus(),
            levels,
            items
        );
    }

    @Override
    @Transactional
    public PositionResponse createPosition(PositionUpsertRequest req) {
        if (req.positionName() == null || req.positionName().isBlank()) {
            throw new IllegalArgumentException("岗位名称不能为空");
        }
        
        Position position = new Position();
        position.setPositionCode(generatePositionCode());
        position.setPositionName(req.positionName());
        position.setEmployeeCategory(req.employeeCategory() != null ? req.employeeCategory() : "OFFICE");
        position.setDefaultRoleCode(req.defaultRoleCode());
        position.setBaseSalary(req.baseSalary());
        position.setOvertimeBaseType(req.overtimeBaseType());
        position.setOvertimeBaseAmount(req.overtimeBaseAmount());
        position.setOvertimeRateWeekday(req.overtimeRateWeekday() != null ? req.overtimeRateWeekday() : new BigDecimal("1.5"));
        position.setOvertimeRateWeekend(req.overtimeRateWeekend() != null ? req.overtimeRateWeekend() : new BigDecimal("2.0"));
        position.setOvertimeRateHoliday(req.overtimeRateHoliday() != null ? req.overtimeRateHoliday() : new BigDecimal("3.0"));
        position.setDefaultPerformanceBonus(req.defaultPerformanceBonus());
        position.setAnnualLeave(req.annualLeave());
        position.setLeaveDeductBaseType(req.leaveDeductBaseType());
        position.setSocialInsuranceMode(req.socialInsuranceMode());
        position.setRequiresConstructionLog(req.requiresConstructionLog() != null ? req.requiresConstructionLog() : false);
        position.setHasPerformanceBonus(req.hasPerformanceBonus() != null ? req.hasPerformanceBonus() : false);
        
        LocalDateTime now = LocalDateTime.now();
        position.setCreatedAt(now);
        position.setUpdatedAt(now);
        position.setDeleted(0);
        
        positionMapper.insert(position);
        return toPositionResponse(position);
    }

    @Override
    @Transactional
    public PositionResponse updatePosition(Long id, PositionUpsertRequest req) {
        Position position = positionMapper.selectById(id);
        if (position == null || position.getDeleted() != 0) {
            throw new IllegalArgumentException("岗位不存在");
        }
        
        if (req.positionName() != null) {
            position.setPositionName(req.positionName());
        }
        if (req.employeeCategory() != null) {
            position.setEmployeeCategory(req.employeeCategory());
        }
        if (req.defaultRoleCode() != null) {
            position.setDefaultRoleCode(req.defaultRoleCode());
        }
        if (req.baseSalary() != null) {
            position.setBaseSalary(req.baseSalary());
        }
        if (req.overtimeBaseType() != null) {
            position.setOvertimeBaseType(req.overtimeBaseType());
        }
        if (req.overtimeBaseAmount() != null) {
            position.setOvertimeBaseAmount(req.overtimeBaseAmount());
        }
        if (req.overtimeRateWeekday() != null) {
            position.setOvertimeRateWeekday(req.overtimeRateWeekday());
        }
        if (req.overtimeRateWeekend() != null) {
            position.setOvertimeRateWeekend(req.overtimeRateWeekend());
        }
        if (req.overtimeRateHoliday() != null) {
            position.setOvertimeRateHoliday(req.overtimeRateHoliday());
        }
        if (req.defaultPerformanceBonus() != null) {
            position.setDefaultPerformanceBonus(req.defaultPerformanceBonus());
        }
        if (req.annualLeave() != null) {
            position.setAnnualLeave(req.annualLeave());
        }
        if (req.leaveDeductBaseType() != null) {
            position.setLeaveDeductBaseType(req.leaveDeductBaseType());
        }
        if (req.socialInsuranceMode() != null) {
            position.setSocialInsuranceMode(req.socialInsuranceMode());
        }
        if (req.requiresConstructionLog() != null) {
            position.setRequiresConstructionLog(req.requiresConstructionLog());
        }
        if (req.hasPerformanceBonus() != null) {
            position.setHasPerformanceBonus(req.hasPerformanceBonus());
        }
        
        position.setUpdatedAt(LocalDateTime.now());
        positionMapper.updateById(position);
        return getPosition(id);
    }

    @Override
    @Transactional
    public void deletePosition(Long id) {
        Position position = positionMapper.selectById(id);
        if (position == null || position.getDeleted() != 0) {
            throw new IllegalArgumentException("岗位不存在");
        }
        
        // 检查是否有员工关联该岗位
        QueryWrapper<Employee> empWrapper = new QueryWrapper<>();
        empWrapper.eq("position_id", id);
        empWrapper.eq("deleted", 0);
        long empCount = employeeMapper.selectCount(empWrapper);
        if (empCount > 0) {
            throw new IllegalArgumentException("该岗位下存在员工，无法删除");
        }
        
        position.setDeleted(1);
        position.setUpdatedAt(LocalDateTime.now());
        positionMapper.updateById(position);
    }

    @Override
    public List<PositionLevelResponse> listLevels(Long positionId) {
        QueryWrapper<PositionLevel> wrapper = new QueryWrapper<>();
        wrapper.eq("position_id", positionId);
        wrapper.eq("deleted", 0);
        wrapper.orderByAsc("level_order");
        return positionLevelMapper.selectList(wrapper).stream()
            .map(this::toLevelResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PositionLevelResponse createLevel(Long positionId, PositionLevelUpsertRequest req) {
        if (req.levelName() == null || req.levelName().isBlank()) {
            throw new IllegalArgumentException("等级名称不能为空");
        }
        
        // 验证岗位存在
        Position position = positionMapper.selectById(positionId);
        if (position == null || position.getDeleted() != 0) {
            throw new IllegalArgumentException("岗位不存在");
        }
        
        PositionLevel level = new PositionLevel();
        level.setPositionId(positionId);
        level.setLevelName(req.levelName());
        level.setLevelOrder(req.levelOrder());
        level.setBaseSalaryOverride(req.baseSalaryOverride());
        level.setPerformanceBonusOverride(req.performanceBonusOverride());
        level.setAnnualLeaveOverride(req.annualLeaveOverride());
        
        LocalDateTime now = LocalDateTime.now();
        level.setCreatedAt(now);
        level.setUpdatedAt(now);
        level.setDeleted(0);
        
        positionLevelMapper.insert(level);
        return toLevelResponse(level);
    }

    @Override
    @Transactional
    public PositionLevelResponse updateLevel(Long positionId, Long levelId, PositionLevelUpsertRequest req) {
        PositionLevel level = positionLevelMapper.selectById(levelId);
        if (level == null || level.getDeleted() != 0 || !level.getPositionId().equals(positionId)) {
            throw new IllegalArgumentException("等级不存在");
        }
        
        if (req.levelName() != null) {
            level.setLevelName(req.levelName());
        }
        if (req.levelOrder() != null) {
            level.setLevelOrder(req.levelOrder());
        }
        if (req.baseSalaryOverride() != null) {
            level.setBaseSalaryOverride(req.baseSalaryOverride());
        }
        if (req.performanceBonusOverride() != null) {
            level.setPerformanceBonusOverride(req.performanceBonusOverride());
        }
        if (req.annualLeaveOverride() != null) {
            level.setAnnualLeaveOverride(req.annualLeaveOverride());
        }
        
        level.setUpdatedAt(LocalDateTime.now());
        positionLevelMapper.updateById(level);
        return toLevelResponse(level);
    }

    @Override
    @Transactional
    public void deleteLevel(Long positionId, Long levelId) {
        PositionLevel level = positionLevelMapper.selectById(levelId);
        if (level == null || level.getDeleted() != 0 || !level.getPositionId().equals(positionId)) {
            throw new IllegalArgumentException("等级不存在");
        }
        
        level.setDeleted(1);
        level.setUpdatedAt(LocalDateTime.now());
        positionLevelMapper.updateById(level);
    }

    /**
     * 查询社保项目列表
     */
    private List<SocialInsuranceItemResponse> listSocialInsuranceItems(Long positionId) {
        QueryWrapper<SocialInsuranceItem> wrapper = new QueryWrapper<>();
        wrapper.eq("position_id", positionId);
        wrapper.eq("deleted", 0);
        wrapper.orderByAsc("display_order");
        return socialInsuranceItemMapper.selectList(wrapper).stream()
            .map(this::toInsuranceItemResponse)
            .collect(Collectors.toList());
    }

    /**
     * 生成岗位编码：POS + 4位序号
     */
    private String generatePositionCode() {
        QueryWrapper<Position> wrapper = new QueryWrapper<>();
        wrapper.like("position_code", "POS%");
        wrapper.orderByDesc("position_code");
        wrapper.last("LIMIT 1");
        
        Position lastPosition = positionMapper.selectOne(wrapper);
        int seq = 1;
        if (lastPosition != null) {
            String lastCode = lastPosition.getPositionCode();
            try {
                seq = Integer.parseInt(lastCode.substring(3)) + 1;
            } catch (NumberFormatException e) {
                seq = 1;
            }
        }
        return "POS" + String.format("%04d", seq);
    }

    private PositionResponse toPositionResponse(Position p) {
        return new PositionResponse(
            p.getId(),
            p.getPositionCode(),
            p.getPositionName(),
            p.getEmployeeCategory(),
            p.getDefaultRoleCode(),
            p.getBaseSalary(),
            p.getOvertimeRateWeekday(),
            p.getOvertimeRateWeekend(),
            p.getOvertimeRateHoliday(),
            p.getDefaultPerformanceBonus(),
            p.getAnnualLeave(),
            p.getLeaveDeductBaseType(),
            p.getSocialInsuranceMode(),
            p.getRequiresConstructionLog(),
            p.getHasPerformanceBonus(),
            null,
            null
        );
    }

    private PositionLevelResponse toLevelResponse(PositionLevel l) {
        return new PositionLevelResponse(
            l.getId(),
            l.getPositionId(),
            l.getLevelName(),
            l.getLevelOrder(),
            l.getBaseSalaryOverride(),
            l.getPerformanceBonusOverride(),
            l.getAnnualLeaveOverride()
        );
    }

    private SocialInsuranceItemResponse toInsuranceItemResponse(SocialInsuranceItem i) {
        return new SocialInsuranceItemResponse(
            i.getId(),
            i.getPositionId(),
            i.getName(),
            i.getEmployeeRate(),
            i.getCompanyRate(),
            i.getIsEnabled(),
            i.getDisplayOrder()
        );
    }
}
