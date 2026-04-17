ALTER TABLE leave_type_def
  ADD COLUMN IF NOT EXISTS quota_days INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deduction_basis VARCHAR(20) DEFAULT 'DAILY_SALARY';

INSERT INTO leave_type_def (code, name, quota_days, deduction_rate, deduction_basis, is_system, is_enabled, display_order)
SELECT v.code, v.name, v.quota_days, v.deduction_rate, v.deduction_basis, v.is_system, v.is_enabled, v.display_order
FROM (VALUES
  ('ANNUAL',   '年假',  10, 0.0,  'DAILY_SALARY', TRUE, TRUE, 1),
  ('SICK',     '病假',  30, 0.5,  'DAILY_SALARY', TRUE, TRUE, 2),
  ('PERSONAL', '事假',  5,  1.0,  'DAILY_SALARY', TRUE, TRUE, 3),
  ('MARRIAGE', '婚假',  3,  0.0,  'DAILY_SALARY', TRUE, TRUE, 4),
  ('MATERNITY','产假',  90, 0.0,  'DAILY_SALARY', TRUE, TRUE, 5)
) AS v(code, name, quota_days, deduction_rate, deduction_basis, is_system, is_enabled, display_order)
WHERE NOT EXISTS (SELECT 1 FROM leave_type_def LIMIT 1);
