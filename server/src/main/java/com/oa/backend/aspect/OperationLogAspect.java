package com.oa.backend.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.annotation.OperationLogRecord;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.OperationLog;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.OperationLogMapper;
import com.oa.backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * OperationLogAspect — AOP aspect that automatically records operation logs.
 *
 * Intercepts all methods annotated with @OperationLogRecord and writes a log entry
 * to operation_log after successful execution. On failure, the exception is re-thrown
 * without logging (failed operations are not considered completed).
 *
 * The log entry captures:
 * - operatorId: resolved from the current SecurityContext principal
 * - action / targetType: from the annotation attributes
 * - detail: JSON snippet containing method name and return value class name
 * - actedAt: current timestamp
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class OperationLogAspect {

    private final OperationLogMapper operationLogMapper;
    private final EmployeeMapper employeeMapper;
    private final ObjectMapper objectMapper;

    @Around("@annotation(logRecord)")
    public Object logOperation(ProceedingJoinPoint joinPoint, OperationLogRecord logRecord) throws Throwable {
        Object result = joinPoint.proceed();

        // Write log only after successful execution
        try {
            Long operatorId = resolveOperatorId();
            writeLog(operatorId, logRecord.action(), logRecord.targetType(),
                    buildDetail(joinPoint));
        } catch (Exception e) {
            // Log-write failure must never break the business operation
            log.warn("OperationLogAspect: failed to write operation log for action={}",
                    logRecord.action(), e);
        }

        return result;
    }

    private Long resolveOperatorId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        Employee employee = SecurityUtils.getEmployeeFromUsername(auth.getName(), employeeMapper);
        return employee != null ? employee.getId() : null;
    }

    private void writeLog(Long operatorId, String action, String targetType, String detail) {
        OperationLog entry = new OperationLog();
        entry.setOperatorId(operatorId);
        entry.setAction(action);
        entry.setTargetType(targetType);
        entry.setDetail(detail);
        entry.setActedAt(LocalDateTime.now());
        operationLogMapper.insert(entry);
    }

    private String buildDetail(ProceedingJoinPoint joinPoint) {
        Map<String, Object> detail = new HashMap<>();
        detail.put("method", joinPoint.getSignature().toShortString());
        try {
            return objectMapper.writeValueAsString(detail);
        } catch (Exception e) {
            return "{}";
        }
    }
}
