@echo off
chcp 65001 >nul
echo === Test 2: Login with wrong password ===
curl -s -o nul -w "%%{http_code}" -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"ceo.demo\",\"password\":\"wrong\"}"
echo.
echo.
