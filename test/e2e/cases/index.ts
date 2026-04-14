/**
 * Root test cases index
 * Aggregates all module test cases for the autotest runner
 */

import auth from './auth/index.js';
import profile from './profile/index.js';
import workbench from './workbench/index.js';
import org from './org/index.js';
import position from './position/index.js';
import role from './role/index.js';
import config from './config/index.js';
import attendance_leave from './attendance_leave/index.js';
import attendance_overtime from './attendance_overtime/index.js';
import injury from './injury/index.js';
import payroll from './payroll/index.js';
import project from './project/index.js';
import construction from './construction/index.js';
import forms from './forms/index.js';
import notification from './notification/index.js';
import directory from './directory/index.js';
import operation_logs from './operation_logs/index.js';
import system from './system/index.js';

export default [
  ...auth,
  ...profile,
  ...workbench,
  ...org,
  ...position,
  ...role,
  ...config,
  ...attendance_leave,
  ...attendance_overtime,
  ...injury,
  ...payroll,
  ...project,
  ...construction,
  ...forms,
  ...notification,
  ...directory,
  ...operation_logs,
  ...system,
];
