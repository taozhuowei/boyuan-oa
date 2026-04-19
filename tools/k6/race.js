import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 20,
  iterations: 100,
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:8080';

export function setup() {
  const res = http.post(
    `${BASE_URL}/api/auth/dev-login`,
    JSON.stringify({ username: 'employee.demo' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  return { token: res.json('token') };
}

export default function (data) {
  const payload = JSON.stringify({
    formData: {
      leaveType: 'ANNUAL',
      startDate: '2026-05-01',
      endDate: '2026-05-02',
      reason: 'race condition test',
    },
    remark: 'k6 race test',
  });

  const res = http.post(`${BASE_URL}/api/attendance/leave`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`,
    },
  });
  check(res, {
    'no server error': (r) => r.status < 500,
  });
}
