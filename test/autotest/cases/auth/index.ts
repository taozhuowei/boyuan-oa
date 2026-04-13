/**
 * Auth module test cases index
 * Purpose: Aggregate all authentication test cases
 */

import tc01 from './tc_auth_01_login_success.js';
import tc02 from './tc_auth_02_hr_login.js';
import tc09 from './tc_auth_09_wrong_password.js';
import tc11 from './tc_auth_11_empty_username.js';
import tc12 from './tc_auth_12_empty_password.js';

export default [tc01, tc02, tc09, tc11, tc12];
