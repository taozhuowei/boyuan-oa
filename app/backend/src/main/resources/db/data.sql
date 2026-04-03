-- ============================================
-- Phase 0B: 开发环境测试数据
-- 5个测试账号 + 5个部门 + 5个角色
-- ============================================

-- 部门数据（5条）
INSERT INTO department (id, parent_id, name, sort) VALUES
(1, NULL, '综合管理部', 1),
(2, NULL, '财务管理部', 2),
(3, NULL, '项目一部', 3),
(4, NULL, '运营管理部', 4),
(5, NULL, '施工一部', 5);

-- 角色数据（5条）- 使用 MERGE INTO 避免重复
MERGE INTO sys_role (id, role_code, role_name, description, status, is_system) 
KEY (id) VALUES
(1, 'employee', '员工', '发起和查看本人业务单据，查看并确认工资条。', 1, 1),
(2, 'finance', '财务', '维护人员与薪资配置，执行结算、复核异议、导出数据。', 1, 1),
(3, 'project_manager', '项目经理', '处理项目范围内审批，维护项目施工日志模板，查看项目总览。', 1, 1),
(4, 'ceo', '首席经营者', '管理全局配置、终审审批、配置角色权限、查看经营总览。', 1, 1),
(5, 'worker', '劳工', '施工现场工作人员，可使用施工日志和工伤补偿相关功能。', 1, 1);

-- 测试账号数据（5条）
-- 密码统一使用 bcrypt 加密后的 "123456": $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi
INSERT INTO employee (
    id, employee_no, password_hash, is_default_password, name, phone, email,
    role_code, employee_type, department_id, account_status, entry_date
) VALUES
(1, 'employee.demo', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '张晓宁', '13800000001', 'zhangxn@oa.demo', 'employee', 'OFFICE', 1, 'ACTIVE', '2024-01-01'),
(2, 'finance.demo', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '李静', '13800000002', 'lij@oa.demo', 'finance', 'OFFICE', 2, 'ACTIVE', '2024-01-01'),
(3, 'pm.demo', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '王建国', '13800000003', 'wangjg@oa.demo', 'project_manager', 'OFFICE', 3, 'ACTIVE', '2024-01-01'),
(4, 'ceo.demo', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '陈明远', '13800000004', 'chenmy@oa.demo', 'ceo', 'OFFICE', 4, 'ACTIVE', '2024-01-01'),
(5, 'worker.demo', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', TRUE, '赵铁柱', '13800000005', 'zhaotz@oa.demo', 'worker', 'LABOR', 5, 'ACTIVE', '2024-01-01');

-- ============================================
-- Phase 3: 项目种子数据
-- ============================================

-- 项目种子数据（2条）- 使用 MERGE INTO 避免重复
MERGE INTO project (id, name, status, start_date, log_cycle_days)
KEY (id) VALUES
(1, '万达广场中央空调安装工程', 'ACTIVE', '2026-01-15', 1),
(2, '科技园区通风改造项目', 'ACTIVE', '2026-02-01', 1);

-- 项目成员（王建国 pm.demo = employee id 3 作为 PM）- 使用 MERGE INTO 避免重复
MERGE INTO project_member (project_id, employee_id, role)
KEY (project_id, employee_id) VALUES
(1, 3, 'PM'),
(1, 5, 'MEMBER'),
(2, 3, 'PM');

-- 重置各表的 IDENTITY 序列，避免手动插入 ID 后序列冲突
ALTER TABLE employee ALTER COLUMN id RESTART WITH 100;
ALTER TABLE department ALTER COLUMN id RESTART WITH 100;
ALTER TABLE sys_role ALTER COLUMN id RESTART WITH 100;
ALTER TABLE project ALTER COLUMN id RESTART WITH 100;
ALTER TABLE project_member ALTER COLUMN id RESTART WITH 100;
