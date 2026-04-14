/**
 * Test cases root index
 * Purpose: Aggregate all module test cases
 */

import auth from './auth/index.js';
import workbench from './workbench/index.js';
import position from './position/index.js';
import role from './role/index.js';
import config from './config/index.js';
import profile from './profile/index.js';
import forms from './forms/index.js';
import directory from './directory/index.js';
import operationLogs from './operation-logs/index.js';

export default [
  ...auth,
  ...workbench,
  ...position,
  ...role,
  ...config,
  ...profile,
  ...forms,
  ...directory,
  ...operationLogs,
];
