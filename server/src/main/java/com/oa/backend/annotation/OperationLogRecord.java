package com.oa.backend.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * OperationLogRecord — marks a method for automatic operation log recording.
 *
 * Applied to service or controller methods that represent key business operations
 * (data creation, modification, deletion, approval actions, account changes, etc.).
 * The OperationLogAspect intercepts annotated methods and writes a log entry to
 * the operation_log table after the method completes successfully.
 *
 * Usage:
 *   @OperationLogRecord(action = "CREATE_EMPLOYEE", targetType = "EMPLOYEE")
 *   public Employee createEmployee(EmployeeCreateRequest request) { ... }
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface OperationLogRecord {

    /**
     * Describes the operation performed, e.g. "CREATE_EMPLOYEE", "APPROVE_LEAVE".
     * Maps to the `action` column of operation_log.
     */
    String action();

    /**
     * The type of entity being operated on, e.g. "EMPLOYEE", "FORM_RECORD".
     * Maps to the `target_type` column of operation_log.
     */
    String targetType() default "";
}
