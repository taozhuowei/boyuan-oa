-- Flyway repeatable migration: test accounts and initialization for mvn test only.
-- Uses PostgreSQL ON CONFLICT syntax. Runs after all versioned migrations.
-- Not included in production classpath (src/test/resources only).
-- bcrypt hash = bcrypt("123456")

INSERT INTO employee (
    id, employee_no, password_hash, is_default_password, name, phone, email,
    role_code, employee_type, department_id, account_status, entry_date
) VALUES
(1, 'employee.demo',     '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '张晓宁', '13800000001', 'zhangxn@oa.demo',  'employee',           'OFFICE', 1, 'ACTIVE', '2024-01-01'),
(2, 'finance.demo',      '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '李静',   '13800000002', 'lij@oa.demo',      'finance',            'OFFICE', 2, 'ACTIVE', '2024-01-01'),
(3, 'pm.demo',           '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '王建国', '13800000003', 'wangjg@oa.demo',   'project_manager',    'OFFICE', 3, 'ACTIVE', '2024-01-01'),
(4, 'ceo.demo',          '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '陈明远', '13800000004', 'chenmy@oa.demo',   'ceo',                'OFFICE', 4, 'ACTIVE', '2024-01-01'),
(5, 'worker.demo',       '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '赵铁柱', '13800000005', 'zhaotz@oa.demo',   'worker',             'LABOR',  5, 'ACTIVE', '2024-01-01'),
(6, 'hr.demo',           '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '李思文', '13800000006', 'lsw@oa.demo',      'hr',                 'OFFICE', 1, 'ACTIVE', '2024-01-01'),
(7, 'dept_manager.demo', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '周伟',   '13800000007', 'zhouw@oa.demo',    'department_manager', 'OFFICE', 1, 'ACTIVE', '2024-01-01'),
(8, 'sys_admin.demo',    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '刘运维', '13800000008', 'lyw@oa.demo',      'sys_admin',          'OFFICE', 1, 'ACTIVE', '2024-01-01')
ON CONFLICT (id) DO UPDATE SET
    employee_no         = EXCLUDED.employee_no,
    password_hash       = EXCLUDED.password_hash,
    is_default_password = EXCLUDED.is_default_password,
    name                = EXCLUDED.name,
    phone               = EXCLUDED.phone,
    email               = EXCLUDED.email,
    role_code           = EXCLUDED.role_code,
    employee_type       = EXCLUDED.employee_type,
    department_id       = EXCLUDED.department_id,
    account_status      = EXCLUDED.account_status,
    entry_date          = EXCLUDED.entry_date;

-- Supervisor relationships (match data.sql)
UPDATE employee SET direct_supervisor_id = 7 WHERE id = 1;
UPDATE employee SET direct_supervisor_id = 3 WHERE id = 5;
UPDATE employee SET direct_supervisor_id = 4 WHERE id IN (3, 6, 7);

-- Project membership
INSERT INTO project_member (project_id, employee_id, role) VALUES
(1, 3, 'PM'),
(1, 5, 'MEMBER'),
(2, 3, 'PM')
ON CONFLICT (project_id, employee_id) DO UPDATE SET role = EXCLUDED.role;

-- Mark system as initialized so setup wizard does not block requests
INSERT INTO system_config (config_key, config_value, description)
VALUES ('initialized', 'true', 'System initialization status')
ON CONFLICT (config_key) DO UPDATE SET config_value = 'true';
