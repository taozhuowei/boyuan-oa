-- V20: Seed sys_admin.demo test account if not present.
-- V15 added ops role, V18 renamed ops→sys_admin. No Flyway migration ever
-- INSERTed an ops.demo / sys_admin.demo employee row on PostgreSQL (H2 data.sql
-- has it but H2 is dev-only). Tests and DevToolbar assume all 8 test accounts
-- exist; this fills the gap.
--
-- Explicit id=8 so /dev/reset `DELETE ... OR id >= 100` preserves it alongside
-- other seed accounts (ids 1-7).
-- password_hash = bcrypt("123456"), same as data.sql and R__ seeds.
INSERT INTO employee (
    id, employee_no, password_hash, is_default_password, name, phone, email,
    role_code, employee_type, department_id, account_status, entry_date
)
SELECT 8, 'sys_admin.demo', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi',
       TRUE, '刘运维', '13800000008', NULL,
       'sys_admin', 'OFFICE', 1, 'ACTIVE', '2024-01-01'
WHERE NOT EXISTS (SELECT 1 FROM employee WHERE employee_no = 'sys_admin.demo');

-- Keep the auto-increment sequence ahead of explicit-id inserts
SELECT setval(pg_get_serial_sequence('employee', 'id'),
              GREATEST((SELECT MAX(id) FROM employee), 100),
              true);
