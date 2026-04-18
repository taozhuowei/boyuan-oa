-- 测试账号种子数据（仅用于 mvn test，不进入生产）
-- 5 个演示账号 + 1 个 HR；密码统一为 bcrypt("123456")

-- Use MERGE so this file is idempotent when data.sql (which also seeds employees via MERGE)
-- is loaded first in the test application context.
MERGE INTO employee (
    id, employee_no, password_hash, is_default_password, name, phone, email,
    role_code, employee_type, department_id, account_status, entry_date
) KEY (id) VALUES
(1, 'employee.demo', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '张晓宁',  '13800000001', 'zhangxn@oa.demo', 'employee',        'OFFICE', 1, 'ACTIVE', '2024-01-01'),
(2, 'finance.demo',  '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '李静',    '13800000002', 'lij@oa.demo',     'finance',         'OFFICE', 2, 'ACTIVE', '2024-01-01'),
(3, 'pm.demo',       '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '王建国',  '13800000003', 'wangjg@oa.demo',  'project_manager', 'OFFICE', 3, 'ACTIVE', '2024-01-01'),
(4, 'ceo.demo',      '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '陈明远',  '13800000004', 'chenmy@oa.demo',  'ceo',             'OFFICE', 4, 'ACTIVE', '2024-01-01'),
(5, 'worker.demo',   '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '赵铁柱',  '13800000005', 'zhaotz@oa.demo',  'worker',          'LABOR',  5, 'ACTIVE', '2024-01-01'),
(6, 'hr.demo',       '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '李思文',  '13800000006', 'lsw@oa.demo',     'hr',              'OFFICE', 1, 'ACTIVE', '2024-01-01'),
(8, 'ops.demo',      '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '刘运维',  '13800000008', 'lyw@oa.demo',     'ops',             'OFFICE', 1, 'ACTIVE', '2024-01-01');

-- 直系领导关系：员工/劳工 → pm.demo(3)，pm.demo/hr.demo → ceo.demo(4)
UPDATE employee SET direct_supervisor_id = 3 WHERE id IN (1, 5);
UPDATE employee SET direct_supervisor_id = 4 WHERE id IN (3, 6);

-- 项目成员：pm.demo 为 PM，worker.demo 为成员
MERGE INTO project_member (project_id, employee_id, role)
KEY (project_id, employee_id) VALUES
(1, 3, 'PM'),
(1, 5, 'MEMBER'),
(2, 3, 'PM');
