# OA System Page Accessibility Test Report

**Test Time:** 2026-04-11T04:16:18.476Z
**Base URL:** http://127.0.0.1:3000
**API URL:** http://127.0.0.1:8080

## Summary

| Category | Count | Percentage |
|----------|-------|------------|
| Accessible | 24 | 100.0% |
| 404 Not Found | 0 | 0.0% |
| Login Required | 0 | 0.0% |
| Server Error | 0 | 0.0% |
| Permission Denied | 0 | 0.0% |

---

## 404 Pages (Not Found)

No 404 pages found.

---

## Login Required Pages

No pages requiring login found.

---

## Server Errors

No server errors found.

---

## Detailed Results

| Page | Path | Status | Load Time | Category | Screenshot |
|------|------|--------|-----------|----------|------------|
| 首页 | / | 200 | 977ms | accessible | [View](./screenshots/noauth_index.png) |
| 登录页 | /login | 200 | 758ms | accessible | [View](./screenshots/noauth__login.png) |
| 个人中心 | /me | 200 | 837ms | accessible | [View](./screenshots/noauth__me.png) |
| 修改密码 | /me/password | 200 | 552ms | accessible | [View](./screenshots/noauth__me_password.png) |
| 待办 | /todo | 200 | 793ms | accessible | [View](./screenshots/noauth__todo.png) |
| 通知 | /notifications | 200 | 748ms | accessible | [View](./screenshots/noauth__notifications.png) |
| 项目列表 | /projects | 200 | 790ms | accessible | [View](./screenshots/noauth__projects.png) |
| 项目详情 | /projects/1 | 200 | 540ms | accessible | [View](./screenshots/noauth__projects_1.png) |
| 施工日志 | /construction-log | 200 | 771ms | accessible | [View](./screenshots/noauth__construction-log.png) |
| 日志模板 | /construction-log/templates | 200 | 529ms | accessible | [View](./screenshots/noauth__construction-log_templates.png) |
| 员工管理 | /employees | 200 | 718ms | accessible | [View](./screenshots/noauth__employees.png) |
| 组织架构 | /org | 200 | 748ms | accessible | [View](./screenshots/noauth__org.png) |
| 岗位管理 | /positions | 200 | 752ms | accessible | [View](./screenshots/noauth__positions.png) |
| 角色管理 | /role | 200 | 709ms | accessible | [View](./screenshots/noauth__role.png) |
| 表单管理 | /forms | 200 | 675ms | accessible | [View](./screenshots/noauth__forms.png) |
| 工资条 | /payroll | 200 | 693ms | accessible | [View](./screenshots/noauth__payroll.png) |
| 签名绑定 | /payroll/signature-bind | 200 | 521ms | accessible | [View](./screenshots/noauth__payroll_signature-bind.png) |
| 保留金 | /retention | 200 | 674ms | accessible | [View](./screenshots/noauth__retention.png) |
| 系统设置 | /setup | 200 | 669ms | accessible | [View](./screenshots/noauth__setup.png) |
| 系统配置 | /config | 200 | 653ms | accessible | [View](./screenshots/noauth__config.png) |
| 操作日志 | /operation-logs | 200 | 660ms | accessible | [View](./screenshots/noauth__operation-logs.png) |
| 考勤 | /attendance | 200 | 641ms | accessible | [View](./screenshots/noauth__attendance.png) |
| 人员名录 | /directory | 200 | 652ms | accessible | [View](./screenshots/noauth__directory.png) |
| 工伤申报 | /injury | 200 | 669ms | accessible | [View](./screenshots/noauth__injury.png) |


---

## Screenshot Directory

All screenshots are saved in: `./test_results/screenshots/`

## Notes

- Pages marked as "login_required" redirected to the login page when accessed without authentication
- 404 pages indicate routes that do not exist or are not properly configured
- Server errors indicate backend issues
