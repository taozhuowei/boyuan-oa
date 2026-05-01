# 博渊 OA — Web 端组件规范

适用范围：`app/h5/`，Nuxt 3 + Ant Design Vue 4.x。

跨平台通用设计规范（配色、字体、间距、圆角）见 `app/README.md`，本文件仅记录 Web 端特有的组件选型、配置和规范。

---

## 组件库

Ant Design Vue 4.x。通过 `unplugin-vue-components` 自动按需引入，无需手动 import 组件。

主色令牌覆盖（在 `nuxt.config.ts` 的 Vite 配置或全局 CSS 变量中配置）：

```js
// antd ConfigProvider token 覆盖
colorPrimary: '#007AFF',
colorSuccess: '#34C759',
colorWarning: '#FF9500',
colorError: '#FF3B30',
```

---

## 组件对照表

### 基础输入

- 单行文本 → `a-input`
- 多行文本 → `a-textarea`
- 数字输入 → `a-input-number`
- 下拉选择 → `a-select`
- 日期选择 → `a-date-picker`
- 日期范围 → `a-range-picker`
- 时间选择 → `a-time-picker`
- 复选框 → `a-checkbox` / `a-checkbox-group`
- 单选按钮 → `a-radio` / `a-radio-group`
- 开关 → `a-switch`
- 文件上传 → `a-upload`（封装为自定义组件 `customized-file-upload`）

### 布局与导航

- 顶栏 → 自定义组件（基于 `a-layout-header`，详见下方 TopBar 规范）
- 侧边菜单 → `a-menu`（`mode="inline"`，宽度 220px，`theme="dark"`）
- 面包屑 → `a-breadcrumb`（内容区标题区域）
- 标签页 → `a-tabs`
- 分页 → `a-pagination`

### 数据展示

- 表格 → `a-table`（大数据量场景开启 `scroll.y` 虚拟滚动）
- 描述列表 → `a-descriptions`（详情页字段展示）
- 卡片 → `a-card`
- 空状态 → `a-empty`
- 骨架屏 → `a-skeleton`
- 标签 → `a-tag`
- 徽章 → `a-badge`
- 头像 → `a-avatar`
- 时间线 → `a-timeline`（封装为自定义组件 `customized-approval-timeline`）

### 反馈

- Toast → `a-message`（`position` 设为 `top`，`duration` 3 秒）
- 弹窗 → `a-modal`（Dialog 模式，参见通用反馈规范）
- 抽屉 → `a-drawer`（侧拉面板，适用于详情预览和二级表单）
- 加载中 → `a-spin`
- 进度条 → `a-progress`

### 按钮

- 主操作 → `a-button type="primary"`（背景色 `#007AFF`）
- 次操作 → `a-button`（默认灰色边框样式）
- 危险操作 → `a-button danger`
- 文字按钮 → `a-button type="link"`

### 表单

- 表单容器 → `a-form`（主要使用 `layout="vertical"`）
- 表单项 → `a-form-item`（统一通过 `rules` 属性声明校验规则，校验信息展示在字段下方）

---

## TopBar 规范

文件位置：`app/h5/components/customized/`（Nuxt 自动注册为 `customized-top-bar`）

布局参数：

- 高度：56px
- 背景色：`#FFFFFF`
- 底部边框：`1px solid #C6C6C8`

左侧区域：

- 系统名称或 Logo，点击后跳转至 `/workbench`

右侧区域（从右到左依次排列）：

- 个人头像 `a-avatar`：点击展开下拉菜单，包含「个人信息」「修改密码」「退出登录」三项
- 待办数 `a-badge`：显示未完成待办总数，点击跳转 `/todo`
- 通知铃 `a-badge`：显示未读通知数，点击跳转 `/notifications`

---

## 模块宫格规范（ModuleTile）

文件位置：`app/h5/components/customized/`（Nuxt 自动注册为 `customized-module-tile`）

仅在 workbench 首页使用，展示当前账号有权限访问的已启用模块。

尺寸与样式：

- 每个 tile：96px × 96px
- 模块图标：32px，居中
- 模块名：12px，`#000000`，图标下方 8px

交互状态：

- 默认态：背景 `#FFFFFF`，圆角 8px
- 悬停态：背景色切换为 `#F2F2F7`，`translateY(-2px)`，过渡时长 150ms，缓动函数 `ease`
- 点击：导航至该模块首页

---

## 文件结构参考

```
app/h5/
├── assets/               # 全局样式（ant-reset.css、app-loading.css）
├── components/
│   └── customized/       # 业务自定义组件
│       ├── ApprovalTimeline.vue
│       ├── FileUpload/
│       ├── SignatureCanvas/
│       └── ...
├── composables/          # 组合式函数
├── layouts/
│   └── default.vue       # 主布局（TopBar + 侧边菜单 + 内容区）
├── middleware/
│   └── auth.global.ts    # 全局路由守卫，维护 PAGE_ACCESS 权限表
├── pages/                # 文件系统路由
├── stores/
│   └── user.ts           # Pinia 用户状态
├── utils/
│   └── http.ts           # HTTP 请求封装
└── nuxt.config.ts        # Nuxt 配置（含 antd token 覆盖、路由代理）
```

---

## 相关文档

- 跨平台设计规范：`app/README.md`
- 小程序端组件规范：`app/mp/README.md`
- 前端实现细节：`app/h5/FRONTEND_IMPL.md`
