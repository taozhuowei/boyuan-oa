# 博渊 OA 系统 — 重构路线图 (refactor branch)

> **唯一进度管理入口。** 完成一项立即打勾并提交。禁止跨状态跳跃。
>
> 状态：`[ ]` 待开发 / `[~]` 开发中 / `[>]` 待测试 / `[?]` 待验收 / `[x]` 已完成
>
> 本分支目标：删除全部业务模块代码，保留 15 个基石模块，写入架构文档和前端设计规范，
> 清理前端业务页面，形成可渐进式集成的干净基座。

---

## 当前活跃 Phase

**Phase D — 文档重写**（进行中）

---

## Phase R — 后端重构

目标：删除全部业务 Java 代码，保留 15 个基石模块，`mvn compile` 零报错。

- [x] R-00 重置 TODO.md，建立重构任务追踪
- [x] R-01 架构审计（Code Reviewer agent，发现并记录 6 项边界修正）
  - WorkbenchController 改为整体删除（与 WorkbenchService 一起删，业务耦合无法拆分）
  - TeamController/TeamService 改为保留（仅依赖基石 Mapper，不涉及业务实体）
  - 混合文件局部改动（在保留文件里精确删除业务内容）：
    - RetentionService.java：删除 PayrollSlip/ConstructionLog/InjuryClaim 三种数据类型的查询/删除/扫描分支，移除对应 Mapper 注入
    - PositionServiceImpl.java：删除 listSocialInsuranceItems() 方法和 SocialInsuranceItemMapper 注入
    - PositionResponse.java：删除 socialInsuranceItems 字段
    - NotificationEventListener.java：删除 onPayrollSlipPublished() 方法
    - FormService.java：删除 generateFormNo() 和 getFormTypeName() 中 LEAVE/OVERTIME/INJURY/EXPENSE/PAYROLL_BONUS 的 case 分支
  - 另整体删除：FormDataValidator.java、PayrollSlipPublishedEvent.java、SocialInsuranceItemResponse.java
- [x] R-02 删除业务模块 Java 代码（含混合文件局部改动）
  - 整体删除 controller（21 个）：AfterSaleController, AllowanceController,
    AttendanceController, ExpenseController, InjuryClaimController,
    LeaveTypeController, OvertimeNotificationController, PayrollBonusController,
    PayrollController, PayrollItemDefController, ProjectConstructionLogController,
    ProjectController, ProjectInsuranceController, ProjectMaterialCostController,
    ProjectMemberController, ProjectMilestoneController, ProjectRevenueController,
    SalaryConfirmationAgreementController, WorkItemTemplateController,
    WorkLogController, WorkbenchController
  - 整体删除 service（28 个）：AfterSaleService, AllowanceService,
    AllowanceResolutionService, AttendanceService, ConstructionAttendanceService,
    ConstructionLogMaterialsService, ExpenseService, InjuryService,
    InsuranceCostService, LeaveTypeService, OvertimeNotificationService,
    PayrollBonusService, PayrollCorrectionService, PayrollCycleService,
    PayrollEngine, PayrollItemDefService, PayrollSlipService,
    ProjectInsuranceService, ProjectMaterialCostService, ProjectMilestoneService,
    ProjectRevenueService, ProjectService, ProjectServiceImpl, RevenueChangeService,
    SalaryConfirmationAgreementService, WorkItemTemplateService, WorkLogService,
    WorkbenchService
  - 整体删除 entity（业务实体）：AfterSaleTicket/TypeDef, AllowanceConfig/Def,
    ConstructionAttendance, ConstructionLogSummary, EvidenceChain,
    ExpenseClaim/Item/TypeDef, InjuryClaim, LeaveTypeDef,
    OvertimeNotification/Response, PayrollAdjustment/Bonus/Confirmation/Cycle/
    ItemDef/Slip/SlipItem, Project/InsuranceDef/MaterialCost/Member/Milestone/
    ProgressLog, SalaryConfirmationAgreement, SocialInsuranceItem, WorkItemTemplate
  - 整体删除对应 mapper 和业务 DTO（约 30 个）
  - 整体删除：FormDataValidator.java, PayrollSlipPublishedEvent.java,
    SocialInsuranceItemResponse.java
  - 局部改动（混合文件，只删业务部分，保留基石部分）：
    - RetentionService.java
    - PositionServiceImpl.java
    - PositionResponse.java
    - NotificationEventListener.java
    - FormService.java
- [x] R-03 编译验证（mvn compile + mvn test-compile，BUILD SUCCESS）
- [x] R-04 集成测试清理（api.test.ts 删除 7 个业务 describe 块，清理 11 个相关测试；删除 7 个业务单元测试文件）
- [x] R-05 后端最终审计（Code Reviewer agent PASS，ArchUnit 排除已清理，Javadoc 已更新）

---

## Phase D — 文档重写

目标：根目录 README 作为目录，ARCHITECTURE.md 描述模块化架构，
docs/ 按模块拆分，app/ 写入跨平台设计规范。

- [ ] D-01 根目录 README.md 改写为目录索引（超链接指向各模块文档）
- [ ] D-02 ARCHITECTURE.md 重写
  - 模块化包结构（core.*、biz.* 分包规则）
  - modules.yml 注册机制（热插拔设计，运维修改注册即可启停模块）
  - core.bus 通信规则（事件类放 core.bus.events，同步查询接口放 core.bus.ports）
  - ArchUnit 零跨模块直接导入约束（业务模块间禁止互相 import）
- [ ] D-03 docs/core/ — 15 个基石模块，各一份文档
  - core.auth（认证与登录）
  - core.employee（员工与用户身份）
  - core.org（组织结构与部门）
  - core.form（通用表单与流转）
  - core.approval（审批流引擎）
  - core.notification（通知中心）
  - core.file（文件与附件）
  - core.config（系统配置）
  - core.setup（初始化向导）
  - core.retention（数据保留策略）
  - core.bus（模块间通信总线）
  - core.error（错误捕获与处理）
  - core.tracking（操作埋点）
  - core.logging（结构化日志）
  - core.health（健康检查与监控）
- [ ] D-04 docs/modules/ — 5 个业务模块目录（占位，正文等模块集成时再写）
  - payroll、attendance、project、expense、injury
- [ ] D-05 app/README.md — 跨平台设计规范
  - 设计哲学：Apple HIG 适配中文企业 Web，简洁克制，以内容和任务为中心
  - 配色方案（Apple 设计系统，浅色模式）：
    主色：System Blue #007AFF（交互元素、主按钮、链接）
    语义色：成功 #34C759 / 警告 #FF9500 / 错误 #FF3B30 / 提醒 #FFCC00
    背景：一级 #FFFFFF / 二级 #F2F2F7 / 三级 #EFEFF4
    文字：主 #000000 / 次 #636366 / 占位 #ADADB8 / 分割线 #C6C6C8
  - 字体：PingFang SC / Microsoft YaHei / -apple-system / system-ui
    正文 14px/22px，标题 17px/24px 字重 600，辅助 12px/18px
  - 间距：4px 基础网格；常用 8/12/16/24/32px
  - 圆角：小组件 6px，卡片/菜单 8px，大弹窗/抽屉 12px
  - 布局（固定）：顶栏 56px 固定 + 宫格（模块入口）+ 模块内左侧 220px 导航 + 内容区
  - 反馈：Toast 顶部 3 秒无打扰；Dialog 居中打断（不可逆操作）
  - 自定义组件：TopBar / ModuleTile / ApprovalTimeline / SignatureCanvas / FileUpload
- [ ] D-06 app/h5/README.md — Web 端组件规范（Ant Design Vue 4.x）
  - 主色覆盖：token primaryColor = #007AFF
  - 组件对照：
    输入框 a-input/a-textarea，下拉 a-select，日期 a-date-picker，
    表格 a-table，表单 a-form，主按钮 a-button type=primary，
    危险按钮 a-button danger，弹窗 a-modal，抽屉 a-drawer，
    提示 a-message（Toast），菜单 a-menu，面包屑 a-breadcrumb，
    标签 a-tag/a-badge，上传 a-upload（封装为 FileUpload）
- [ ] D-07 app/mp/README.md — 小程序端组件规范（Vant 4.x uni-app 适配版）
  - 主色覆盖：--van-primary-color: #007AFF
  - 组件对照：
    输入框 van-field，下拉 van-picker+van-popup，日期 van-date-picker，
    列表 van-list，表单 van-form，主按钮 van-button type=primary，
    弹窗 van-dialog，底部弹出 van-popup position=bottom，
    提示 van-toast，标签栏 van-tabbar（替代 Web 端左侧边栏），
    上传 van-uploader（封装为 FileUpload）

---

## Phase F — 前端清理

目标：删除全部业务页面，修改混合页面，lint + test 全绿。

- [x] F-01 整体删除业务页面目录
  - pages/attendance/、pages/payroll/、pages/projects/
  - pages/construction_log/、pages/injury/、pages/expense/
  - pages/leave_types/、pages/allowances/
  - 对应业务 components 目录
- [x] F-02 混合页面局部改动（9 个文件，只删业务部分）
  - app/h5/layouts/default.vue：ROLE_MENUS 删除业务路由条目（attendance/payroll/projects 等）
  - app/h5/middleware/auth.global.ts：PAGE_ACCESS 删除业务路由
  - app/h5/pages/config/index.vue：删除 AttendanceUnitConfig/BonusApprovalConfig/PayrollCycleConfig 组件引用
  - app/h5/pages/index.vue（workbench）：删除薪酬状态卡、项目数卡、考勤待办逻辑
  - app/h5/pages/forms/index.vue：删除 LEAVE/OVERTIME/EXPENSE 过滤参数和标签函数
  - app/h5/pages/todo/index.vue：删除考勤审批 Tab、费用审批 Tab
  - app/h5/pages/setup/index.vue：删除 step 9 考勤/薪酬配置项和 finalizeSetup 对应字段
  - app/h5/pages/employees/index.vue：删除 expenseLimit 字段（表单/详情/类型共 5 处）
  - app/shared/utils/formLabels.ts：删除 getLeaveTypeLabel/getOvertimeTypeLabel/getExpenseTypeLabel 及对应常量
- [x] F-03 验证（`yarn workspace oa-h5 lint` 零 error；`yarn workspace oa-h5 test` 全绿）
- [x] F-04 前端最终审计（Code Reviewer agent，结论 PASS 后本 Phase 关闭）

---

## Phase V — 视图重构（已规划，执行时间待确认）

目标：实现固定布局，Web 与小程序同步演进。

- [ ] V-01 TopBar 组件（通知铃 + 待办数 + 个人中心，高度 56px，全局固定）
- [ ] V-02 ModuleTile 宫格组件（模块入口卡片，含图标/名称/角标）
- [ ] V-03 Web 端布局重构（default.vue 改为顶栏 + 宫格/左侧导航 + 内容区三层结构）
- [ ] V-04 小程序端同步（van-tabbar 底部标签栏替代左侧边栏，Vant 4.x 组件落地）

---

## 技术债（显式延期，已记录）

- Flyway V1–V21 迁移文件重构：V1 混合基石和业务表，保留现状，新迁移从 V22+ 开始
- modules.yml + @ConditionalOnModuleEnabled 实现：文档占位，Phase V 后实现
- core.bus/core.tracking/core.logging/core.error/core.health 代码实现：文档占位，按需集成
- B-INFRA-01（V2–V9 PostgreSQL-only 语法在 H2 不可运行）：生产部署时解决
