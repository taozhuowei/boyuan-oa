@echo off
chcp 65001 >nul

set CEO_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJvYS1iYWNrZW5kIiwic3ViIjoiY2VvLmRlbW8iLCJ1c2VySWQiOjQsInJvbGUiOiJjZW8iLCJlbXBsb3llZVR5cGUiOiJPRkZJQ0UiLCJkaXNwbGF5TmFtZSI6IumXhOWgn-ankeadqe-_vSIsImlhdCI6MTc3NTIzNzI2OCwiZXhwIjoxNzc1MzIzNjY4fQ.H5OpvtYhzhzUhtRPJdCnALcbYZnGmmDa6nFMMPWoubY

echo === Test 4: Create new employee ===
curl -s -X POST http://localhost:8080/api/employees -H "Authorization: Bearer %CEO_TOKEN%" -H "Content-Type: application/json" -d "{\"name\":\"\u6d4b\u8bd5\u65b0\u5458\u5de5\",\"phone\":\"13900000099\",\"roleCode\":\"employee\",\"employeeType\":\"OFFICE\",\"departmentId\":1,\"entryDate\":\"2026-04-01\"}"
echo.
echo.
