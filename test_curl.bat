@echo off
chcp 65001 >nul
echo === Test 1: Login with correct password ===
curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"ceo.demo\",\"password\":\"123456\"}"
echo.
echo.
