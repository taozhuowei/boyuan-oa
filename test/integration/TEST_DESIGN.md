# API 集成测试规格

> 主测试策略见 [TEST_DESIGN.md](../TEST_DESIGN.md)。
> 执行文件：[api.test.ts](api.test.ts)
> 前置：后端服务在 `localhost:8080` 运行（不可达时自动跳过）

---

## 4.1 已有用例（保留，不重复）

- M0: GET /health → 200
- M1 认证: 登录成功/失败/无 token/roles/me
- M1 员工: CEO 列表、worker 403、详情、404
- M2 组织: 部门列表、项目列表/详情、操作日志 CEO/finance
- V5 补贴: 列表/创建/配置/worker403、薪资开关 CEO/worker
- 冒烟: 请假审批链、施工日志审批、工作台摘要、薪资周期创建

## 4.2 T0 新增用例（对照 TODO T0 节）

### 4.2.1 假期类型（LeaveType）

- LT-01: GET /config/leave-types（ceo token）→ 200，断言 body 为非空数组
- LT-02: POST /config/leave-types `{name:"年假",quota:15,deductible:false}`（hr token）→ 201，断言 body.id 非空
- LT-03: POST /config/leave-types（worker token）→ 403
- LT-04: DELETE /config/leave-types/{id}（hr token）→ 200
- LT-05: DELETE /config/leave-types/{id}（id 不存在，hr token）→ 404

### 4.2.2 考勤/请假（Attendance）

- AT-01: POST /attendance/leave `{leaveType:"ANNUAL",startDate:"2026-06-01",endDate:"2026-06-02",reason:"休假"}`（employee token）→ 200，断言 body.id 非空，body.status="PENDING"
- AT-02: POST /attendance/leave（缺 leaveType 字段，employee token）→ 400
- AT-03: GET /attendance/records（employee token）→ 200，断言每条 record.employeeId == 本人 id
- AT-04: GET /attendance/records（ceo token）→ 200，可含多员工记录
- AT-05: POST /attendance/{formId}/approve `{action:"APPROVE"}`（dept_manager token）→ 200
- AT-06: POST /attendance/{formId}/approve（employee token）→ 403

### 4.2.3 报销（Expense）

- EX-01: GET /expense/types（employee token）→ 200，断言数组非空（需 BUG-03 修复后）
- EX-02: POST /expense `{type:"TRAVEL",amount:500,description:"差旅"}`（employee token）→ 201，断言 body.id 非空
- EX-03: GET /expense/records（employee token）→ 200，断言每条 record.applicantId == 本人
- EX-04: GET /expense/records（finance token）→ 200，可含多员工记录
- EX-05: POST /expense/{id}/approve `{action:"APPROVE"}`（finance token）→ 200
- EX-06: POST /expense/{id}/approve（employee token）→ 403

### 4.2.4 工伤（Injury）

- IN-01: POST /injury `{injuryDate:"2026-05-01",injuryTime:"10:00",diagnosis:"手部割伤",description:"操作失误"}`（worker token）→ 200，断言 body.id 非空
- IN-02: GET /injury（finance token）→ 200，断言 body 为数组
- IN-03: GET /injury（worker token）→ 200，仅本人记录或全量（按设计确认）
- IN-04: PUT /injury/{id}/compensation `{amount:5000}`（finance token）→ 200
- IN-05: PUT /injury/{id}/compensation（worker token）→ 403

### 4.2.5 系统配置（SystemConfig）

- SC-01: GET /config/company-name（ceo token）→ 200，断言 body.value 为字符串
- SC-02: PUT /config/company-name `{value:"测试企业"}`（ceo token）→ 200
- SC-03: PUT /config/company-name（hr token）→ 403
- SC-04: GET /config/payroll-cycle（ceo token）→ 200，断言 body.payDay 为数字
- SC-05: PUT /config/payroll-cycle `{payDay:20}`（ceo token）→ 200
- SC-06: GET /config/retention-period（ceo token）→ 200，断言 body.years 为数字

### 4.2.6 越权直调安全测试（最少 15 条）

- SEC-01: GET /employees（employee token）→ 403，员工不可查全体名单
- SEC-02: GET /employees（worker token）→ 403
- SEC-03: DELETE /employees/1（employee token）→ 403
- SEC-04: GET /payroll/cycles（worker token）→ 403
- SEC-05: POST /payroll/cycles（worker token）→ 403
- SEC-06: PUT /payroll/cycles/1/settle（employee token）→ 403
- SEC-07: GET /operation-logs（employee token）→ 403
- SEC-08: GET /operation-logs（finance token）→ 403，已验证，保留回归
- SEC-09: PUT /config/company-name（hr token）→ 403
- SEC-10: PUT /config/payroll-cycle（finance token）→ 403（如 CEO 专属，按实现确认）
- SEC-11: PUT /injury/{id}/compensation（worker token）→ 403
- SEC-12: POST /expense/{id}/approve（employee token）→ 403
- SEC-13: POST /allowances（worker token）→ 403，已验证，保留回归
- SEC-14: GET /payroll/slips（他人工资条，employee token）→ 403 或空列表，数据隔离
- SEC-15: POST /dev/reset（employee token）→ 403（dev only），非 dev profile 时 404

### 4.2.7 密码变更

- PW-01: POST /auth/change-password `{current:"123456",newPwd:"Abc12345!"}`（正确旧密码）→ 200
- PW-02: POST /auth/change-password `{current:"wrong",newPwd:"Abc12345!"}`（错误旧密码）→ 400
- PW-03: POST /auth/change-password `{current:"123456",newPwd:"12345"}`（新密码仅 5 位）→ 400

### 4.2.8 薪资主链 API

- PR-01: POST /payroll/cycles `{period:"2026-06"}`（finance token）→ 201，断言 status="OPEN"
- PR-02: PUT /payroll/cycles/{id}/settle（finance token）→ 200，断言 status="SETTLED"
- PR-03: GET /payroll/slips?cycleId={id}（employee token）→ 200，断言每条 slip.employeeId == 本人
- PR-04: POST /payroll/slips/{id}/confirm（employee token）→ 200
- PR-05: POST /payroll/slips/{id}/confirm（他人工资条，employee token）→ 403
