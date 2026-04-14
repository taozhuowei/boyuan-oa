/**
 * Auth module test cases index
 * Purpose: Aggregate all authentication test cases
 */

import tc01 from './tc_auth_01_ceo_login.js';
import tc02 from './tc_auth_02_hr_login.js';
import tc03 from './tc_auth_03_finance_login.js';
import tc04 from './tc_auth_04_pm_login.js';
import tc05 from './tc_auth_05_employee_login.js';
import tc06 from './tc_auth_06_refresh_session.js';
import tc07 from './tc_auth_07_logout_redirect.js';
import tc08 from './tc_auth_08_token_expired_redirect.js';
import tc09 from './tc_auth_09_wrong_password.js';
import tc10 from './tc_auth_10_nonexistent_user.js';
import tc11 from './tc_auth_11_empty_username.js';
import tc12 from './tc_auth_12_empty_password.js';
import tc13 from './tc_auth_13_empty_both.js';
import tc14 from './tc_auth_14_sql_injection.js';
import tc15 from './tc_auth_15_long_username.js';
import tc16 from './tc_auth_16_special_char_password.js';
import tc17 from './tc_auth_17_token_expired_redirect_api.js';
import tc18 from './tc_auth_18_disabled_user.js';
import tc19 from './tc_auth_19_concurrent_login.js';
import tc20 from './tc_auth_20_duplicate_session.js';

export default [
  tc01, tc02, tc03, tc04, tc05,
  tc06, tc07, tc08, tc09, tc10,
  tc11, tc12, tc13, tc14, tc15,
  tc16, tc17, tc18, tc19, tc20,
];
