-- Flyway V2: Seed data for Boyuan OA Platform
-- 注意：测试账号数据已移出仓库，本地开发请使用 local/seed-data.sql

-- 部门数据（5条）
INSERT INTO department (id, parent_id, name, sort) VALUES
(1, NULL, '综合管理部', 1),
(2, NULL, '财务管理部', 2),
(3, NULL, '项目一部', 3),
(4, NULL, '运营管理部', 4),
(5, NULL, '施工一部', 5);

-- 角色数据（5条）- 使用 ON CONFLICT 避免重复
INSERT INTO sys_role (id, role_code, role_name, description, status, is_system) VALUES
(1, 'employee', '员工', '发起和查看本人业务单据，查看并确认工资条。', 1, 1),
(2, 'finance', '财务', '维护人员与薪资配置，执行结算、复核异议、导出数据。', 1, 1),
(3, 'project_manager', '项目经理', '处理项目范围内审批，维护项目施工日志模板，查看项目总览。', 1, 1),
(4, 'ceo', '首席经营者', '管理全局配置、终审审批、配置角色权限、查看经营总览。', 1, 1),
(5, 'worker', '劳工', '施工现场工作人员，可使用施工日志和工伤补偿相关功能。', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Phase 3: 项目种子数据
-- ============================================
INSERT INTO project (id, name, status, start_date, log_cycle_days) VALUES
(1, '万达广场中央空调安装工程', 'ACTIVE', '2026-01-15', 1),
(2, '科技园区通风改造项目', 'ACTIVE', '2026-02-01', 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Phase 4: 审批流定义种子数据
-- ============================================
INSERT INTO approval_flow_def (id, business_type, version, is_active) VALUES
(1, 'LEAVE', 1, TRUE),
(2, 'OVERTIME', 1, TRUE),
(3, 'LOG', 1, TRUE),
(4, 'INJURY', 1, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO approval_flow_node (id, flow_id, node_order, node_name, approval_mode, approver_type, approver_ref, skip_condition) VALUES
(1, 1, 1, 'Initial Review', 'SEQUENTIAL', 'DIRECT_SUPERVISOR', NULL, NULL),
(2, 1, 2, 'Final Approval', 'SEQUENTIAL', 'ROLE', 'ceo', NULL),
(3, 2, 1, 'Initial Review', 'SEQUENTIAL', 'DIRECT_SUPERVISOR', NULL, NULL),
(4, 2, 2, 'Final Approval', 'SEQUENTIAL', 'ROLE', 'ceo', NULL),
(5, 3, 1, 'PM Review',     'SEQUENTIAL', 'ROLE', 'project_manager', NULL),
(6, 4, 1, 'PM Review',     'SEQUENTIAL', 'ROLE', 'project_manager', '{"role":"project_manager"}'),
(7, 4, 2, 'CEO Approval',  'SEQUENTIAL', 'ROLE', 'ceo', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Phase 10: 数据保留策略默认配置
-- ============================================
INSERT INTO retention_policy (id, data_type, retention_years, warn_before_days) VALUES
(1, 'PAYROLL_SLIP', 1, 30),
(2, 'FORM_RECORD', 1, 30),
(3, 'ATTENDANCE_RECORD', 1, 30),
(4, 'CONSTRUCTION_LOG', 1, 30),
(5, 'INJURY_CLAIM', 1, 30),
(6, 'OPERATION_LOG', 1, 30)
ON CONFLICT (data_type) DO NOTHING;

-- 重置各表的 IDENTITY 序列
SELECT setval(pg_get_serial_sequence('employee', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('retention_policy', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('department', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('sys_role', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('project', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('project_member', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('approval_flow_def', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('approval_flow_node', 'id'), 100, false);

-- ============================================
-- System Config: initialization status
-- ============================================
INSERT INTO system_config (config_key, config_value, description) VALUES ('initialized', 'false', 'System initialization status')
ON CONFLICT (config_key) DO NOTHING;
