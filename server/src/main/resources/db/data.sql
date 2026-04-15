-- ============================================
-- Phase 0B: 开发环境基础数据结构
-- 注意：测试账号数据已移出仓库，本地开发请使用 local/seed-data.sql
-- ============================================

-- 部门数据（5条）
INSERT INTO department (id, parent_id, name, sort) VALUES
(1, NULL, '综合管理部', 1),
(2, NULL, '财务管理部', 2),
(3, NULL, '项目一部', 3),
(4, NULL, '运营管理部', 4),
(5, NULL, '施工一部', 5);

-- 角色数据（6条）- 使用 MERGE INTO 避免重复
MERGE INTO sys_role (id, role_code, role_name, description, status, is_system)
KEY (id) VALUES
(1, 'employee', '员工', '发起和查看本人业务单据，查看并确认工资条。', 1, 1),
(2, 'finance', '财务', '维护人员与薪资配置，执行结算、复核异议、导出数据。', 1, 1),
(3, 'project_manager', '项目经理', '处理项目范围内审批，维护项目施工日志模板，查看项目总览。', 1, 1),
(4, 'ceo', '首席经营者', '管理全局配置、终审审批、配置角色权限、查看经营总览。', 1, 1),
(5, 'worker', '劳工', '施工现场工作人员，可使用施工日志和工伤补偿相关功能。', 1, 1),
(6, 'hr', '人力资源', '维护人员与薪资配置，执行结算、复核异议、导出数据。', 1, 1);

-- ============================================
-- Phase 3: 项目种子数据
-- ============================================
MERGE INTO project (id, name, status, start_date, log_cycle_days)
KEY (id) VALUES
(1, '万达广场中央空调安装工程', 'ACTIVE', '2026-01-15', 1),
(2, '科技园区通风改造项目', 'ACTIVE', '2026-02-01', 1);

-- ============================================
-- Phase 4: 审批流定义种子数据
-- ============================================
MERGE INTO approval_flow_def (id, business_type, version, is_active)
KEY (id) VALUES
(1, 'LEAVE', 1, TRUE),
(2, 'OVERTIME', 1, TRUE),
(3, 'LOG', 1, TRUE),
(4, 'INJURY', 1, TRUE);

MERGE INTO approval_flow_node (id, flow_id, node_order, node_name, approval_mode, approver_type, approver_ref, skip_condition)
KEY (id) VALUES
(1, 1, 1, 'Initial Review', 'SEQUENTIAL', 'DIRECT_SUPERVISOR', NULL, NULL),
(2, 1, 2, 'Final Approval', 'SEQUENTIAL', 'ROLE', 'ceo', NULL),
(3, 2, 1, 'Initial Review', 'SEQUENTIAL', 'DIRECT_SUPERVISOR', NULL, NULL),
(4, 2, 2, 'Final Approval', 'SEQUENTIAL', 'ROLE', 'ceo', NULL),
(5, 3, 1, 'PM Review',     'SEQUENTIAL', 'ROLE', 'project_manager', NULL),
(6, 4, 1, 'PM Review',     'SEQUENTIAL', 'ROLE', 'project_manager', '{"role":"project_manager"}'),
(7, 4, 2, 'CEO Approval',  'SEQUENTIAL', 'ROLE', 'ceo', NULL);

-- ============================================
-- Phase 10: 数据保留策略默认配置
-- ============================================
MERGE INTO retention_policy (id, data_type, retention_years, warn_before_days)
KEY (data_type) VALUES
(1, 'PAYROLL_SLIP', 1, 30),
(2, 'FORM_RECORD', 1, 30),
(3, 'ATTENDANCE_RECORD', 1, 30),
(4, 'CONSTRUCTION_LOG', 1, 30),
(5, 'INJURY_CLAIM', 1, 30),
(6, 'OPERATION_LOG', 1, 30);

-- 重置各表的 IDENTITY 序列
ALTER TABLE employee ALTER COLUMN id RESTART WITH 100;
ALTER TABLE retention_policy ALTER COLUMN id RESTART WITH 100;
ALTER TABLE department ALTER COLUMN id RESTART WITH 100;
ALTER TABLE sys_role ALTER COLUMN id RESTART WITH 100;
ALTER TABLE project ALTER COLUMN id RESTART WITH 100;
ALTER TABLE project_member ALTER COLUMN id RESTART WITH 100;
ALTER TABLE approval_flow_def ALTER COLUMN id RESTART WITH 100;
ALTER TABLE approval_flow_node ALTER COLUMN id RESTART WITH 100;

-- ============================================
-- System Config: initialization status
-- ============================================
MERGE INTO system_config (config_key, config_value, description) KEY (config_key) VALUES ('initialized', 'true', 'System initialization status');

-- ============================================
-- V5: 薪资构成扩展 — 临时补贴表单类型 + 审批流 + 配置开关
-- ============================================
MERGE INTO form_type_def (code, name, is_enabled, is_system) KEY (code) VALUES
('PAYROLL_BONUS', '临时薪资调整', TRUE, TRUE);

MERGE INTO approval_flow_def (id, business_type, version, is_active) KEY (id) VALUES
(5, 'PAYROLL_BONUS', 1, TRUE);

MERGE INTO approval_flow_node (id, flow_id, node_order, node_name, approval_mode, approver_type, approver_ref, skip_condition) KEY (id) VALUES
(8, 5, 1, 'CEO审批', 'SEQUENTIAL', 'ROLE', 'ceo', NULL);

MERGE INTO system_config (config_key, config_value, description) KEY (config_key) VALUES
('payroll_bonus_approval_required', 'false', '临时薪资调整是否需要 CEO 审批');

-- V5: 新增内置工资项（POSITION_SALARY/PERFORMANCE_BONUS/TEMPORARY_BONUS/TEMPORARY_DEDUCT）
MERGE INTO payroll_item_def (code, name, type, display_order, is_enabled, is_system) KEY (code) VALUES
('BASE_SALARY',         '基本工资', 'EARNING',    1, TRUE, TRUE),
('POSITION_SALARY',     '岗位工资', 'EARNING',   11, TRUE, TRUE),
('PERFORMANCE_BONUS',   '绩效奖金', 'EARNING',   12, TRUE, TRUE),
('OVERTIME_PAY',        '加班费',   'EARNING',    2, TRUE, TRUE),
('LEAVE_DEDUCT',        '请假扣款', 'DEDUCTION',  3, TRUE, TRUE),
('SOCIAL_INSURANCE',    '社会保险（个人）', 'DEDUCTION',  4, TRUE, TRUE),
('COMPANY_PAID_SUBSIDY','保险补贴', 'EARNING',    5, TRUE, TRUE),
('TEMPORARY_BONUS',     '临时补贴', 'EARNING',   90, TRUE, TRUE),
('TEMPORARY_DEDUCT',    '临时扣款', 'DEDUCTION', 91, TRUE, TRUE);
