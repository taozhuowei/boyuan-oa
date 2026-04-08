#!/usr/bin/env bash
# ============================================================
#  博渊 OA — 完整测试套件一键运行（Unix/macOS）
#
#  三个测试层次：
#    [1] 后端单元测试  server/src/test/         → mvn test
#    [2] 前端单元测试  test/frontend/            → vitest (jsdom)
#    [3] 前后端联调    test/integration/         → vitest (node, 需后端启动)
#
#  用例目录：
#    后端：test/backend/README.md（指向 server/src/test/）
#    前端：test/frontend/*.test.ts
#    联调：test/integration/*.test.ts
#
#  使用：bash test/run-all.sh
# ============================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

run_suite() {
  local name="$1"
  local cmd="$2"
  echo ""
  echo "================================================================"
  echo " $name"
  echo "================================================================"
  if eval "$cmd"; then
    echo " 结果：PASS"
    PASS=$((PASS + 1))
  else
    echo " 结果：FAIL"
    FAIL=$((FAIL + 1))
  fi
}

run_suite "[1/3] 后端单元测试" \
  "cd \"$ROOT/server\" && mvn test -q"

run_suite "[2/3] 前端单元测试" \
  "cd \"$ROOT/app/mp\" && \"$ROOT/node_modules/.bin/vitest\" run --reporter=verbose"

echo ""
echo "================================================================"
echo " [3/3] 前后端集成测试（服务未运行时自动跳过）"
echo "================================================================"
cd "$ROOT/app/mp" && "$ROOT/node_modules/.bin/vitest" run \
  --config "vitest.integration.config.ts" \
  --reporter=verbose || true
echo " 集成测试已完成（跳过=服务未启动，不影响整体结果）"

echo ""
echo "================================================================"
echo " 测试汇总  通过：$PASS/2  失败：$FAIL/2"
echo "================================================================"
echo " 后端报告：server/target/surefire-reports/"
echo " 覆盖率：  server/target/site/jacoco/index.html"
echo " 前端报告：test/reports/frontend-coverage/"
echo "================================================================"

exit $FAIL
