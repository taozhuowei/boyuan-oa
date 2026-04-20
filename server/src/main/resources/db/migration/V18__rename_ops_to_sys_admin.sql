-- V18: Rename role code ops -> sys_admin for clarity
UPDATE sys_role SET role_code = 'sys_admin', role_name = '系统管理员' WHERE role_code = 'ops';
UPDATE employee SET role_code = 'sys_admin' WHERE role_code = 'ops';
UPDATE employee SET employee_no = 'sys_admin.demo' WHERE employee_no = 'ops.demo';
UPDATE employee SET employee_no = 'SYS_ADMIN001' WHERE employee_no = 'OPS001';
