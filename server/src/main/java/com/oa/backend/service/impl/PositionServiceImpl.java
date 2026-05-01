package com.oa.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.oa.backend.dto.PositionLevelResponse;
import com.oa.backend.dto.PositionLevelUpsertRequest;
import com.oa.backend.dto.PositionResponse;
import com.oa.backend.dto.PositionUpsertRequest;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.Position;
import com.oa.backend.entity.PositionLevel;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.PositionLevelMapper;
import com.oa.backend.mapper.PositionMapper;
import com.oa.backend.service.PositionService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** 岗位服务实现类 */
@Service
@RequiredArgsConstructor
public class PositionServiceImpl implements PositionService {

  private final PositionMapper positionMapper;
  private final PositionLevelMapper positionLevelMapper;
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
    if (position == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "岗位不存在");
    }
    PositionResponse baseResponse = toPositionResponse(position);

    // 查询等级列表
    List<PositionLevelResponse> levels = listLevels(id);

    return new PositionResponse(
        baseResponse.id(),
        baseResponse.positionCode(),
        baseResponse.positionName(),
        baseResponse.employeeCategory(),
        baseResponse.defaultRoleCode(),
        baseResponse.baseSalary(),
        baseResponse.positionSalary(),
        baseResponse.overtimeRateWeekday(),
        baseResponse.overtimeRateWeekend(),
        baseResponse.overtimeRateHoliday(),
        baseResponse.defaultPerformanceBonus(),
        baseResponse.annualLeave(),
        baseResponse.leaveDeductBaseType(),
        baseResponse.socialInsuranceMode(),
        baseResponse.requiresConstructionLog(),
        baseResponse.hasPerformanceBonus(),
        levels);
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
    position.setEmployeeCategory(
        req.employeeCategory() != null ? req.employeeCategory() : "OFFICE");
    position.setDefaultRoleCode(req.defaultRoleCode());
    position.setBaseSalary(req.baseSalary());
    position.setPositionSalary(req.positionSalary());
    position.setOvertimeBaseType(req.overtimeBaseType());
    position.setOvertimeBaseAmount(req.overtimeBaseAmount());
    position.setOvertimeRateWeekday(
        req.overtimeRateWeekday() != null ? req.overtimeRateWeekday() : new BigDecimal("1.5"));
    position.setOvertimeRateWeekend(
        req.overtimeRateWeekend() != null ? req.overtimeRateWeekend() : new BigDecimal("2.0"));
    position.setOvertimeRateHoliday(
        req.overtimeRateHoliday() != null ? req.overtimeRateHoliday() : new BigDecimal("3.0"));
    position.setDefaultPerformanceBonus(req.defaultPerformanceBonus());
    position.setAnnualLeave(req.annualLeave());
    position.setLeaveDeductBaseType(req.leaveDeductBaseType());
    position.setSocialInsuranceMode(req.socialInsuranceMode());
    position.setRequiresConstructionLog(
        req.requiresConstructionLog() != null ? req.requiresConstructionLog() : false);
    position.setHasPerformanceBonus(
        req.hasPerformanceBonus() != null ? req.hasPerformanceBonus() : false);

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
    if (req.positionSalary() != null) {
      position.setPositionSalary(req.positionSalary());
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
    if (position == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "岗位不存在");
    }

    // 检查是否有员工关联该岗位
    QueryWrapper<Employee> empWrapper = new QueryWrapper<>();
    empWrapper.eq("position_id", id);
    empWrapper.eq("deleted", 0);
    long empCount = employeeMapper.selectCount(empWrapper);
    if (empCount > 0) {
      throw new IllegalArgumentException("该岗位下存在员工，无法删除");
    }

    positionMapper.deleteById(id);
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
    level.setPositionSalaryOverride(req.positionSalaryOverride());
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
  public PositionLevelResponse updateLevel(
      Long positionId, Long levelId, PositionLevelUpsertRequest req) {
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
    if (req.positionSalaryOverride() != null) {
      level.setPositionSalaryOverride(req.positionSalaryOverride());
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
    if (level == null || !level.getPositionId().equals(positionId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "等级不存在");
    }

    positionLevelMapper.deleteById(levelId);
  }

  /** 生成岗位编码：POS + 4位序号 */
  private String generatePositionCode() {
    // Use raw SQL (bypasses @TableLogic) so soft-deleted codes are also considered.
    // This prevents unique-constraint violations when re-creating after a soft delete.
    String lastCode = positionMapper.findMaxPositionCode();
    int seq = 1;
    if (lastCode != null) {
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
        p.getPositionSalary(),
        p.getOvertimeRateWeekday(),
        p.getOvertimeRateWeekend(),
        p.getOvertimeRateHoliday(),
        p.getDefaultPerformanceBonus(),
        p.getAnnualLeave(),
        p.getLeaveDeductBaseType(),
        p.getSocialInsuranceMode(),
        p.getRequiresConstructionLog(),
        p.getHasPerformanceBonus(),
        null);
  }

  private PositionLevelResponse toLevelResponse(PositionLevel l) {
    return new PositionLevelResponse(
        l.getId(),
        l.getPositionId(),
        l.getLevelName(),
        l.getLevelOrder(),
        l.getBaseSalaryOverride(),
        l.getPositionSalaryOverride(),
        l.getPerformanceBonusOverride(),
        l.getAnnualLeaveOverride());
  }

}
