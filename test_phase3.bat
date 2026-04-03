@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ===== Phase 3 测试脚本 =====

echo.
echo 1. 测试CEO登录获取token...
curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"ceo.demo\",\"password\":\"123456\"}" > ceo_response.json
type ceo_response.json
echo.

for /f "tokens=*" %%a in ('type ceo_response.json ^| findstr "token"') do (
    set "line=%%a"
    set "token=!line:\"token\":\"=!"
    set "token=!token:\",=!"
    set "token=!token:\"=!"
)

echo.
echo 2. CEO获取项目列表...
curl -s -H "Authorization: Bearer %token%" http://localhost:8080/api/projects
echo.

echo.
echo 3. CEO获取部门树...
curl -s -H "Authorization: Bearer %token%" http://localhost:8080/api/departments
echo.

echo.
echo 4. CEO创建新项目...
curl -s -X POST -H "Authorization: Bearer %token%" -H "Content-Type: application/json" -d "{\"name\":\"新测试项目\",\"logCycleDays\":2}" http://localhost:8080/api/projects
echo.

echo.
echo 5. 测试PM登录...
curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"pm.demo\",\"password\":\"123456\"}" > pm_response.json
type pm_response.json
echo.

for /f "tokens=*" %%a in ('type pm_response.json ^| findstr "token"') do (
    set "line=%%a"
    set "pmtoken=!line:\"token\":\"=!"
    set "pmtoken=!pmtoken:\",=!"
    set "pmtoken=!pmtoken:\"=!"
)

echo.
echo 6. PM获取项目列表（应该只看到作为PM的项目）...
curl -s -H "Authorization: Bearer %pmtoken%" http://localhost:8080/api/projects
echo.

echo.
echo 7. PM尝试创建项目（应该返回403）...
curl -s -w "\nHTTP Status: %%{http_code}\n" -X POST -H "Authorization: Bearer %pmtoken%" -H "Content-Type: application/json" -d "{\"name\":\"无权限项目\"}" http://localhost:8080/api/projects
echo.

del ceo_response.json 2>nul
del pm_response.json 2>nul

echo.
echo ===== 测试完成 =====
pause
