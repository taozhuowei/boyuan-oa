# 众维 OA — AI 开发指南

## 1. 技术栈

| 层 | 技术 |
|---|---|
| 前端 | uni-app + Vue 3 + Vite + TypeScript + yarn |
| 后端 | Java 17 + Spring Boot 3 + Spring Security + JWT |
| 数据 | PostgreSQL + MyBatis-Plus |
| 存储 | 本地文件系统 / 对象存储（按环境切换） |

## 2. 目录结构

```
app/
  frontend/          # uni-app 前端
    src/pages/       # 页面（login, index, role, forms, employees, projects, directory）
    src/pages.json   # 页面路由配置
  backend/           # Spring Boot 后端
    src/main/java/com/oa/backend/
      controller/    # REST API
      service/       # 业务逻辑
      entity/        # MyBatis-Plus Entity
      dto/           # Java Record DTO
      mapper/        # MyBatis Mapper
      security/      # JWT + Filter
tools/
  scripts/           # 辅助脚本（如 test-api.ps1）
documentation/
  ai/                # AI 开发指南
  dev/               # 技术架构、测试设计
  biz/               # 项目介绍（甲方阅读）
  designs/           # UI 设计稿
```

## 3. 核心设计约束（不可违背）

### 3.1 后端驱动前端
- 菜单、路由、页面字段、按钮权限、显隐规则必须由后端接口下发
- 前端只负责：拉取配置 → 按配置渲染 → 调用接口 → 通用交互适配
- 表单配置接口示例：`GET /forms/config?formType=LEAVE` 返回字段、动作、审批流

### 3.2 审批流统一
- 所有业务单据走同一审批模型：
  ```
  草稿(DRAFT) → 待初审(PENDING) → 待终审(APPROVING) → 已通过(APPROVED) → 已归档(ARCHIVED)
  ```
- 驳回(REJECTED)后保留历史，允许申请人重新发起
- 初审：项目经理；终审：CEO

### 3.3 员工类型分流
- `OFFICE`（普通员工）：不显示施工日志、工伤补偿入口
- `LABOR`（劳工）：可提交施工日志、发起工伤补偿
- 员工类型与角色独立，权限判断需同时校验

### 3.4 薪资结算闭环（角色流转）

```
财务发起预结算
    ↓
系统校验（审批/考勤/日志/工伤/档案/规则完整性）
    ↓
财务执行正式结算 → 周期锁定
    ↓
员工查看工资条 → 确认（结束）
              ↓
           发起异议
              ↓
           财务收到异议 → 财务发起更正申请
                            ↓
                         CEO 审批解锁
                            ↓
                         财务执行重新结算（生成新版本工资单）
                            ↓
                         员工再次查看/确认
                            ↓
                         周期关闭 → 归档
```

**关键角色边界**：
- 预结算、正式结算、重新结算：**仅财务**可操作
- 工资条确认、异议：**仅员工/劳工本人**可操作
- 更正审批解锁：**仅 CEO**可操作
- 已锁定周期任何角色均不可直接修改

### 3.5 数据清理顺序
- 到期清理必须先删物理文件，再删数据库记录
- 物理文件删除失败不得标记完成，需进入重试队列

## 4. 编码规范

### 后端
- DTO 使用 **Java Record**，Entity 使用 Lombok `@Data`
- Controller 返回 `ResponseEntity<T>`，禁止直接抛业务异常给前端（统一包装）
- 权限判断基于 `Authentication.getAuthorities()`，角色 Authority 格式为 `ROLE_XXX`
- 现有角色编码：`EMPLOYEE`、`WORKER`、`FINANCE`、`PROJECT_MANAGER`、`CEO`
- Service 层优先使用 `Optional` 处理空值

### 前端
- 页面必须在 `pages.json` 注册
- 组件按标准容器渲染：表单页容器、列表页容器、详情页容器、审批页容器
- 适配三端：手机（单列）、平板（双栏）、PC（多栏+宽表格）
- 视觉风格：浅色商务风，主色 `#324963`，允许一个主渐变用于重点区域

## 5. 开发流程与测试

### 启动命令
```bash
cd app
yarn dev:web              # Web 本地调试
yarn dev:mp-weixin        # 小程序开发模式
yarn test:web             # 前端测试
yarn --cwd frontend type-check
yarn test:api             # API 脚本测试
cd app/backend && mvn test # 后端测试
```

### 进度同步
- 每次开发结束前更新 `documentation/ai/AGENTS.md` 的「当前进度」章节
- 新增/修复重要功能后补测试记录到 `documentation/dev/test-reports/`

## 6. 关键业务规则速查

| 规则 | 说明 |
|---|---|
| 请假/加班 | 员工/劳工可发起，项目经理初审，CEO终审 |
| 工伤补偿 | 仅劳工可发起（财务/项目经理可代录入），初审+终审 |
| 施工日志 | 仅劳工可提交，项目经理初审（CEO不终审） |
| 工资条查看 | 员工/劳工仅看自己的；财务/CEO可看全部 |
| 结算执行 | 仅财务可操作（CEO不可执行预结算/正式结算） |
| 通讯录导入 | 仅财务可操作，支持预览、映射、增量更新 |
| 角色配置 | 仅 CEO 可新增角色并配置权限 |
| 数据有效期 | 仅 CEO 可配置全局/分类有效期 |

## 7. 测试账号

| 账号 | 密码 | 角色 | 员工类型 | 可见模块 |
|---|---|---|---|---|
| employee.demo | 123456 | 员工 | OFFICE | 工作台、表单、工资条 |
| worker.demo | 123456 | 劳工 | LABOR | 工作台、表单（含施工日志/工伤补偿）、工资条 |
| finance.demo | 123456 | 财务 | OFFICE | 工作台、审批、员工、工资、通讯录导入 |
| pm.demo | 123456 | 项目经理 | OFFICE | 工作台、审批、项目、表单 |
| ceo.demo | 123456 | CEO | OFFICE | 全部模块 |

- Web 端登录页直接输入账号密码
- 后端不可用时前端自动回退到本地测试账号校验，便于实时预览

## 8. 当前进度

### 已完成
- ✅ 工程稳定性修复（前后端编译、测试通过）
- ✅ 门户工作台与统一视觉基线（适配 PC / 平板 / 手机三端）
- ✅ 组织管理入口：员工管理、项目管理、通讯录导入
- ✅ 后端基础 API：认证、表单、薪资、角色、项目、员工

### 进行中
- 🔄 表单审批闭环：打通「提交 → 待办 → 审批 → 归档」完整流程
- 🔄 工作台数据聚合：将静态展示替换为后端聚合接口

### 待启动
- ⏳ 企业微信身份登录对接
- ⏳ 薪资规则配置页面
- ⏳ 数据有效期与清理任务管理
