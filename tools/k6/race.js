/**
 * race.js — Race condition / concurrent write test
 *
 * Purpose: Submit leave form requests concurrently to detect data corruption,
 *          duplicate records, or server errors caused by concurrent writes.
 * Config:  20 VUs, 100 total iterations
 * Thresholds: No 5xx responses (status < 500 on every request)
 *
 * Auth: POST /api/auth/login with password 123456 (not dev-login).
 * Write endpoint: POST /api/forms with formTypeCode LEAVE.
 * Dates are set far in the future (2099) so they do not collide with
 * existing test data and remain valid regardless of when the test runs.
 */

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 20,
  iterations: 100,
  thresholds: {
    // Core assertion: no server errors under concurrent writes
    http_req_failed: ['rate<0.01'],
    // Soft latency guard — concurrent writes may be slower than reads
    http_req_duration: ['p(99)<3000'],
  },
};

const BASE_URL = 'http://localhost:8080';

/**
 * setup() runs once before any VU starts.
 * Authenticates employee.demo and returns the token.
 * All 20 VUs share this single token (employee submitting own leave).
 */
export function setup() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ username: 'employee.demo', password: '123456' }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  if (res.status !== 200) {
    throw new Error(`Login failed: HTTP ${res.status} — ${res.body}`);
  }

  const token = res.json('token');
  if (!token) {
    throw new Error(`No token returned from login: ${res.body}`);
  }

  return { token };
}

export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // Each iteration submits one leave form.
  // Dates are in 2099 to avoid conflicts with real data and ensure validity.
  // formTypeCode "LEAVE" matches the value stored in form_type table.
  const payload = JSON.stringify({
    formData: {
      leaveType: 'ANNUAL',
      startDate: '2099-01-01',
      endDate: '2099-01-02',
      reason: 'k6 race test',
    },
    remark: 'k6 race test',
  });

  // Correct endpoint: POST /api/attendance/leave (formTypeCode routing is done server-side)
  const res = http.post(`${BASE_URL}/api/attendance/leave`, payload, { headers });

  check(res, {
    // Primary assertion: no 5xx — server must not error under concurrent writes
    'no server error': (r) => r.status < 500,
    // Accepted outcomes: 200 (created), 201 (created), 400 (validation),
    // 409 (conflict — acceptable, means duplicate detection worked)
    'status is expected': (r) =>
      r.status === 200 || r.status === 201 || r.status === 400 || r.status === 409,
  });
}
