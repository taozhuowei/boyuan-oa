-- Flyway V4: Fix expense approval flow to CEO -> Finance (matching DESIGN.md)
-- Also ensures expense_type check includes OFFICE for already-migrated DBs.

-- ============================================
-- 1. Fix EXPENSE approval flow: CEO -> Finance
-- ============================================
-- 删除现有节点（仅针对已存在的 EXPENSE 审批流）
DELETE FROM approval_flow_node
WHERE flow_id IN (SELECT id FROM approval_flow_def WHERE business_type = 'EXPENSE' AND is_active = TRUE);

-- 重新插入审批流节点
INSERT INTO approval_flow_node (flow_id, node_order, node_name, approval_mode, approver_type, approver_ref)
SELECT a.id, 1, 'CEO审批', 'SEQUENTIAL', 'ROLE', 'ceo'
FROM approval_flow_def a
WHERE a.business_type = 'EXPENSE' AND a.is_active = TRUE;

INSERT INTO approval_flow_node (flow_id, node_order, node_name, approval_mode, approver_type, approver_ref)
SELECT a.id, 2, '财务审批', 'SEQUENTIAL', 'ROLE', 'finance'
FROM approval_flow_def a
WHERE a.business_type = 'EXPENSE' AND a.is_active = TRUE;

-- ============================================
-- 2. Ensure OFFICE expense type exists
-- ============================================
INSERT INTO expense_type_def (code, name, description, require_invoice, display_order, is_enabled, is_system)
VALUES ('OFFICE', '办公用品', '办公耗材、用品等', TRUE, 5, TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;
