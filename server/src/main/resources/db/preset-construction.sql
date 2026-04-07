-- ============================================
-- 建筑工程版预置种子数据
-- 由 Sysadmin 初始化向导手动触发加载
-- ============================================

-- ============================================
-- 1. 角色预置（避免重复）
-- ============================================
MERGE INTO sys_role (id, role_code, role_name, description, status, is_system) 
KEY (id) VALUES
(1, 'employee', '员工', '发起和查看本人业务单据，查看并确认工资条。', 1, 1),
(2, 'finance', '财务', '维护人员与薪资配置，执行结算、复核异议、导出数据。', 1, 1),
(3, 'project_manager', '项目经理', '处理项目范围内审批，维护项目施工日志模板，查看项目总览。', 1, 1),
(4, 'ceo', '首席经营者', '管理全局配置、终审审批、配置角色权限、查看经营总览。', 1, 1),
(5, 'worker', '劳工', '施工现场工作人员，可使用施工日志和工伤补偿相关功能。', 1, 1);

-- ============================================
-- 2. 岗位预置
-- ============================================
MERGE INTO position (id, position_code, position_name, employee_category, default_role_code, requires_construction_log, has_performance_bonus, base_salary, overtime_rate_weekday, overtime_rate_weekend, overtime_rate_holiday, annual_leave)
KEY (id) VALUES
(1, 'CEO', 'CEO', 'OFFICE', 'ceo', FALSE, FALSE, NULL, 1.5, 2.0, 3.0, 10),
(2, 'FINANCE', '财务', 'OFFICE', 'finance', FALSE, FALSE, NULL, 1.5, 2.0, 3.0, 10),
(3, 'PROJECT_MANAGER', '项目经理', 'OFFICE', 'project_manager', FALSE, TRUE, NULL, 1.5, 2.0, 3.0, 10),
(4, 'OFFICE_STAFF', '办公人员', 'OFFICE', 'employee', FALSE, FALSE, NULL, 1.5, 2.0, 3.0, 5),
(5, 'LABOR_WORKER', '劳工', 'LABOR', 'worker', TRUE, FALSE, NULL, 1.5, 2.0, 3.0, 5),
(6, 'WELDER', '焊工', 'LABOR', 'worker', TRUE, FALSE, NULL, 1.5, 2.0, 3.0, 5),
(7, 'PIPE_FITTER', '管工', 'LABOR', 'worker', TRUE, FALSE, NULL, 1.5, 2.0, 3.0, 5);

-- ============================================
-- 3. 假期类型预置（is_system=true）
-- ============================================
MERGE INTO leave_type_def (id, code, name, deduction_rate, is_enabled, is_system, display_order)
KEY (id) VALUES
(1, 'ANNUAL_LEAVE', '年休假', 0, TRUE, TRUE, 1),
(2, 'PERSONAL_LEAVE', '事假', 1.0, TRUE, TRUE, 2),
(3, 'SICK_LEAVE', '病假', 0.5, TRUE, TRUE, 3),
(4, 'MARRIAGE_LEAVE', '婚假', 0, TRUE, TRUE, 4),
(5, 'MATERNITY_LEAVE', '产假', 0, TRUE, TRUE, 5),
(6, 'BEREAVEMENT_LEAVE', '丧假', 0, TRUE, TRUE, 6);

-- ============================================
-- 4. 审批流预置
-- ============================================

-- 请假审批流
MERGE INTO approval_flow_def (id, business_type, version, is_active)
KEY (id) VALUES (1, 'LEAVE_REQUEST', 1, TRUE);

MERGE INTO approval_flow_node (id, flow_id, node_order, node_name, approval_mode, approver_type, approver_ref)
KEY (id) VALUES
(1, 1, 1, '直系领导初审', 'SEQUENTIAL', 'DIRECT_SUPERVISOR', NULL),
(2, 1, 2, 'CEO终审', 'SEQUENTIAL', 'ROLE', 'ceo');

-- 加班自补申请审批流
MERGE INTO approval_flow_def (id, business_type, version, is_active)
KEY (id) VALUES (2, 'OVERTIME_SELF_APPLY', 1, TRUE);

MERGE INTO approval_flow_node (id, flow_id, node_order, node_name, approval_mode, approver_type, approver_ref)
KEY (id) VALUES
(3, 2, 1, '直系领导初审', 'SEQUENTIAL', 'DIRECT_SUPERVISOR', NULL),
(4, 2, 2, 'CEO终审', 'SEQUENTIAL', 'ROLE', 'ceo');

-- 工伤补偿审批流
MERGE INTO approval_flow_def (id, business_type, version, is_active)
KEY (id) VALUES (3, 'INJURY_COMPENSATION', 1, TRUE);

MERGE INTO approval_flow_node (id, flow_id, node_order, node_name, approval_mode, approver_type, approver_ref, skip_condition)
KEY (id) VALUES
(5, 3, 1, '项目经理初审', 'SEQUENTIAL', 'ROLE', 'project_manager', '{"type":"SUBMITTER_ROLE_MATCH","roleCode":"project_manager"}'),
(6, 3, 2, 'CEO终审', 'SEQUENTIAL', 'ROLE', 'ceo', NULL);

-- ============================================
-- 5. 保留策略预置
-- ============================================
MERGE INTO retention_policy (id, data_type, retention_years, warn_before_days)
KEY (id) VALUES
(1, 'FORM_RECORD', 1, 30),
(2, 'PAYROLL_SLIP', 1, 30),
(3, 'OPERATION_LOG', 1, 30),
(4, 'ATTACHMENT', 1, 30),
(5, 'CONSTRUCTION_LOG', 1, 30);

-- ============================================
-- 6. 工资项预置（is_system=true）
-- ============================================
MERGE INTO payroll_item_def (id, code, name, type, display_order, is_enabled, is_system)
KEY (id) VALUES
(1, 'BASE_SALARY', '基本工资', 'EARNING', 1, TRUE, TRUE),
(2, 'PERFORMANCE_BONUS', '绩效奖金', 'EARNING', 2, TRUE, TRUE),
(3, 'OVERTIME_ALLOWANCE', '加班补贴', 'EARNING', 3, TRUE, TRUE),
(4, 'LEAVE_DEDUCTION', '请假扣款', 'DEDUCTION', 4, TRUE, TRUE),
(5, 'INJURY_COMPENSATION', '工伤补偿', 'EARNING', 5, TRUE, TRUE),
(6, 'SOCIAL_INSURANCE_EE', '社保个人', 'DEDUCTION', 6, TRUE, TRUE),
(7, 'HOUSING_FUND_EE', '公积金个人', 'DEDUCTION', 7, TRUE, TRUE),
(8, 'OTHER_DEDUCTION', '其他扣款', 'DEDUCTION', 8, TRUE, TRUE);

-- ============================================
-- 7. 系统配置预置
-- ============================================
MERGE INTO system_config (config_key, config_value, description)
KEY (config_key) VALUES
('company.name', '众维建筑工程有限公司', '公司名称'),
('payroll.overtime_rate_weekday', '1.5', '工作日加班倍数'),
('payroll.overtime_rate_weekend', '2.0', '周末加班倍数'),
('payroll.overtime_rate_holiday', '3.0', '节假日加班倍数'),
('payroll.pay_day', '25', '每月发薪日'),
('payroll.window_days', '7', '工资条确认窗口天数');
