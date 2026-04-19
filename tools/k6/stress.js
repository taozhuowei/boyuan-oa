/**
 * stress.js — Stress / degradation boundary discovery test
 *
 * Purpose: Find the VU level at which the system begins to degrade.
 *          This test is NOT a pass/fail gate — it maps degradation behaviour.
 * Config:  Ramp 0 → 400 VUs over 5 min, then ramp down to 0 over 1 min.
 * Thresholds: Deliberately lenient (P99 < 5 s, error rate < 50%).
 *             Record the actual numbers; use them to set future SLOs.
 *
 * Read the k6 output summary to find the VU count where P99 crosses 1 s
 * and where error rate first rises — that is the degradation boundary.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    // Ramp up to 400 VUs over 5 minutes
    { duration: '5m', target: 400 },
    // Ramp down gracefully so connection close errors don't pollute results
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    // Lenient: boundary discovery, not a hard SLO gate
    http_req_duration: ['p(99)<5000'],
    http_req_failed: ['rate<0.50'],
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
 * setup() runs once before the ramp begins.
 * Returns a token map consumed by every VU.
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
 * Role-to-endpoint mapping (same mix as normal/peak for comparability).
 * Source: DESIGN.md §3 (role permissions).
 */
const ROLE_ENDPOINTS = [
  { role: 'ceo',      endpoint: '/api/employees' },
  { role: 'hr',       endpoint: '/api/positions' },
  { role: 'finance',  endpoint: '/api/payroll/cycles' },
  { role: 'employee', endpoint: '/api/notifications' },
];

export default function (data) {
  // Round-robin role assignment across up to 400 VUs
  const roleIndex = (__VU - 1) % ROLE_ENDPOINTS.length;
  const { role, endpoint } = ROLE_ENDPOINTS[roleIndex];
  const token = data.tokens[role];

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Call 1: shared notifications endpoint
  const notifRes = http.get(`${BASE_URL}/api/notifications`, { headers });
  check(notifRes, {
    'notifications 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  // Call 2: role-appropriate endpoint
  const roleRes = http.get(`${BASE_URL}${endpoint}`, { headers });
  check(roleRes, {
    [`${role} endpoint 2xx`]: (r) => r.status >= 200 && r.status < 300,
  });

  // No sleep — apply maximum pressure to find the degradation point
  sleep(0.5);
}
