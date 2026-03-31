# 众维 OA 重构开发任务追踪

> 原始任务时间：2026-03-31 17:20+
> 记录规则：每完成一步在前面加 `[x] 时间戳`

---

## 准备阶段
- [x] 2026-03-31 17:05 删除 tools/skills，迁移到全局 ~/.agents/skills/
- [x] 2026-03-31 17:05 文档目录重命名为 documentation/，按受众分 ai/dev/biz 三目录
- [x] 2026-03-31 17:05 安装 impeccable skill 到全局（21 个子 skill）
- [x] 2026-03-31 17:05 安装 qa-expert skill 到全局
- [x] 2026-03-31 17:16 删除 tools 目录下所有文件，创建 test/ 目录结构
- [x] 2026-03-31 17:17 初始化 git 仓库并提交 baseline

---

## 阶段一：前端基础架构重构

### 1.1 组件库与样式系统
- [x] 2026-03-31 18:20 创建 UI 组件目录结构
- [x] 2026-03-31 18:20 创建 Icon.vue（SVG 内联，小程序兼容）
- [x] 2026-03-31 18:20 创建 Panel.vue、Button.vue、Empty.vue、Badge.vue
- [x] 2026-03-31 18:20 创建 ListItem.vue、StatCard.vue、ModuleCard.vue、Timeline.vue
- [x] 2026-03-31 18:20 重构 App.vue 全局样式与 CSS 变量
- [x] 2026-03-31 18:20 创建 useDevice 组合式函数

### 1.2 登录页重构
- [x] 2026-03-31 18:20 使用新组件重写 login/index.vue
- [x] 2026-03-31 18:20 保持业务逻辑，简化样式

### 1.3 工作台重构
- [x] 2026-03-31 18:20 重写 index/index.vue
- [x] 2026-03-31 18:20 使用 StatCard/ModuleCard/ListItem 组件
- [x] 2026-03-31 18:20 引入图标替代文字
- [x] 2026-03-31 18:20 简化 workbench-data.ts

### 1.4 前端测试补充
- [x] 2026-03-31 18:20 Icon/Button/Panel 单元测试
- [x] 2026-03-31 18:20 登录页/工作台单元测试
- [x] 2026-03-31 18:20 运行 yarn test:web 通过
- [x] 2026-03-31 18:20 **Git 提交**

---

## 阶段二：后端代码 Review 与重构

### 2.1 后端 Review
- [x] 2026-03-31 18:30 子 Agent 审查后端代码
- [x] 2026-03-31 18:30 输出 review 报告到 test/reports/backend-review.md

### 2.2 权限重构
- [ ] 提取通用权限注解/AOP
- [ ] 简化 Controller 权限代码

### 2.3 Service 完善
- [ ] 完善 OaDataService 表单审批闭环
- [ ] 完善薪资结算闭环
- [ ] 补充缺失 Mapper/SQL

### 2.4 后端测试
- [ ] 补充 Service/Controller 测试
- [ ] 运行 mvn test 通过
- [ ] **Git 提交**

---

## 阶段三：业务页面重构与开发

### 3.1 表单中心
- [x] 2026-03-31 18:30 重构 forms/index.vue（精简版）
- [x] 2026-03-31 18:30 优化表单渲染与审批 UX

### 3.2 组织管理页面
- [ ] 重构 employees/index.vue
- [ ] 重构 projects/index.vue
- [ ] 重构 directory/index.vue
- [ ] **Git 提交**

### 3.3 角色管理
- [x] 2026-03-31 18:30 重构 role/index.vue（精简版）

### 3.4 薪资页面
- [ ] 创建 payroll/index.vue
- [ ] 创建 payroll-admin/index.vue
- [ ] 更新 pages.json
- [ ] **Git 提交**

### 3.5 业务页面测试
- [ ] 表单中心测试
- [ ] 组织管理页面测试
- [ ] **Git 提交**

---

## 阶段四：集成与 E2E 测试

### 4.1 集成测试
- [ ] 创建 test/integration API 测试脚本
- [ ] 覆盖认证、表单、薪资、审批接口

### 4.2 E2E 测试
- [ ] 创建 test/e2e 端到端测试
- [ ] 覆盖 5 角色核心流程

### 4.3 全功能测试执行
- [ ] 运行全部测试套件
- [ ] 记录问题到 test/reports/
- [ ] **Git 提交**

---

## 阶段五：最终 Polish

### 5.1 最终检查
- [ ] 调用 audit/polish skill 检查
- [ ] 修复细节问题

### 5.2 文档更新
- [ ] 更新 AGENTS.md 进度
- [ ] 更新测试报告

### 5.3 最终提交
- [ ] 最终 git commit
- [ ] 标记项目完成
