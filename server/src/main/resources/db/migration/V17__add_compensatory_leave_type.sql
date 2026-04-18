-- V17: Add COMPENSATORY leave type (adjustable, non-system)
-- This type exists in H2 dev seed data but was missing from production migrations.
-- Using WHERE NOT EXISTS for idempotency.
INSERT INTO leave_type_def (code, name, deduction_rate, quota_days, deduction_basis, is_enabled, is_system, display_order)
SELECT 'COMPENSATORY', '调休假', 0.00, 3, 'DAILY_WAGE', TRUE, FALSE, 6
WHERE NOT EXISTS (SELECT 1 FROM leave_type_def WHERE code = 'COMPENSATORY');
