/**
 * Role module test cases
 */

import tc_role_01_list_roles from './tc_role_01_list_roles.js';
import tc_role_02_create_custom_role from './tc_role_02_create_custom_role.js';
import tc_role_06_delete_system_role from './tc_role_06_delete_system_role.js';
import tc_role_09_hr_no_access from './tc_role_09_hr_no_access.js';

export default [
  tc_role_01_list_roles,
  tc_role_02_create_custom_role,
  tc_role_06_delete_system_role,
  tc_role_09_hr_no_access,
];
