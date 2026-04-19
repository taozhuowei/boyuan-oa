# k6 Load Testing

## Install

Mac: `brew install k6`

Linux: `apt install k6`

## Run

```
k6 run tools/k6/normal.js
k6 run tools/k6/peak.js
k6 run tools/k6/stress.js
k6 run tools/k6/soak.js
k6 run tools/k6/race.js
```

## Pass Thresholds

- normal.js — 10 VUs for 2 min; p95 response under 500 ms, error rate under 1%. Baseline steady-state throughput validation.
- peak.js — 50 VUs for 1 min; p95 under 1000 ms, error rate under 5%. Simulates peak business-hours traffic.
- stress.js — ramp to 100 VUs over 7 min; p95 under 2000 ms, error rate under 10%. Finds the breaking point under extreme load.
- soak.js — 20 VUs for 30 min; p95 under 500 ms, error rate under 1%. Detects memory leaks and degradation over time.
- race.js — 20 VUs, 100 iterations of concurrent leave submissions; p95 under 1000 ms. Verifies no data corruption under concurrent writes.

## CI

The nightly GitHub Actions workflow (`nightly.yml`) runs all 5 scripts in sequence against a live backend instance.
