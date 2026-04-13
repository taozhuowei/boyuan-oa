/**
 * Test cases root index
 * Purpose: Aggregate all module test cases
 */

import auth from './auth/index.js';
import workbench from './workbench/index.js';

export default [...auth, ...workbench];
