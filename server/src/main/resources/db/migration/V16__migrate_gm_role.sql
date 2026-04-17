-- Migrate legacy role_code='gm' to 'general_manager' for any pre-existing rows.
-- If no rows exist, these statements are no-ops.
UPDATE employee SET role_code = 'general_manager' WHERE role_code = 'gm';
DELETE FROM sys_role WHERE role_code = 'gm' AND NOT EXISTS (
    SELECT 1 FROM employee WHERE role_code = 'gm'
);
