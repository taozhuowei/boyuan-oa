import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:8080';

export default function () {
  const res = http.get(`${BASE_URL}/actuator/health`);
  check(res, { 'health ok': (r) => r.status === 200 });
  sleep(1);
}
