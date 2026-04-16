package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.ProjectInsuranceDef;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.ProjectInsuranceDefMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 保险成本聚合服务（设计 §8.4）。
 * 公式：本期成本 = Σ daily_rate × Σ 适用员工去重出勤天数（从 construction_attendance 真实数据）
 *
 * 适用员工解析：
 *   - GLOBAL：项目内所有 LABOR 类员工
 *   - POSITION：项目内 position_id = scope_target_id 的所有 LABOR
 *   - EMPLOYEE：scope_target_id 这一员工
 *
 * 周期由调用方（前端默认本月 1 号 ~ 今天）传入；effective_date 之前的出勤不计入。
 */
@Service
@RequiredArgsConstructor
public class InsuranceCostService {

    private final ProjectInsuranceDefMapper insuranceMapper;
    private final EmployeeMapper employeeMapper;
    private final ConstructionAttendanceService attendanceService;

    /** 单条保险条目在 [start, end] 期间的成本 + 出勤天数详情 */
    public ItemCost computeOne(ProjectInsuranceDef def, LocalDate start, LocalDate end) {
        LocalDate effectiveStart = def.getEffectiveDate() != null && def.getEffectiveDate().isAfter(start)
                ? def.getEffectiveDate() : start;
        if (effectiveStart.isAfter(end)) {
            return new ItemCost(def.getId(), 0L, BigDecimal.ZERO);
        }
        Set<Long> applicable = resolveApplicableEmployees(def);
        Map<Long, Long> attendance = attendanceService.aggregatePerEmployee(def.getProjectId(), effectiveStart, end);
        long totalDays = 0;
        for (Long empId : applicable) {
            totalDays += attendance.getOrDefault(empId, 0L);
        }
        BigDecimal cost = def.getDailyRate() == null
                ? BigDecimal.ZERO
                : def.getDailyRate().multiply(BigDecimal.valueOf(totalDays));
        return new ItemCost(def.getId(), totalDays, cost);
    }

    /** 项目所有保险条目在 [start, end] 期间的成本汇总 */
    public List<ItemCost> computeAll(Long projectId, LocalDate start, LocalDate end) {
        List<ProjectInsuranceDef> defs = insuranceMapper.selectList(
                new LambdaQueryWrapper<ProjectInsuranceDef>()
                        .eq(ProjectInsuranceDef::getProjectId, projectId)
                        .eq(ProjectInsuranceDef::getDeleted, 0));
        List<ItemCost> out = new ArrayList<>();
        for (ProjectInsuranceDef def : defs) {
            out.add(computeOne(def, start, end));
        }
        return out;
    }

    private Set<Long> resolveApplicableEmployees(ProjectInsuranceDef def) {
        Set<Long> out = new HashSet<>();
        switch (def.getScope() == null ? "" : def.getScope()) {
            case "GLOBAL":
                List<Employee> labor = employeeMapper.selectList(
                        new LambdaQueryWrapper<Employee>()
                                .eq(Employee::getEmployeeType, "LABOR")
                                .eq(Employee::getDeleted, 0));
                for (Employee e : labor) out.add(e.getId());
                break;
            case "POSITION":
                if (def.getScopeTargetId() != null) {
                    List<Employee> byPos = employeeMapper.selectList(
                            new LambdaQueryWrapper<Employee>()
                                    .eq(Employee::getEmployeeType, "LABOR")
                                    .eq(Employee::getPositionId, def.getScopeTargetId())
                                    .eq(Employee::getDeleted, 0));
                    for (Employee e : byPos) out.add(e.getId());
                }
                break;
            case "EMPLOYEE":
                if (def.getScopeTargetId() != null) out.add(def.getScopeTargetId());
                break;
            default:
                break;
        }
        return out;
    }

    public record ItemCost(Long defId, Long manDays, BigDecimal cost) {}
}
