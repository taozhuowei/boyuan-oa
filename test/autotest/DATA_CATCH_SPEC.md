# data-catch 属性规范

## 用途

在没有标准语义定位（ARIA role、label、placeholder、可见文本）能稳定命中的 DOM 元素上，
附加 `data-catch="<unique-id>"` 属性，作为自动化测试的强定位锚点。

## 何时加

| 情形 | 是否加 |
|---|---|
| `<a-button>提交</a-button>` 有唯一可见文本 | 不加（用 role） |
| 多个同文本按钮（表格每行"删除"按钮） | 加 |
| 无文本的图标按钮（如 `<a-button icon>...`） | 加 |
| `<a-input>` 有 `label` | 不加（用 label） |
| `<a-input>` 在 `<a-form-item label="...">` 外 | 加 |
| 数字统计卡片（可点击） | 加 |
| 列表项、卡片容器（需断言/点击） | 加 |
| 模态框、抽屉容器 | 加 |
| 导航菜单项（侧边栏） | 加（多菜单文本可能重复） |
| Toast、Alert 容器（需断言内容） | 加 |
| 表格行（按数据索引） | 加，值可含行标识 |

## 命名规则

**格式**：`<page>-<component>-<action|field|role>`

- 全小写，用短横线连接
- `page`：对应页面路由或模块，如 `login`、`me`、`payroll`
- `component`：同一页面内逻辑分组，如 `form`、`list`、`card`、`modal`
- `action|field|role`：元素语义，如 `submit`、`name-input`、`delete-btn`

**全局唯一**：同一项目内不得出现两个相同 `data-catch` 值；列表行用数据 id 后缀。

### 示例

| 元素 | data-catch |
|---|---|
| 登录页用户名输入框 | `login-form-username` |
| 登录页密码输入框 | `login-form-password` |
| 登录页登录按钮 | `login-form-submit` |
| 登录页"忘记密码"链接 | `login-form-forgot-link` |
| 个人信息页修改密码按钮 | `me-profile-change-password-btn` |
| 改密码页旧密码 | `me-password-old-input` |
| 改密码页新密码 | `me-password-new-input` |
| 改密码页确认新密码 | `me-password-confirm-input` |
| 改密码页提交 | `me-password-submit` |
| 工作台活跃项目卡片 | `workbench-card-active-projects` |
| 工作台待办卡片 | `workbench-card-todos` |
| 员工列表新建按钮 | `employees-list-create-btn` |
| 员工列表搜索框 | `employees-list-search-input` |
| 员工列表某行编辑按钮 | `employees-row-edit-btn-{employeeId}` |
| 员工创建表单姓名输入 | `employees-form-name-input` |
| 员工创建表单部门选择 | `employees-form-department-select` |
| 员工创建表单提交 | `employees-form-submit` |
| 薪资周期创建按钮 | `payroll-cycles-create-btn` |
| 薪资结算确认按钮 | `payroll-settle-confirm-btn` |
| 工资条签字 PIN 输入 | `payroll-sign-pin-input` |
| 工资条签字确认 | `payroll-sign-submit` |
| 侧边栏菜单"项目" | `sidebar-menu-projects` |
| 侧边栏菜单"薪资结算" | `sidebar-menu-payroll` |
| Toast 容器 | `toast-container` |
| 确认对话框"确定" | `confirm-modal-ok` *(skipped: a-popconfirm built-in OK has no hookable element; use text "确定" in tests)* |
| 确认对话框"取消" | `confirm-modal-cancel` *(skipped: a-popconfirm built-in cancel has no hookable element)* |

### 列表行命名

行按数据 id 后缀以确保唯一：

```html
<a-table-row
  v-for="row in rows"
  :key="row.id"
  :data-catch="`employees-row-${row.id}`"
>
  <a-button :data-catch="`employees-row-edit-btn-${row.id}`">编辑</a-button>
  <a-button :data-catch="`employees-row-delete-btn-${row.id}`">删除</a-button>
</a-table-row>
```

## 定位器使用

autotest 的 `locator.ts` 支持 `by: 'catch'`：

```ts
{ by: 'catch', value: 'login-form-submit' }
```

内部展开为 Playwright locator：`page.locator('[data-catch="login-form-submit"]')`。

## 禁止

- 不得为已能稳定用 role/label/text 命中的元素加 `data-catch`（冗余）
- 不得将 `data-catch` 用于 CSS 选择器样式
- 不得动态生成无意义的值（如时间戳、random）
- 不得复用相同值（全局唯一校验）

## 全局唯一校验

所有 `data-catch` 值需登记到 `test/autotest/data_catch_registry.json`，由 Kimi 提交时一并更新。
格式：
```json
{
  "login-form-username": "app/h5/pages/login.vue",
  "login-form-submit": "app/h5/pages/login.vue",
  ...
}
```

执行前跑校验脚本扫描整个 `app/h5` 目录，统计同名冲突。

## 跳过清单

- `confirm-modal-ok` / `confirm-modal-cancel` — a-popconfirm 内置按钮没有可挂载的 DOM 节点，测试中直接用按钮文本 "确定"/"取消" 定位。
- `datepicker-today` — Ant Design Vue 的 a-date-picker 没有暴露可绑定的 "今天" 单元格节点，暂无法挂载 data-catch。
