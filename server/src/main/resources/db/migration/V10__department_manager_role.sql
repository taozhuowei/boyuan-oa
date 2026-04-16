-- Flyway V10: Add department_manager role
-- Adds the department_manager role that was missing from initial seed data.

INSERT INTO sys_role (role_code, role_name, description, status, is_system)
SELECT 'department_manager', '部门经理', '员工考勤审批、部门管理，可查看本部门员工基本信息与考勤记录。', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM sys_role WHERE role_code = 'department_manager');
