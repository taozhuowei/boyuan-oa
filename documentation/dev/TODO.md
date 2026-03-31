# 开发进度管理

## 总体进度

| 阶段 | 名称 | 状态 | 计划时间 | 实际完成 |
|------|------|------|----------|----------|
| 一 | 需求分析与设计 | ✅ 已完成 | - | - |
| 二 | 工程基础与启动能力 | ✅ 已完成 | - | - |
| 三 | 业务功能完善 | ⏳ 进行中 | - | - |
| 四 | 测试与优化 | ⏸ 未开始 | - | - |
| 五 | 部署上线 | ⏸ 未开始 | - | - |

---

## 前端进度

### 当前阶段
**阶段二：工程基础与启动能力** → **架构重构中**

### 架构重构任务

#### Phase 1: 基础设施（并行）
- [ ] 创建 `adapters/config/components.json` - 组件映射配置
- [ ] 创建 `adapters/config/props-map.json` - 属性映射配置
- [ ] 创建 `adapters/resolver.ts` - 配置解析器
- [ ] 创建 `adapters/index.ts` - 统一导出
- [ ] 创建 `styles/variables.scss` - SCSS 变量
- [ ] 创建 `styles/antd-override.scss` - AntD 样式覆盖
- [ ] 创建 `styles/vant-override.scss` - Vant 样式覆盖

#### Phase 2: 核心组件（依赖 Phase 1）
- [ ] 创建 `components/cross-platform/Card.vue` - 双端卡片对齐
- [ ] 创建 `components/cross-platform/Timeline.vue` - 时间轴
- [ ] 重写 `components/customized/StatCard.vue` - 统计卡片
- [ ] 重写 `components/customized/ModuleCard.vue` - 模块入口卡片

#### Phase 3: 清理旧代码
- [ ] 删除 `components/ui-kit/` - 旧组件库
- [ ] 删除 `components/ui/` - 旧业务组件
- [ ] 删除 `components/layout/` - 如无特殊需求

#### Phase 4: 页面迁移（并行）
- [ ] 迁移 `pages/login/index.vue`
- [ ] 迁移 `pages/index/index.vue`
- [ ] 迁移 `pages/attendance/index.vue`（添加 Timeline 审批流程）
- [ ] 迁移 `pages/payroll/index.vue`（添加 Timeline 审批流程）
- [ ] 迁移 `pages/projects/index.vue`（添加 Timeline 施工日志）
- [ ] 迁移 `pages/employees/index.vue`
- [ ] 迁移 `pages/role/index.vue`

#### Phase 5: 验证与提交
- [ ] `yarn type-check` 类型检查
- [ ] `yarn dev:web` H5 验证
- [ ] Git 提交

### 业务模块进度

#### 考勤管理模块
- [x] 考勤页面架构（CEO/员工双视图）
- [x] 请假/加班申请表单
- [x] 审批流程界面
- [ ] 审批流程 Timeline 时间轴
- [ ] 考勤统计图表

#### 薪资管理模块
- [x] 薪资查询页面（双视图）
- [ ] 审批流程 Timeline 时间轴
- [ ] 薪资明细

#### 项目管理模块
- [ ] 项目列表
- [ ] 施工日志 Timeline 时间轴
- [ ] 项目详情

#### 员工管理模块
- [ ] 员工列表
- [ ] 员工详情
- [ ] 权限设置

---

## 后端进度

### 当前阶段
**阶段二：工程基础与启动能力** ✅ 已完成

### 已完成

#### 工程搭建
- [x] Spring Boot 项目初始化
- [x] 数据库配置 (PostgreSQL)
- [x] MyBatis-Plus 集成
- [x] 统一响应封装
- [x] 全局异常处理

#### 用户认证
- [x] JWT 认证机制
- [x] 登录接口
- [x] 登出接口
- [x] Token 刷新

#### 权限体系
- [x] 角色定义 (CEO、项目经理、员工、财务、劳工)
- [x] 权限注解 (@PreAuthorize)
- [x] SecurityUtils 工具类

#### 基础实体
- [x] 用户实体
- [x] 角色实体
- [x] 部门实体
- [x] 项目实体

### 待开发

#### 考勤模块
- [ ] 考勤记录实体
- [ ] 打卡接口
- [ ] 考勤统计接口

#### 薪资模块
- [ ] 薪资记录实体
- [ ] 薪资查询接口
- [ ] 薪资计算服务

#### 项目模块
- [ ] 施工日志实体
- [ ] 审批记录实体
- [ ] 项目 CRUD 接口

#### 员工模块
- [ ] 员工信息 CRUD
- [ ] 员工搜索/筛选
- [ ] 员工权限管理

---

## 历史记录

### 2026-03-31 前期完成（旧架构）
- [x] 工程稳定性修复（前后端编译、测试通过）
- [x] 门户工作台与统一视觉基线
- [x] 组织管理入口：员工管理、项目管理、通讯录导入
- [x] 后端基础 API：认证、表单、薪资、角色、项目、员工
- [x] 三系统分离架构重构（考勤、薪酬、项目）
- [x] 角色权限矩阵调整

---

## 组件分类规则

| 目录 | 用途 | 示例 |
|------|------|------|
| `adapters/` | 平台适配 | 读取 JSON 配置返回对应平台组件 |
| `components/cross-platform/` | 双端对齐 | Card, Timeline（组件库表现不一致时） |
| `components/customized/` | 定制扩展 | StatCard, ModuleCard（组件库没有） |
| `components/business/` | 业务逻辑 | （暂无，需要时创建） |

## 开发原则

1. **优先使用组件库** - Ant Design Vue / Vant 直接导入
2. **禁止无意义封装** - 不创建只是转发 props 的中间层
3. **JSON 配置驱动** - 平台差异通过 JSON 配置解决
4. **组件必要性审查** - 每个组件创建前自问：是否必要？能否复用？
