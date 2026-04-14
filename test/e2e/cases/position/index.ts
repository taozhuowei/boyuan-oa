/**
 * Position module test cases index
 * Purpose: Aggregate all position test cases
 */

import tc01 from './tc_pos_01_create_position.js';
import tc02 from './tc_pos_02_create_position_levels.js';
import tc03 from './tc_pos_03_new_position_in_dropdown.js';
import tc04 from './tc_pos_04_edit_position_name.js';
import tc05 from './tc_pos_05_edit_level_salary.js';
import tc06 from './tc_pos_06_delete_unused_position.js';
import tc07 from './tc_pos_07_empty_position_name_error.js';
import tc08 from './tc_pos_08_delete_position_with_employees.js';
import tc09 from './tc_pos_09_hr_delete_position_forbidden.js';

export default [
  tc01, tc02, tc03, tc04, tc05,
  tc06, tc07, tc08, tc09,
];
