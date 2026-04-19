/**
 * soak.js — Soak / endurance test
 *
 * Purpose: Detect memory leaks, connection pool exhaustion, and gradual
 *          performance degradation under sustained load over 30 minutes.
 * Config:  200 VUs × 30 minutes (constant)
 * Thresholds: P99 < 1000ms, error rate < 1%
 *
 * Endpoint mix is identical to normal.js and peak.js.
 * Compare P99 at t=0 vs t=30 min in the k6 output to spot drift.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 200,
  duration: '30m',
  thresholds: {
    // P99 must not exceed 1 s even after 30 minutes of sustained load
    http_req_duration: ['p(99)<1000'],
    // Error rate must stay below 1% throughout the full run
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
 * setup() runs once before the 30-minute soak begins.
 * Tokens are reused across the entire run; JWTs must remain valid for 30+ min.
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
 * Role-to-endpoint mapping (same as normal.js and peak.js).
 * Source: DESIGN.md §3 (role permissions).
 */
const ROLE_ENDPOINTS = [
  { role: 'ceo',      endpoint: '/api/employees' },
  { role: 'hr',       endpoint: '/api/positions' },
  { role: 'finance',  endpoint: '/api/payroll/cycles' },
  { role: 'employee', endpoint: '/api/notifications' },
];

export default function (data) {
  // Round-robin role assignment: stable across the 30-minute run
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
    'notifications 200': (r) => r.status === 200,
  });

  // Call 2: role-appropriate endpoint
  const roleRes = http.get(`${BASE_URL}${endpoint}`, { headers });
  check(roleRes, {
    [`${role} endpoint 200`]: (r) => r.status === 200,
  });

  sleep(1);
}
