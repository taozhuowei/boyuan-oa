/**
 * Profile module test cases index
 * Purpose: Aggregate all profile test cases
 */

import tc01 from './tc_prof_01_ceo_profile_display.js';
import tc02 from './tc_prof_02_employee_profile_display.js';
import tc03 from './tc_prof_03_change_password_success.js';
import tc04 from './tc_prof_04_old_password_invalid.js';
import tc05 from './tc_prof_05_initial_password_warning.js';
import tc06 from './tc_prof_06_warning_banner_navigates.js';
import tc07 from './tc_prof_07_banner_disappears.js';
import tc08 from './tc_prof_08_wrong_old_password.js';
import tc09 from './tc_prof_09_password_mismatch.js';
import tc10 from './tc_prof_10_password_too_short.js';
import tc11 from './tc_prof_11_same_password_rejected.js';

export default [
  tc01, tc02, tc03, tc04, tc05,
  tc06, tc07, tc08, tc09, tc10,
  tc11,
];
