package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.oa.backend.entity.OperationLog;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.OperationLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/operation-logs")
@RequiredArgsConstructor
public class OperationLogController {

    private final OperationLogMapper operationLogMapper;
    private final EmployeeMapper employeeMapper;

    @GetMapping
    @PreAuthorize("hasRole('CEO')")
    public Map<String, Object> listOperationLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

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

            String operatorName = null;
            if (log.getOperatorId() != null) {
                com.oa.backend.entity.Employee employee = employeeMapper.selectById(log.getOperatorId());
                if (employee != null) {
                    operatorName = employee.getName();
                }
            }
            record.put("operatorName", operatorName);

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
}
