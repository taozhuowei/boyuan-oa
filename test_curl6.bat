@echo off
chcp 65001 >nul

set EMP_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJvYS1iYWNrZW5kIiwic3ViIjoiZW1wbG95ZWUuZGVtbyIsInVzZXJJZCI6MSwicm9sZSI6ImVtcGxveWVlIiwiZW1wbG95ZWVUeXBlIjoiT0ZGSUNFIiwiZGlzcGxheU5hbWUiOiLlvKDmnJ_nlJ8iLCJpYXQiOjE3NzUyMzczMjAsImV4cCI6MTc3NTMyMzcyMH0.FvJ8Z1WPy1h4hXzF4mP3dX0sLmK3Q8RtN7E0vWbJp4o

echo === Test 6: Employee cannot access DELETE /employees ===
curl -s -o nul -w "%%{http_code}" -X DELETE http://localhost:8080/api/employees/5 -H "Authorization: Bearer %EMP_TOKEN%"
echo.
