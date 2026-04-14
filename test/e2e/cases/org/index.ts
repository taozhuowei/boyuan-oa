/**
 * Org module test cases index
 * Purpose: Aggregate all organization test cases
 */

import tc01 from './tc_org_01_create_department.js';
import tc02 from './tc_org_02_edit_department.js';
import tc03 from './tc_org_03_create_employee.js';
import tc04 from './tc_org_04_new_employee_login.js';
import tc05 from './tc_org_05_edit_employee.js';
import tc06 from './tc_org_06_employee_search.js';
import tc07 from './tc_org_07_disable_employee.js';
import tc08 from './tc_org_08_enable_employee.js';
import tc09 from './tc_org_09_org_tree.js';
import tc10 from './tc_org_10_employee_detail.js';
import tc11 from './tc_org_11_create_employee_no_name.js';
import tc12 from './tc_org_12_create_employee_no_phone.js';
import tc13 from './tc_org_13_invalid_phone_format.js';
import tc14 from './tc_org_14_duplicate_phone.js';
import tc15 from './tc_org_15_create_employee_no_dept.js';
import tc16 from './tc_org_16_finance_create_employee_forbidden.js';
import tc17 from './tc_org_17_delete_dept_with_employees.js';
import tc18 from './tc_org_18_concurrent_edit.js';

export default [
  tc01, tc02, tc03, tc04, tc05, tc06,
  tc07, tc08, tc09, tc10, tc11, tc12,
  tc13, tc14, tc15, tc16, tc17, tc18,
];
