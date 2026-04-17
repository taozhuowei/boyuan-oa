-- Flyway V15: Add ops (运维) role
-- Seeds the ops role in prod, matching data.sql (H2-dev) and SetupService.ensureRoleExists (initial wizard).

INSERT INTO sys_role (role_code, role_name, description, status, is_system)
SELECT 'ops', '运维', '系统运维，仅访问运维工具与操作日志，不参与业务流程', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM sys_role WHERE role_code = 'ops');
