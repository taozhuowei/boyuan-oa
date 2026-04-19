/**
 * normal.js — Normal load test
 *
 * Purpose: Validate baseline performance under expected production load.
 * Config:  50 VUs × 5 minutes
 * Thresholds: P99 < 500ms, error rate < 1%
 *
 * Each VU is assigned a role by round-robin (__VU % 4).
 * Every iteration calls GET /api/notifications (all roles have access)
 * plus one role-appropriate read endpoint.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '5m',
  thresholds: {
    // P99 latency under 500ms for normal load
    http_req_duration: ['p(99)<500'],
    // Less than 1% of requests may fail
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
 * Role-to-endpoint mapping.
 * Each role calls one endpoint it is authorised to read.
 * Source: DESIGN.md §3 (role permissions).
 */
const ROLE_ENDPOINTS = [
  { role: 'ceo',      endpoint: '/api/employees' },
  { role: 'hr',       endpoint: '/api/positions' },
  { role: 'finance',  endpoint: '/api/payroll/cycles' },
  { role: 'employee', endpoint: '/api/notifications' },
];

export default function (data) {
  // Round-robin role assignment: stable within a VU's lifetime
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
