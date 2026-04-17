package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.OperationLog;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.OperationLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 操作日志服务
 * 职责：封装操作日志（OperationLog）的分页查询与操作员姓名关联逻辑，
 *      供 OperationLogController 调用，隔离控制器与 Mapper 细节。
 */
@Service
@RequiredArgsConstructor
public class OperationLogService {

    private final OperationLogMapper operationLogMapper;
    private final EmployeeMapper employeeMapper;

    /**
     * 分页查询操作日志，支持按操作时间范围过滤，结果按操作时间倒序排列。
     * 每条记录附带操作员姓名（通过 EmployeeMapper 关联查询）。
     *
     * @param from 开始日期（含），null 表示不限制下界
     * @param to   结束日期（含），null 表示不限制上界
     * @param page 页码（从 0 开始）
     * @param size 每页大小
     * @return 包含 total（总条数）和 records（当页数据）的 Map
     */
    public Map<String, Object> listOperationLogs(LocalDate from, LocalDate to, int page, int size) {
        LambdaQueryWrapper<OperationLog> wrapper = new LambdaQueryWrapper<>();
        if (from != null) {
            wrapper.ge(OperationLog::getActedAt, from.atStartOfDay());
        }
        if (to != null) {
            wrapper.le(OperationLog::getActedAt, to.atTime(LocalTime.MAX));
        }
        wrapper.orderByDesc(OperationLog::getActedAt);

        Page<OperationLog> pageResult = operationLogMapper.selectPage(new Page<>(page, size), wrapper);

        List<Map<String, Object>> records = new ArrayList<>();
        for (OperationLog log : pageResult.getRecords()) {
            Map<String, Object> record = new HashMap<>();
            record.put("id", log.getId());
            record.put("operatorId", log.getOperatorId());
            record.put("operatorName", resolveOperatorName(log.getOperatorId()));
            record.put("action", log.getAction());
            record.put("targetType", log.getTargetType());
            record.put("targetId", log.getTargetId());
            record.put("detail", log.getDetail());
            record.put("actedAt", log.getActedAt());
            records.add(record);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("total", pageResult.getTotal());
        result.put("records", records);
        return result;
    }

    // ── Private helpers ────────────────────────────────────────────────────

    /**
     * 根据员工 ID 查询员工姓名；ID 为 null 或员工不存在时返回 null。
     *
     * @param operatorId 员工 ID
     * @return 员工姓名，或 null
     */
    private String resolveOperatorName(Long operatorId) {
        if (operatorId == null) {
            return null;
        }
        Employee employee = employeeMapper.selectById(operatorId);
        return employee != null ? employee.getName() : null;
    }
}
