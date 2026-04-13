package com.oa.backend.config;

import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.security.SecurityUtils;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * SecurityUtils 初始化器。
 * 在应用启动后初始化 SecurityUtils 的静态 EmployeeMapper 引用。
 *
 * @author OA Backend Team
 * @since 1.0.0
 */
@Component
public class SecurityUtilsInitializer implements CommandLineRunner {

    private final EmployeeMapper employeeMapper;

    public SecurityUtilsInitializer(EmployeeMapper employeeMapper) {
        this.employeeMapper = employeeMapper;
    }

    @Override
    public void run(String... args) {
        SecurityUtils.setEmployeeMapper(employeeMapper);
    }
}
