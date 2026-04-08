@echo off
REM ============================================================
REM  博渊 OA — 完整测试套件一键运行（Windows）
REM
REM  三个测试层次：
REM    [1] 后端单元测试  server/src/test/         → mvn test
REM    [2] 前端单元测试  test/frontend/            → vitest (jsdom)
REM    [3] 前后端联调    test/integration/         → vitest (node, 需后端启动)
REM
REM  用例目录：
REM    后端：test/backend/README.md（指向 server/src/test/）
REM    前端：test/frontend/*.test.ts
REM    联调：test/integration/*.test.ts
REM
REM  使用：在项目根目录执行  test\run-all.bat
REM ============================================================

setlocal enabledelayedexpansion
set ROOT=%~dp0..
set PASS=0
set FAIL=0

echo.
echo ================================================================
echo  [1/3] 后端单元测试 (Spring Boot + JUnit 5 + JaCoCo)
echo ================================================================
cd /d "%ROOT%\server"
call mvn test -q
if %errorlevel% == 0 (
  echo  结果：PASS
  set /a PASS+=1
) else (
  echo  结果：FAIL
  set /a FAIL+=1
)

echo.
echo ================================================================
echo  [2/3] 前端单元测试 (Vitest + jsdom)
echo ================================================================
cd /d "%ROOT%\app\mp"
call "%ROOT%\node_modules\.bin\vitest" run --reporter=verbose
if %errorlevel% == 0 (
  echo  结果：PASS
  set /a PASS+=1
) else (
  echo  结果：FAIL
  set /a FAIL+=1
)

echo.
echo ================================================================
echo  [3/3] 前后端集成测试 (需要后端服务在 localhost:8080 运行)
echo        服务未运行时测试自动跳过，不计为失败
echo ================================================================
cd /d "%ROOT%\app\mp"
call "%ROOT%\node_modules\.bin\vitest" run --config "vitest.integration.config.ts" --reporter=verbose
echo  集成测试已完成（跳过=服务未启动，不影响整体结果）

echo.
echo ================================================================
echo  测试汇总
echo    通过套件：%PASS%/2
echo    失败套件：%FAIL%/2
echo ================================================================
echo  后端报告：server\target\surefire-reports\
echo  覆盖率报告：server\target\site\jacoco\index.html
echo  前端报告：test\reports\frontend-coverage\
echo ================================================================

if %FAIL% GTR 0 (
  exit /b 1
)
exit /b 0
