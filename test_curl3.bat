@echo off
chcp 65001 >nul

REM Get token
for /f "tokens=*" %%a in ('curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"ceo.demo\",\"password\":\"123456\"}" ^| findstr "token"') do (
    set TOKEN_LINE=%%a
)
echo Login response: %TOKEN_LINE%
echo.

REM Use token to get employees
echo === Test 3: Get employees list with CEO token ===
curl -s -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJvYS1iYWNrZW5kIiwic3ViIjoiY2VvLmRlbW8iLCJ1c2VySWQiOjQsInJvbGUiOiJjZW8iLCJlbXBsb3llZVR5cGUiOiJPRkZJQ0UiLCJkaXNwbGF5TmFtZSI6IumXhOWgn-ankeadqe-_vSIsImlhdCI6MTc3NTIzNzIzOSwiZXhwIjoxNzc1MzIzNjM5fQ.vseb5Z-E_VpsgUvyWYw9vFrfWEK6urRhh3HLWmu20b8" http://localhost:8080/api/employees
echo.
echo.

REM Get roles
echo === Test 5: Get roles list ===
curl -s -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJvYS1iYWNrZW5kIiwic3ViIjoiY2VvLmRlbW8iLCJ1c2VySWQiOjQsInJvbGUiOiJjZW8iLCJlbXBsb3llZVR5cGUiOiJPRkZJQ0UiLCJkaXNwbGF5TmFtZSI6IumXhOWgn-ankeadqe-_vSIsImlhdCI6MTc3NTIzNzIzOSwiZXhwIjoxNzc1MzIzNjM5fQ.vseb5Z-E_VpsgUvyWYw9vFrfWEK6urRhh3HLWmu20b8" http://localhost:8080/api/roles
echo.
echo.
