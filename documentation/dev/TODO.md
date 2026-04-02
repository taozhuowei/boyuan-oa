# 开发任务列表

> 唯一进度管理入口。完成一项立即打勾并提交。
> 架构决策见 `ARCHITECTURE.md`，页面布局见 `COMPONENT_LAYOUT.md`。

---

## 前端工程基础

### HTTP 层
- [x] 将 `access.ts` 中的 `request` 函数提取为独立 `utils/http.ts`，统一暴露给所有模块
- [x] HTTP 工具携带 `X-Client-Type: web | mp` 请求头（见 ARCHITECTURE §8.2）
- [x] 统一 Token 自动附加、401 自动跳转登录、错误 toast 提示
- [ ] 统一 loading 状态管理（请求中禁止重复提交）

### 适配层补全
- [x] 新建 `src/composables/useComponent.ts` — 批量异步加载组件的组合式函数，消除各页面冗长的 `onMounted` + `ref` 样板代码
- [x] 新建 `src/components/cross-platform/Table/` — MP 端 Table 自定义实现（当前已在 `components.json` 注册但文件缺失，MP 会 crash）
- [ ] 实现 `getComponentSync` — 当前为空壳，补充条件编译实现
- [x] `components.json` 补充注册业务所需组件：
  - `Upload`（附件上传，H5: AntD Upload，MP: 自定义）
  - `Tabs` / `Tab`（H5: AntD Tabs，MP: Vant Tabs）
  - `Tag`（状态标签，H5: AntD Tag，MP: Vant Tag）
  - `Steps` / `Step`（审批流步骤，H5: AntD Steps，MP: 自定义）
  - `Popup`（移动端弹出层，H5: AntD Drawer，MP: Vant Popup）
  - `Textarea`（独立文本域组件，H5: AntD Textarea，MP: Vant Field type=textarea）
  - `Canvas`（手写签名画板，双端均使用自定义实现）

### 样式系统
- [x] 在 `App.vue` 或全局样式中用 oa-token 覆盖 AntD CSS 变量（`--ant-color-primary` 等）
- [x] 在全局样式中用 oa-token 覆盖 Vant CSS 变量（`--van-primary-color` 等）
- [ ] 验证双端主色、圆角、字体、间距视觉一致性

### 自定义组件补充
- [ ] 新建 `components/cross-platform/SignatureCanvas/` — 手写签名画板，双端兼容触控和鼠标，输出 base64 图片
- [ ] 新建 `components/cross-platform/Steps/` — 审批流步骤条，MP 端无 AntD Steps，需自实现
- [ ] 新建 `components/cross-platform/FileUpload/` — 附件上传组件，封装 uni 上传 API，支持预览和删除
- [ ] 新建 `components/customized/ApprovalTimeline.vue` — 审批历史时间轴，复用 Timeline，统一审批流展示

---

## 身份认证

### 前端
- [ ] 登录成功后将 `employeeType` 写入 userStore，供各页面用于劳工功能门控
- [x] `access.ts` 解除对 `workbench-data.ts` 的 import 依赖（当前 CEO 测试账号的 name/department 从 workbench-data 读取，应内联）
- [ ] 预留企业微信 OAuth 登录入口（`/auth/wework`）

### 后端
- [ ] 登录响应补充 `employeeType` 字段
- [ ] JWT payload 写入 `employeeType`、`roleCode`、`userId`
- [ ] 预留 `/auth/wework` 接口骨架（当前返回 501）

---

## 组织管理

### 前端
- [ ] 员工列表接入真实接口（`GET /employees`），支持部门/角色/类型/状态筛选、关键字搜索
- [ ] 员工新增/编辑弹窗对接接口
- [ ] 员工详情页（独立页面，目前无实现，见 `COMPONENT_LAYOUT §5`）
- [ ] 项目列表接入真实接口（`GET /projects`）
- [ ] 项目详情页（独立页面，目前点击仅 toast，见 `COMPONENT_LAYOUT §4`）
- [ ] 项目成员管理：添加/移除成员
- [ ] 通讯录导入页（`pages/directory/`，财务/CEO 可见，见 `COMPONENT_LAYOUT §6`）
  - 导入预览（`POST /directory/import/preview`）
  - 字段映射配置
  - 重复检查结果展示
  - 执行导入（`POST /directory/import/apply`）
  - 导入结果明细
- [ ] 员工管理项目经理视图 — 只读查看项目成员（见 `COMPONENT_LAYOUT §5.3`）

### 后端
- [ ] 补全数据库建表：`employee`、`department`、`project`、`project_member`
- [ ] 补全 Mapper：`EmployeeMapper`（扩展）、`ProjectMapper`、`DepartmentMapper`
- [ ] 将 `OaDataService` 员工/部门/项目内存逻辑迁移到真实 Service + Mapper
- [ ] 员工 CRUD 接口（含员工类型、部门、角色关联）
- [ ] 部门树接口（`GET /departments`）
- [ ] 项目成员管理接口（`POST/DELETE /projects/{id}/members`）
- [ ] 初始化测试数据脚本（`data.sql`）

---

## 业务单据与审批

### 前端
- [ ] 考勤页接入真实接口（提交请假/加班 → `POST /attendance/leave|overtime`，获取待审批 → `GET /attendance/todo`）
- [ ] 审批通过/驳回对接（`POST /forms/{id}/approve|reject`）
- [ ] 施工日志填报页（`pages/construction-log/`，劳工专用，见 `COMPONENT_LAYOUT §4.3`）
  - 按项目模板动态渲染字段
  - 图片附件上传（多张）
  - 提交后进入审批流
- [ ] 工伤补偿申请页（`pages/injury/`，劳工专用，财务/项目经理可代录入，见 `COMPONENT_LAYOUT §1.6`）
- [ ] 待办中心页（`pages/todo/`，聚合所有待我审批，按类型/状态/项目筛选）
- [ ] 审批详情页复用 `ApprovalTimeline` 组件展示历史流转
- [ ] 审批流程驳回后可查看驳回原因，支持重新发起

### 后端
- [ ] 补全数据库建表：`form_record`、`approval_record`、`approval_flow_def`、`approval_flow_node`
- [ ] 补全 Mapper：`FormRecordMapper`
- [ ] 将 `OaDataService` 表单/审批内存逻辑迁移到真实 Service + Mapper
- [ ] 可配置审批流引擎：`ApprovalFlowDef` CRUD + 执行引擎（按节点推进），系统启动写入默认两级配置
- [ ] 施工日志模板 CRUD（全局模板 CEO，项目级模板项目经理，继承+覆盖）
- [ ] 施工日志提交接口（快照当前模板字段）
- [ ] 工伤补偿申请 + 审批 + 代录入接口
- [ ] 附件上传接口（`POST /attachments/upload`）+ 本地文件系统存储（路径规范见 ARCHITECTURE §9.1）
- [ ] 附件下载接口（`GET /attachments/{id}`，鉴权后返回文件流）

---

## 薪资体系

### 前端
- [ ] 薪资页接入真实接口（`GET /payroll/cycles`、`GET /payroll/slips`）
- [ ] CEO 薪资审批视图（当前 CEO 与财务共用同一视图，见 `COMPONENT_LAYOUT §3.1`）
- [ ] 预结算发起页：展示校验清单，问题项可跳转处理
- [ ] 工资条详情页：工资项明细展示
- [ ] 电子签名流程
  - 首次签名引导：实名确认 → `SignatureCanvas` 手写 → 预览 → 绑定（`POST /signature/bind`）
  - 设置 PIN 码（`POST /signature/set-pin`，4-6位数字，与登录密码独立）
  - 工资确认弹窗：签名预览 + 意图声明文本 + PIN 码输入 → 提交（`POST /payroll/slips/{id}/confirm`）
- [ ] 工资异议发起（`POST /payroll/slips/{id}/dispute`）
- [ ] 更正历史版本查看

### 后端
- [ ] 补全数据库建表：`payroll_cycle`、`payroll_slip`、`payroll_item`、`payroll_adjustment`、`payroll_confirmation`、`employee_signature`
- [ ] 补全 Mapper：`PayrollCycleMapper`、`PayrollSlipMapper`
- [ ] 将 `OaDataService` 薪资内存逻辑迁移到真实 Service + Mapper
- [ ] 考勤管理：手工录入/批量导入（CSV）、异常标记、异常列表查询
- [ ] 薪资规则配置 CRUD（基本工资系数、加班倍率、请假扣款公式、社保/公积金/个税参数）
- [ ] 结算周期类型配置（月结/半月结，`PayrollRule.cycleType`）
- [ ] 预结算校验 + 算薪引擎（按规则生成 `PayrollSlip` + `PayrollItem` 明细）
- [ ] 正式结算、锁定周期、工资条发布
- [ ] 电子签名 Service（见 ARCHITECTURE §12）：
  - 签名加密存档 + `EmployeeSignature` 入库
  - PIN 码 bcrypt 哈希存储
  - 工资单内容 SHA-256 哈希
  - 签署 PDF 生成（明细 + 签名叠加 + 时间戳水印）
  - `PayrollConfirmation` 完整证据链写入
  - `SignatureProvider` 接口抽象，预留 `EsignSignatureProvider`
- [ ] 工资异议审批流 + 更正解锁重算（新版本 `version` 递增，历史版本保留）

---

## 工作台接入

### 前端
- [ ] 工作台接入聚合摘要接口（`GET /workbench/summary`）替换 mock 统计数据
- [ ] 待办数量接入真实接口，徽标实时更新
- [ ] 通知列表进入通知中心页面后懒加载（`GET /notifications`）
- [ ] 实现 `usePageConfig(routeCode)` composable，进入页面时携带 `X-Client-Type` 拉取页面配置

### 后端
- [ ] `GET /workbench/summary` 按角色返回摘要数据（待办数/薪资状态/项目数/到期提醒数），60秒缓存
- [ ] `GET /page-config/{routeCode}` 按 `X-Client-Type` 和角色返回页面字段/布局/按钮配置
- [ ] 通知触发：审批节点变更、工资条发布、到期提醒 → 写入 `notification` 表
- [ ] `GET /notifications`、`POST /notifications/{id}/read`

---

## 运营管理

### 前端
- [ ] 数据有效期配置页（CEO 可见，`GET/POST /retention/policies`）
- [ ] 到期提醒列表（`GET /retention/reminders`），支持延期/触发备份操作
- [ ] 导出任务列表，展示进度和下载链接

### 后端
- [ ] 补全数据库建表：`retention_policy`、`retention_reminder`、`cleanup_task`、`export_backup_task`
- [ ] 将 `RetentionController` / `BackupController` / `CleanupController` 内存逻辑迁移到真实 Service
- [ ] 到期提醒定时任务（每日扫描，提前 N 天生成 `RetentionReminder`，写通知）
- [ ] 异步导出任务：按周期/项目/类型分包 → 压缩 → 生成下载链接（72小时有效）
- [ ] 数据清理定时任务：先删物理文件 → 再删 DB 记录 → 失败进重试队列
- [ ] 审计日志（AOP 拦截薪资结算、更正、清理、权限变更、签名绑定）

---

## 测试

- [ ] 前端单元测试框架搭建（当前 0 个 spec 文件）
- [ ] `useComponent` composable 单元测试
- [ ] 适配层 `resolver.ts` 单元测试（平台切换、组件缺失降级）
- [ ] 后端 Service 层单元测试（核心算薪逻辑、审批流引擎、签名存证）
- [ ] 后端权限隔离测试（角色 vs 接口访问控制）
- [ ] 联调冒烟测试（登录→提交单据→审批→工资确认完整链路）

---

## 企业微信接入（待信息就绪后启动）

- [ ] 后端 `WeworkService` 接口替换为真实实现（当前为 mock 空实现）
- [ ] 企业微信 OAuth 登录（`/auth/wework`）
- [ ] 通讯录批量导入接入企业微信 API
- [ ] 应用消息推送（审批通知、工资条发布、到期提醒）
- [ ] 小程序端编译验证（`yarn dev:mp-weixin`）
- [ ] 所有页面适配小程序竖屏布局（卡片化、底部操作区固定）
- [ ] 审批详情支持折叠分段
- [ ] `SignatureCanvas` 在小程序触控环境验证可用

---

## 变更记录

| 日期 | 内容 |
| ---- | ---- |
| 2026-04-01 | 基于前端代码审计全量重写 TODO：按业务模块组织，补充前端工程基础缺口（useComponent缺失、Table组件缺失、getComponentSync空壳、样式覆盖缺失、HTTP层缺口）；同步补充架构决策中新增的任务项 |
| 2026-04-01 | 补充架构决策：可配置审批流、电子签名、设备类型协议、工作台混合加载、文件存储规范 |
| 2026-04-01 | 全面重写 TODO，基于代码审计重新判断完成状态；合并 COMPONENT_LAYOUT 引用到 ARCHITECTURE |
| 2026-04-01 | 前端架构重构完成：适配器架构 + 7 页面迁移 + 旧组件库清理 |
| 2026-03-31 | 工程稳定性修复、门户工作台基线、后端 API 骨架、权限矩阵 |
