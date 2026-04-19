/**
 * peak.js — Peak load test
 *
 * Purpose: Validate system behaviour at 4× normal concurrency (simulated traffic spike).
 * Config:  200 VUs × 5 minutes
 * Thresholds: P99 < 1000ms, error rate < 1%
 *
 * Endpoint mix is identical to normal.js so results are directly comparable.
 * The only differences from normal.js are VU count and the P99 threshold.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 200,
  duration: '5m',
  thresholds: {
    // P99 latency allowed to grow to 1 s under peak load
    http_req_duration: ['p(99)<1000'],
    // Error rate must still stay below 1%
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:8080';

/** Login a single user and return the JWT token string. */
function login(username) {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ username, password: '123456' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (res.status !== 200) {
    throw new Error(`Login failed for ${username}: HTTP ${res.status} — ${res.body}`);
  }
  const token = res.json('token');
  if (!token) {
    throw new Error(`No token in login response for ${username}: ${res.body}`);
  }
  return token;
}

/**
 * setup() runs once before the test.
 * Returns a token map consumed by every VU via the `data` parameter.
 */
export function setup() {
  return {
    tokens: {
      ceo: login('ceo.demo'),
      hr: login('hr.demo'),
      finance: login('finance.demo'),
      employee: login('employee.demo'),
    },
  };
}

/**
 * Role-to-endpoint mapping (same as normal.js for comparability).
 * Source: DESIGN.md §3 (role permissions).
 */
const ROLE_ENDPOINTS = [
  { role: 'ceo',      endpoint: '/api/employees' },
  { role: 'hr',       endpoint: '/api/positions' },
  { role: 'finance',  endpoint: '/api/payroll/cycles' },
  { role: 'employee', endpoint: '/api/notifications' },
];

export default function (data) {
  // Round-robin role assignment across 200 VUs
  const roleIndex = (__VU - 1) % ROLE_ENDPOINTS.length;
  const { role, endpoint } = ROLE_ENDPOINTS[roleIndex];
  const token = data.tokens[role];

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Call 1: shared endpoint every role can read
  const notifRes = http.get(`${BASE_URL}/api/notifications`, { headers });
  check(notifRes, {
    'notifications 200': (r) => r.status === 200,
  });

  // Call 2: role-appropriate endpoint
  const roleRes = http.get(`${BASE_URL}${endpoint}`, { headers });
  check(roleRes, {
    [`${role} endpoint 200`]: (r) => r.status === 200,
  });

  sleep(1);
}
