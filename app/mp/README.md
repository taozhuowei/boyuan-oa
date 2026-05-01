# 博渊 OA — 小程序端组件规范

适用范围：`app/mp/`，uni-app + Vant 4.x（uni-app 适配版）。

跨平台通用设计规范（配色、字体、间距、圆角）见 `app/README.md`，本文件仅记录小程序端特有的组件选型、布局差异和规范。

---

## 组件库

Vant 4.x，使用 uni-app 适配版本。

主色变量覆盖（在 `src/styles/` 的全局 SCSS 入口文件中配置）：

```scss
:root {
  --van-primary-color: #007AFF;
  --van-success-color: #34C759;
  --van-warning-color: #FF9500;
  --van-danger-color: #FF3B30;
}
```

---

## 与 Web 端的主要差异

**导航结构不同。** 小程序端使用固定底部 `van-tabbar` 替代 Web 端的左侧 220px 导航栏，承载 4–5 个主要模块入口。模块内部的二级导航使用顶部 `van-tabs` 或列表点击进入子页面。

**弹出层优先底部弹出。** 移动端拇指操作区在屏幕下半段，所有选择器、确认框、附加操作优先使用 `van-popup position="bottom"`，而非居中弹窗。对话确认（不可逆操作）例外，使用 `van-dialog` 居中展示。

**表单布局更紧凑。** 字段以 `van-cell` 样式垂直排列，标签在上、输入在下，不采用 Web 端的左右分栏布局。

**无侧边栏，无面包屑。** 页面层级通过 `van-nav-bar` 的返回按钮体现，标题区显示当前页面名称。

---

## 组件对照表

### 基础输入

- 单行文本 → `van-field`（cell 样式，`type="text"`）
- 多行文本 → `van-field`（`type="textarea"`，`autosize`）
- 下拉选择 → `van-picker` + `van-popup`（底部弹出）
- 日期选择 → `van-date-picker` + `van-popup`（底部弹出）
- 文件上传 → `van-uploader`（封装为自定义组件 `FileUpload`）

### 布局与导航

- 顶部导航 → `van-nav-bar`（页面标题 + 左侧返回按钮）
- 底部标签栏 → `van-tabbar`（主要模块入口，固定底部）
- 标签页 → `van-tabs`（模块内二级导航）
- 分割线 → `van-divider`

### 数据展示

- 列表 → `van-list`（支持下拉加载更多）
- 单元格 → `van-cell` / `van-cell-group`
- 卡片 → `van-card`
- 空状态 → `van-empty`
- 标签 → `van-tag`
- 徽章 → `van-badge`
- 时间线 → `van-steps`（封装为自定义组件 `ApprovalTimeline`）

### 反馈

- Toast → `van-toast`（顶部位置，3 秒自动消失）
- 弹窗 → `van-dialog`（居中，用于不可逆操作确认）
- 底部弹出 → `van-popup position="bottom"`（选择器、附加操作、详情预览）
- 加载中 → `van-loading`

### 按钮

- 主操作 → `van-button type="primary"`（颜色 `#007AFF`）
- 危险操作 → `van-button type="danger"`（颜色 `#FF3B30`）

---

## 底部 TabBar 规范

固定在屏幕底部，图标 + 文字标签，选中色 `#007AFF`，未选中色 `#636366`。

默认标签（具体标签随已启用模块调整）：

- 首页（宫格入口）
- 待办
- 个人中心

规则：

- 标签数不超过 5 个，超出时合并低频模块至「更多」入口
- 每个标签必须有图标，图标尺寸 24px
- 未读数徽章样式与 Web 端 TopBar 保持一致

---

## 文件结构参考

```
app/mp/
└── src/
    ├── components/
    │   ├── cross-platform/   # 与 h5 共享逻辑的跨平台组件
    │   └── customized/       # 小程序端专用自定义组件
    │       ├── ApprovalTimeline/
    │       ├── FileUpload/
    │       └── ...
    ├── composables/          # 组合式函数
    ├── layouts/              # uni-app 布局
    ├── pages/                # 页面文件
    │   ├── index/            # 首页（宫格）
    │   ├── todo/             # 待办
    │   └── ...
    ├── stores/               # Pinia 状态
    ├── styles/               # 全局样式（含 Vant 变量覆盖）
    └── utils/                # 工具函数
```

---

## 相关文档

- 跨平台设计规范：`app/README.md`
- Web 端组件规范：`app/h5/README.md`
- 业务设计文档：`DESIGN.md`
