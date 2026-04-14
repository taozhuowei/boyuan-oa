-- Flyway V4: Fix expense approval flow to CEO -> Finance (matching DESIGN.md)
-- Also ensures expense_type check includes OFFICE for already-migrated DBs.

-- ============================================
-- 1. Fix EXPENSE approval flow: CEO -> Finance
-- ============================================
DO $$
DECLARE
    flow_id BIGINT;
BEGIN
    SELECT id INTO flow_id FROM approval_flow_def WHERE business_type = 'EXPENSE' AND is_active = TRUE;
    
    IF flow_id IS NOT NULL THEN
        -- Delete old nodes and re-insert
        DELETE FROM approval_flow_node WHERE flow_id = flow_id;
        
        -- 插入审批流节点：节点1 - CEO审批
        INSERT INTO approval_flow_node (flow_id, node_order, node_name, approval_mode, approver_type, approver_ref)
        VALUES (flow_id, 1, 'CEO审批', 'SEQUENTIAL', 'ROLE', 'ceo');
        
        -- 插入审批流节点：节点2 - 财务审批
        INSERT INTO approval_flow_node (flow_id, node_order, node_name, approval_mode, approver_type, approver_ref)
        VALUES (flow_id, 2, '财务审批', 'SEQUENTIAL', 'ROLE', 'finance');
    END IF;
END $$;

-- ============================================
-- 2. Ensure OFFICE expense type exists
-- ============================================
INSERT INTO expense_type_def (code, name, description, require_invoice, display_order, is_enabled, is_system)
VALUES ('OFFICE', '办公用品', '办公耗材、用品等', TRUE, 5, TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;
