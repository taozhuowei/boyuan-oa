# Bug 快速定位指南

这份文档的作用：测试时发现问题后，根据**症状**找到**对应的代码位置**，不需要熟悉整个代码库。

本项目无外部错误追踪系统（无 Sentry/LogRocket）。定位依赖以下两层结构：

- **前端守卫层**：路由跳转和菜单可见性由两个文件控制
- **后端权限层**：每个 API 端点的访问控制由 `@PreAuthorize` 注解控制

---

## 一、按症状定位

### 症状：页面被跳转回首页 `/`

访问某页面后自动跳转到 `/`，说明**前端路由守卫**拦截了。

**定位文件：**[`app/h5/middleware/auth.global.ts`](../app/h5/middleware/auth.global.ts)

**查看重点：** `PAGE_ACCESS` 对象（第 12 行起）

```
该对象列出了"只有特定角色才能访问"的页面。
规则：未列入的页面对所有已登录用户开放。
```

**诊断步骤：**
- 该路径是否在 `PAGE_ACCESS` 中有条目？
  - 有：检查当前角色是否在对应的角色数组里
  - 没有：说明该页面对所有人开放，不应被跳转 → 检查其他拦截逻辑

---

### 症状：菜单里看不到某个功能入口

侧边栏中某个角色缺少某菜单项。

**定位文件：**[`app/h5/layouts/default.vue`](../app/h5/layouts/default.vue)

**查看重点：** `ROLE_MENUS` 对象（搜索 `ROLE_MENUS` 关键字）

```
该对象按角色代码（ceo / hr / finance 等）列出各自的侧边栏菜单项。
PAGE_ACCESS 控制"能不能访问"，ROLE_MENUS 控制"菜单里能不能看到"。
两者互相独立，都需要配置。
```

**诊断步骤：**
- 找到对应角色的菜单数组，检查目标路径是否在列

---

### 症状：API 返回 403 Forbidden

已登录但某个接口返回 403，说明**后端 `@PreAuthorize`** 拦截了当前角色。

**定位方式：** 根据 API 路径找到对应 Controller

```bash
# 搜索对应路径的 Controller
grep -rn "\"/<path>\"" server/src/main/java/com/oa/backend/controller/

# 然后在对应 Controller 文件中找 @PreAuthorize
grep -n "PreAuthorize" server/src/main/java/com/oa/backend/controller/<Controller>.java
```

**Controller 路径速查表（主要）：**

- `/employees` → `EmployeeController.java`
- `/team` → `TeamController.java`
- `/forms` → `FormController.java`
- `/payroll` → `PayrollController.java`
- `/expense` → `ExpenseController.java`
- `/attendance` / `/config/leave-types` → `LeaveTypeController.java`
- `/injury` → `InjuryClaim相关Controller.java`
- `/logs/records` → 操作日志相关 Controller
- `/org` / `/departments` → `DepartmentController.java`
- `/positions` → `PositionController.java`
- `/roles` → `RoleController.java`

**诊断步骤：**
- 找到 `@PreAuthorize` 注解，检查 `hasAnyRole(...)` 中是否包含当前用户的角色
- 注意：Spring Security 角色大写（`'HR'`），数据库存储小写（`hr`），两者对应

---

### 症状：API 返回 404 Not Found

两种情况：

**情况 A：Controller 和方法都已实现，但后端服务未重启**

Spring Boot 使用 `./mvnw spring-boot:run` 启动，修改 Java 文件后需要重启才能生效。

```bash
# 验证方法：直接 curl 确认
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/<path>
```

**情况 B：Controller 或方法根本未实现**

```bash
# 搜索对应路径有没有 Controller 注册
grep -rn "\"/<path>\"" server/src/main/java/com/oa/backend/controller/
```

---

### 症状：API 返回 500 Internal Server Error

后端抛出异常，**查看 Spring Boot 控制台输出**（运行 `./mvnw spring-boot:run` 的终端）。

常见原因：
- 表不存在（DDL 未在 `V1__init_schema.sql` 中定义）
- 表存在但为空，业务逻辑对空结果做了非空处理
- `local/seed-data.sql` 缺少初始数据

**验证方式：** 控制台会打印完整异常堆栈，直接定位到出错的 Service / Mapper 行

---

### 症状：Toast 显示原始 HTTP 错误字符串

格式如 `[POST] "/api/...": 400 Bad Request`，说明前端 catch 块没有提取后端返回的 `message` 字段。

**定位文件：** 对应页面组件，搜索 catch 块

```bash
grep -rn "catch" app/h5/pages/<page-path>.vue | grep -i "message\|error"
```

**标准修复模式：**

```typescript
// 错误：直接 toString()
message.error(String(error))

// 正确：提取后端 message 字段
message.error((error as any)?.data?.message || '操作失败，请重试')
```

---

### 症状：表单提交无任何校验响应

某字段输入无效值，点击提交无任何错误提示。

**定位文件：** 对应页面的表单组件

```bash
# 搜索该页面中 a-form-item 的 :rules 绑定
grep -n ":rules\|rules=" app/h5/pages/<page-path>.vue
```

**检查项：**
- 字段是否有 `:rules` 绑定
- `a-form` 是否有 `ref="formRef"` 并在提交时调用 `formRef.value.validate()`
- 数字类型字段是否有 `:min` / `:max` 约束

---

### 症状：菜单可见但数据全空（"暂无数据"）

页面能打开，但列表/表格无数据。常见原因：

- **API 返回 200 但数据库为空** → 检查 `local/seed-data.sql` 是否有对应表的记录
- **API 返回 403/404** → 查看浏览器开发者工具 Network 面板，确认具体 HTTP 状态码，再按 403/404 症状处理

---

## 二、权限双层结构速查

测试发现权限问题时，必须同时检查两层。两层互相独立，只修一层不够。

```
用户访问某路由
    │
    ▼
【前端路由守卫】auth.global.ts → PAGE_ACCESS
    是否列出该路由？
    是 → 当前角色是否在白名单？否 → 跳转首页
    否 → 放行（所有已登录用户可访问）
    │
    ▼
【页面加载，发起 API 请求】
    │
    ▼
【后端权限层】Controller @PreAuthorize
    当前 JWT 中的角色是否满足注解条件？否 → 403
    │
    ▼
页面正常显示数据
```

**BUG-E02（Employee 访问 `/data-export`）的根因就是第一层漏配：**  
`PAGE_ACCESS` 中没有 `/data-export` 条目，导致前端放行；后端恰好也没有权限限制。

---

## 三、角色代码对应关系

前端 cookie / `auth.global.ts` 中使用小写角色代码，后端 `@PreAuthorize` 中使用大写。

| 前端角色代码 | 后端 Spring Security 角色 |
|---|---|
| `ceo` | `ROLE_CEO` / `'CEO'` |
| `hr` | `ROLE_HR` / `'HR'` |
| `finance` | `ROLE_FINANCE` / `'FINANCE'` |
| `project_manager` | `ROLE_PROJECT_MANAGER` / `'PROJECT_MANAGER'` |
| `department_manager` | `ROLE_DEPARTMENT_MANAGER` / `'DEPARTMENT_MANAGER'` |
| `employee` | `ROLE_EMPLOYEE` / `'EMPLOYEE'` |
| `worker` | `ROLE_WORKER` / `'WORKER'` |

---

## 四、常用快速验证命令

```bash
# 确认后端某接口是否存在、是否需要认证
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/<path>

# 带 token 调用（从浏览器 Cookie 中复制 oa-token）
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/<path>

# 搜索某路径对应的 Controller
grep -rn "RequestMapping\|GetMapping\|PostMapping\|PutMapping\|DeleteMapping" \
  server/src/main/java/com/oa/backend/controller/ | grep "<path>"

# 搜索某 Controller 的所有权限注解
grep -n "PreAuthorize" server/src/main/java/com/oa/backend/controller/<File>.java

# 搜索前端某页面的错误处理
grep -n "catch\|message.error" app/h5/pages/<path>.vue

# 搜索前端某页面的表单校验规则
grep -n ":rules\|rules=" app/h5/pages/<path>.vue
```
