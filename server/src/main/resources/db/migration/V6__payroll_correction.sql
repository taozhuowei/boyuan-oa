-- Flyway V6: 薪资更正流程
-- 财务发起 → CEO 审批 → 通过后旧工资条 SUPERSEDED，version+1 新工资条 PUBLISHED

-- ============================================
-- 1. payroll_adjustment 扩展字段
-- ============================================
ALTER TABLE payroll_adjustment ADD COLUMN IF NOT EXISTS slip_id BIGINT;
ALTER TABLE payroll_adjustment ADD COLUMN IF NOT EXISTS form_id BIGINT;
ALTER TABLE payroll_adjustment ADD COLUMN IF NOT EXISTS corrections_json TEXT;
ALTER TABLE payroll_adjustment ADD COLUMN IF NOT EXISTS new_slip_id BIGINT;
ALTER TABLE payroll_adjustment ADD COLUMN IF NOT EXISTS applied BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_payroll_adjustment_form ON payroll_adjustment(form_id);
CREATE INDEX IF NOT EXISTS idx_payroll_adjustment_slip ON payroll_adjustment(slip_id);

-- ============================================
-- 2. form_type_def: PAYROLL_CORRECTION
-- ============================================
INSERT INTO form_type_def (code, name, is_enabled, is_system)
VALUES ('PAYROLL_CORRECTION', '薪资更正', TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 3. approval_flow_def + node: PAYROLL_CORRECTION (CEO 单节点)
-- ============================================
INSERT INTO approval_flow_def (business_type, version, is_active, created_at)
SELECT 'PAYROLL_CORRECTION', 1, TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM approval_flow_def WHERE business_type = 'PAYROLL_CORRECTION' AND is_active = TRUE);

INSERT INTO approval_flow_node (flow_id, node_order, node_name, approval_mode, approver_type, approver_ref)
SELECT a.id, 1, 'CEO审批', 'SEQUENTIAL', 'ROLE', 'ceo'
FROM approval_flow_def a
WHERE a.business_type = 'PAYROLL_CORRECTION' AND a.is_active = TRUE
AND NOT EXISTS (SELECT 1 FROM approval_flow_node n WHERE n.flow_id = a.id AND n.node_order = 1);
