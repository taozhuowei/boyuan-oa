-- V14 核心高频查询表索引
-- 范围：form_record / approval_record / notification / payroll_slip / payroll_slip_item / employee
-- 兼容：H2（dev）+ PostgreSQL（prod）
-- 说明：仅添加单列索引；复合索引按实际查询模式在后续版本细化

-- form_record
CREATE INDEX IF NOT EXISTS idx_form_record_submitter_id ON form_record(submitter_id);
CREATE INDEX IF NOT EXISTS idx_form_record_project_id   ON form_record(project_id);
CREATE INDEX IF NOT EXISTS idx_form_record_status       ON form_record(status);

-- approval_record
CREATE INDEX IF NOT EXISTS idx_approval_record_form_id     ON approval_record(form_id);
CREATE INDEX IF NOT EXISTS idx_approval_record_approver_id ON approval_record(approver_id);

-- notification
CREATE INDEX IF NOT EXISTS idx_notification_recipient_id ON notification(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_is_read      ON notification(is_read);

-- payroll_slip
CREATE INDEX IF NOT EXISTS idx_payroll_slip_employee_id ON payroll_slip(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_slip_cycle_id    ON payroll_slip(cycle_id);

-- payroll_slip_item
CREATE INDEX IF NOT EXISTS idx_payroll_slip_item_slip_id ON payroll_slip_item(slip_id);

-- employee
CREATE INDEX IF NOT EXISTS idx_employee_department_id ON employee(department_id);
CREATE INDEX IF NOT EXISTS idx_employee_role_code     ON employee(role_code);
