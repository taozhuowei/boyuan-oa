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

-- ============================================
-- 测试账号（7条）- 密码统一为 "123456"
-- bcrypt hash: $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi
-- ============================================
MERGE INTO employee (id, employee_no, password_hash, is_default_password, name, phone, email,
    role_code, employee_type, department_id, account_status, entry_date)
KEY (id) VALUES
(1, 'employee.demo',     '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '张晓宁', '13800000001', 'zhangxn@oa.demo',  'employee',           'OFFICE', 1, 'ACTIVE', '2024-01-01'),
(2, 'finance.demo',      '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '李静',   '13800000002', 'lij@oa.demo',       'finance',            'OFFICE', 2, 'ACTIVE', '2024-01-01'),
(3, 'pm.demo',           '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '王建国', '13800000003', 'wangjg@oa.demo',    'project_manager',    'OFFICE', 3, 'ACTIVE', '2024-01-01'),
(4, 'ceo.demo',          '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '陈明远', '13800000004', 'chenmy@oa.demo',    'ceo',                'OFFICE', 4, 'ACTIVE', '2024-01-01'),
(5, 'worker.demo',       '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '赵铁柱', '13800000005', 'zhaotz@oa.demo',    'worker',             'LABOR',  5, 'ACTIVE', '2024-01-01'),
(6, 'hr.demo',           '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '李思文', '13800000006', 'lsw@oa.demo',       'hr',                 'OFFICE', 1, 'ACTIVE', '2024-01-01'),
(7, 'dept_manager.demo', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '周伟',   '13800000007', 'zhouw@oa.demo',     'department_manager', 'OFFICE', 1, 'ACTIVE', '2024-01-01'),
(8, 'sys_admin.demo',     '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '刘运维', '13800000008', 'lyw@oa.demo',       'sys_admin',          'OFFICE', 1, 'ACTIVE', '2024-01-01');

-- 直系领导关系
UPDATE employee SET direct_supervisor_id = 7 WHERE id = 1;
UPDATE employee SET direct_supervisor_id = 3 WHERE id = 5;
UPDATE employee SET direct_supervisor_id = 4 WHERE id IN (3, 6, 7);

-- 角色数据（9条）- 使用 MERGE INTO 避免重复
MERGE INTO sys_role (id, role_code, role_name, description, status, is_system)
KEY (id) VALUES
(1, 'employee', '员工', '发起和查看本人业务单据，查看并确认工资条。', 1, 1),
(2, 'finance', '财务', '维护人员与薪资配置，执行结算、复核异议、导出数据。', 1, 1),
(3, 'project_manager', '项目经理', '处理项目范围内审批，维护项目施工日志模板，查看项目总览。', 1, 1),
(4, 'ceo', '首席经营者', '管理全局配置、终审审批、配置角色权限、查看经营总览。', 1, 1),
(5, 'worker', '劳工', '施工现场工作人员，可使用施工日志和工伤补偿相关功能。', 1, 1),
(6, 'hr', '人力资源', '维护人员与薪资配置，执行结算、复核异议、导出数据。', 1, 1),
(7, 'general_manager', '总经理', '介于 CEO 与各部门负责人之间；可加入审批流末端链；可见全项目但不可见考勤/薪资/HR 档案。', 1, 1),
(8, 'department_manager', '部门经理', '员工考勤审批、部门管理，可查看本部门员工基本信息与考勤记录。', 1, 1),
(9, 'sys_admin', '系统管理员', '系统运维，仅访问运维工具与操作日志，不参与业务流程', 1, 1);

-- ============================================
-- Phase 3: 项目种子数据
-- ============================================
MERGE INTO project (id, name, status, start_date, log_cycle_days)
KEY (id) VALUES
(1, '万达广场中央空调安装工程', 'ACTIVE', '2026-01-15', 1),
(2, '科技园区通风改造项目', 'ACTIVE', '2026-02-01', 1);

-- 项目成员：pm.demo(id=3) 作为 PM，worker.demo(id=5) 作为 MEMBER
MERGE INTO project_member (project_id, employee_id, role)
KEY (project_id, employee_id) VALUES
(1, 3, 'PM'),
(1, 5, 'MEMBER'),
(2, 3, 'PM');

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
ALTER TABLE position ALTER COLUMN id RESTART WITH 100;
ALTER TABLE allowance_def ALTER COLUMN id RESTART WITH 100;
ALTER TABLE allowance_config ALTER COLUMN id RESTART WITH 100;

-- ============================================
-- System Config: initialization status
-- ============================================
MERGE INTO system_config (config_key, config_value, description) KEY (config_key) VALUES ('initialized', 'true', 'System initialization status');

-- ============================================
-- V3: 报销类型默认种子数据（H2 dev 环境）
-- Flyway V3 已建表并含 ON CONFLICT INSERT，H2 需用 MERGE INTO 同步
-- ============================================
MERGE INTO expense_type_def (code, name, description, require_invoice, display_order, is_enabled, is_system)
KEY (code) VALUES
('TRAVEL', '差旅费', '出差期间的交通、住宿等费用', TRUE, 1, TRUE, TRUE),
('MEAL', '餐饮费', '出差期间的餐饮补贴', TRUE, 2, TRUE, TRUE),
('ACCOMMODATION', '住宿费', '出差期间的住宿费用', TRUE, 3, TRUE, TRUE),
('TRANSPORT', '交通费', '打车、公共交通等费用', TRUE, 4, TRUE, TRUE),
('OFFICE', '办公用品', '办公耗材、用品等', TRUE, 5, TRUE, TRUE),
('OTHER', '其他', '其他报销费用', FALSE, 99, TRUE, TRUE);

-- ============================================
-- V5: 薪资构成扩展 — 临时补贴表单类型 + 审批流 + 配置开关
-- ============================================
MERGE INTO form_type_def (code, name, is_enabled, is_system) KEY (code) VALUES
('PAYROLL_BONUS', '临时薪资调整', TRUE, TRUE),
('PAYROLL_CORRECTION', '薪资更正', TRUE, TRUE),
('PAYROLL_REVENUE_CHANGE', '营收金额变更', TRUE, TRUE);

MERGE INTO approval_flow_def (id, business_type, version, is_active) KEY (id) VALUES
(5, 'PAYROLL_BONUS', 1, TRUE),
(6, 'PAYROLL_CORRECTION', 1, TRUE),
(7, 'PAYROLL_REVENUE_CHANGE', 1, TRUE);

MERGE INTO approval_flow_node (id, flow_id, node_order, node_name, approval_mode, approver_type, approver_ref, skip_condition) KEY (id) VALUES
(8, 5, 1, 'CEO审批', 'SEQUENTIAL', 'ROLE', 'ceo', NULL),
(9, 6, 1, 'CEO审批', 'SEQUENTIAL', 'ROLE', 'ceo', NULL),
(10, 7, 1, '对方审批', 'SEQUENTIAL', 'ROLE', 'ceo', NULL);

-- B-FEAT-16: EXPENSE approval flow seed (报销审批流)
MERGE INTO approval_flow_def (id, business_type, version, is_active) KEY (id) VALUES
(8, 'EXPENSE', 1, TRUE);

MERGE INTO approval_flow_node (id, flow_id, node_order, node_name, approval_mode, approver_type, approver_ref, skip_condition) KEY (id) VALUES
(11, 8, 1, '财务审批', 'SEQUENTIAL', 'ROLE', 'finance', NULL),
(12, 8, 2, 'CEO终审', 'SEQUENTIAL', 'ROLE', 'ceo', NULL);

MERGE INTO system_config (config_key, config_value, description) KEY (config_key) VALUES
('payroll_bonus_approval_required', 'false', '临时薪资调整是否需要 CEO 审批');

-- V5/V9: 新增内置工资项（V9 增 category 列：EARNING 应发组 / DEDUCTION 扣减组）
MERGE INTO payroll_item_def (code, name, type, category, display_order, is_enabled, is_system) KEY (code) VALUES
('BASE_SALARY',         '基本工资',         'EARNING',   'EARNING',    1, TRUE, TRUE),
('POSITION_SALARY',     '岗位工资',         'EARNING',   'EARNING',   11, TRUE, TRUE),
('PERFORMANCE_BONUS',   '绩效奖金',         'EARNING',   'EARNING',   12, TRUE, TRUE),
('OVERTIME_PAY',        '加班费',           'EARNING',   'EARNING',    2, TRUE, TRUE),
('LEAVE_DEDUCT',        '请假扣款',         'DEDUCTION', 'DEDUCTION',  3, TRUE, TRUE),
('SOCIAL_INSURANCE',    '社会保险（个人）', 'DEDUCTION', 'DEDUCTION',  4, TRUE, TRUE),
('COMPANY_PAID_SUBSIDY','保险补贴',         'EARNING',   'EARNING',    5, TRUE, TRUE),
('TEMPORARY_BONUS',     '临时补贴',         'EARNING',   'EARNING',   90, TRUE, TRUE),
('TEMPORARY_DEDUCT',    '临时扣款',         'DEDUCTION', 'DEDUCTION', 91, TRUE, TRUE);

-- V7: 第二角色定义 + 售后问题类型种子
MERGE INTO second_role_def (code, name, applies_to, project_bound, description, is_system, is_enabled) KEY (code) VALUES
('AFTER_SALES',      '售后',     'OFFICE', TRUE, '项目结束后处理售后问题单',     TRUE, TRUE),
('MATERIAL_MANAGER', '物资管理', 'OFFICE', TRUE, '录入项目实体成本',             TRUE, TRUE),
('FOREMAN',          '工长',     'LABOR',  TRUE, '提交施工日志，可代录工伤',     TRUE, TRUE);

MERGE INTO after_sale_type_def (code, name, display_order, is_system, is_enabled) KEY (code) VALUES
('QUALITY',      '质量问题',                1, TRUE, TRUE),
('CONSTRUCTION', '施工问题',                2, TRUE, TRUE),
('NON_QUALITY',  '非质量问题（客户原因）', 3, TRUE, TRUE);

-- ============================================
-- B-P1-02: 假期类型种子数据（6条内置类型）
-- 字段来源：schema.sql leave_type_def 表定义
-- ============================================
MERGE INTO leave_type_def (code, name, deduction_rate, is_enabled, is_system, display_order, quota_days, deduction_basis) KEY (code) VALUES
('ANNUAL',       '年假',   0.00, TRUE, TRUE, 1,  10,  'DAILY_SALARY'),
('SICK',         '病假',   0.50, TRUE, TRUE, 2,  30,  'DAILY_SALARY'),
('PERSONAL',     '事假',   1.00, TRUE, TRUE, 3,  0,   'DAILY_SALARY'),
('MARRIAGE',     '婚假',   0.00, TRUE, TRUE, 4,  3,   'DAILY_SALARY'),
('MATERNITY',    '产假',   0.00, TRUE, TRUE, 5,  90,  'DAILY_SALARY'),
('COMPENSATORY', '调休假', 0.00, TRUE, FALSE, 6, 3,   'DAILY_WAGE');

-- 岗位和补贴配置由财务/HR 在运营期自由创建，系统不内置固定数据（DESIGN.md §3.4, §6.4）

-- ============================================
-- B-P3-03: CEO 考勤记录种子数据
-- 以 form_record 写入请假/加班记录（submitter_id = ceo.demo 员工 id）
-- 使用子查询：若 ceo.demo 账号不存在则跳过，保证幂等性
-- ============================================
INSERT INTO form_record (id, form_type, submitter_id, form_data, status, current_node_order)
SELECT 1001, 'LEAVE', e.id,
    '{"leaveType":"年假","startDate":"2026-03-10","endDate":"2026-03-12","days":3,"reason":"年假休整"}',
    'APPROVED', 2
FROM employee e WHERE e.employee_no = 'ceo.demo'
AND NOT EXISTS (SELECT 1 FROM form_record WHERE id = 1001);

INSERT INTO form_record (id, form_type, submitter_id, form_data, status, current_node_order)
SELECT 1002, 'OVERTIME', e.id,
    '{"overtimeDate":"2026-03-15","startTime":"18:00","endTime":"21:00","hours":3,"reason":"项目进度保障"}',
    'APPROVED', 2
FROM employee e WHERE e.employee_no = 'ceo.demo'
AND NOT EXISTS (SELECT 1 FROM form_record WHERE id = 1002);

INSERT INTO form_record (id, form_type, submitter_id, form_data, status, current_node_order)
SELECT 1003, 'LEAVE', e.id,
    '{"leaveType":"事假","startDate":"2026-04-01","endDate":"2026-04-01","days":1,"reason":"私事处理"}',
    'APPROVED', 2
FROM employee e WHERE e.employee_no = 'ceo.demo'
AND NOT EXISTS (SELECT 1 FROM form_record WHERE id = 1003);

ALTER TABLE form_record ALTER COLUMN id RESTART WITH 2000;
