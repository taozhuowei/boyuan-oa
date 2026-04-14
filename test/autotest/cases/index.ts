/**
 * Test cases root index
 * Purpose: Aggregate all module test cases (18 modules, 196 cases)
 */

import auth from './auth/index.js';
import profile from './profile/index.js';
import workbench from './workbench/index.js';
import org from './org/index.js';
import position from './position/index.js';
import role from './role/index.js';
import config from './config/index.js';
import leave from './leave/index.js';
import overtime from './overtime/index.js';
import injury from './injury/index.js';
import payroll from './payroll/index.js';
import project from './project/index.js';
import construction from './construction/index.js';
import forms from './forms/index.js';
import notification from './notification/index.js';
import directory from './directory/index.js';
import operationLogs from './operation-logs/index.js';
import system from './system/index.js';

export default [
  ...auth,
  ...profile,
  ...workbench,
  ...org,
  ...position,
  ...role,
  ...config,
  ...leave,
  ...overtime,
  ...injury,
  ...payroll,
  ...project,
  ...construction,
  ...forms,
  ...notification,
  ...directory,
  ...operationLogs,
  ...system,
];
