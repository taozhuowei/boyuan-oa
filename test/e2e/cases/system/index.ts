import tc_sys_01_six_roles_concurrent from './tc_sys_01_six_roles_concurrent.ts';
import tc_sys_02_duplicate_approval from './tc_sys_02_duplicate_approval.ts';
import tc_sys_03_duplicate_phone_create from './tc_sys_03_duplicate_phone_create.ts';
import tc_sys_04_concurrent_settle from './tc_sys_04_concurrent_settle.ts';
import tc_sys_05_no_token_api from './tc_sys_05_no_token_api.ts';
import tc_sys_06_expired_token from './tc_sys_06_expired_token.ts';
import tc_sys_07_unauthorized_api from './tc_sys_07_unauthorized_api.ts';
import tc_sys_08_xss_injection from './tc_sys_08_xss_injection.ts';
import tc_sys_09_cors_rejection from './tc_sys_09_cors_rejection.ts';
import tc_sys_10_e2e_leave_flow from './tc_sys_10_e2e_leave_flow.ts';
import tc_sys_11_e2e_payroll_flow from './tc_sys_11_e2e_payroll_flow.ts';
import tc_sys_12_e2e_construction_flow from './tc_sys_12_e2e_construction_flow.ts';
import tc_sys_13_ceo_dashboard_data from './tc_sys_13_ceo_dashboard_data.ts';

export default [
  tc_sys_01_six_roles_concurrent,
  tc_sys_02_duplicate_approval,
  tc_sys_03_duplicate_phone_create,
  tc_sys_04_concurrent_settle,
  tc_sys_05_no_token_api,
  tc_sys_06_expired_token,
  tc_sys_07_unauthorized_api,
  tc_sys_08_xss_injection,
  tc_sys_09_cors_rejection,
  tc_sys_10_e2e_leave_flow,
  tc_sys_11_e2e_payroll_flow,
  tc_sys_12_e2e_construction_flow,
  tc_sys_13_ceo_dashboard_data,
];
