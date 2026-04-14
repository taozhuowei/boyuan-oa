/**
 * Workbench module test cases index
 * Purpose: Aggregate all workbench test cases
 */

import tc01 from './tc_workbench_01_ceo_summary.js';
import tc02 from './tc_workbench_02_active_project_click.js';
import tc03 from './tc_workbench_03_pm_todo_count.js';
import tc04 from './tc_workbench_04_employee_payroll_summary.js';
import tc05 from './tc_workbench_05_hr_menu_permissions.js';
import tc06 from './tc_workbench_06_worker_menu_permissions.js';
import tc07 from './tc_workbench_07_hr_payroll_url_forbidden.js';
import tc08 from './tc_workbench_08_employee_employees_url_forbidden.js';
import tc09 from './tc_workbench_09_worker_operation_logs_forbidden.js';

export default [
  tc01, tc02, tc03, tc04, tc05,
  tc06, tc07, tc08, tc09,
];
