/**
 * Role module test cases index
 * Purpose: Aggregate all role test cases
 */

import tc01 from './tc_role_01_role_list_display.js';
import tc02 from './tc_role_02_create_custom_role.js';
import tc03 from './tc_role_03_custom_role_in_dropdown.js';
import tc04 from './tc_role_04_edit_custom_role_permissions.js';
import tc05 from './tc_role_05_delete_unused_custom_role.js';
import tc06 from './tc_role_06_delete_builtin_role_rejected.js';
import tc07 from './tc_role_07_empty_role_name_error.js';
import tc08 from './tc_role_08_delete_used_custom_role_rejected.js';
import tc09 from './tc_role_09_hr_access_role_forbidden.js';

export default [
  tc01, tc02, tc03, tc04, tc05,
  tc06, tc07, tc08, tc09,
];
