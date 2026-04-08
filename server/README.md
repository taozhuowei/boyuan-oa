# 博渊 OA 后端

博渊 OA 系统的后端服务，为前端提供 RESTful API 支持。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Java | 17 | 开发语言 |
| Spring Boot | 3.2.4 | 应用框架 |
| Spring Security | 6.x | 安全框架 |
| MyBatis-Plus | 3.5.6 | ORM 框架 |
| JWT | 4.4.0 | 认证机制 |
| PostgreSQL | 15 | 生产数据库 |
| H2 | - | 开发/测试数据库 |
| JUnit 5 | - | 单元测试 |

## 目录结构

```
server/
├── src/
│   ├── main/
│   │   ├── java/com/oa/backend/
│   │   │   ├── OaBackendApplication.java    # 启动类
│   │   │   ├──
│   │   │   ├── config/                      # 配置类
│   │   │   │   ├── MybatisPlusConfig.java
│   │   │   │   └── SecurityConfig.java
│   │   │   │
│   │   │   ├── controller/                  # 控制器（HTTP 入口）
│   │   │   │   ├── AuthController.java      # 认证相关
│   │   │   │   ├── EmployeeController.java  # 员工管理
│   │   │   │   ├── DepartmentController.java
│   │   │   │   ├── PositionController.java
│   │   │   │   ├── ProjectController.java
│   │   │   │   ├── AttendanceController.java
│   │   │   │   ├── PayrollController.java
│   │   │   │   ├── FormController.java      # 审批表单
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── service/                     # 服务层（业务逻辑）
│   │   │   │   ├── EmployeeService.java
│   │   │   │   ├── ApprovalFlowService.java # 审批流引擎
│   │   │   │   ├── FormService.java
│   │   │   │   ├── PositionService.java
│   │   │   │   ├── ProjectService.java
│   │   │   │   └── impl/                    # 实现类
│   │   │   │
│   │   │   ├── entity/                      # 实体类（MyBatis-Plus）
│   │   │   │   ├── Employee.java
│   │   │   │   ├── Department.java
│   │   │   │   ├── Position.java
│   │   │   │   ├── Project.java
│   │   │   │   ├── ApprovalFlowDef.java     # 审批流定义
│   │   │   │   ├── ApprovalFlowNode.java    # 审批节点
│   │   │   │   ├── ApprovalRecord.java      # 审批记录
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── dto/                         # 数据传输对象
│   │   │   │   ├── *Request.java            # 请求 DTO
│   │   │   │   └── *Response.java           # 响应 DTO
│   │   │   │
│   │   │   ├── mapper/                      # MyBatis 映射
│   │   │   │   └── *.java
│   │   │   │
│   │   │   ├── security/                    # 安全相关
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   ├── JwtTokenService.java
│   │   │   │   └── SecurityUtils.java
│   │   │   │
│   │   │   └── dto/                         # 数据传输对象
│   │   │
│   │   └── resources/
│   │       ├── application.yml              # 应用配置
│   │       └── db/
│   │           ├── schema.sql               # 数据库表结构（35张表）
│   │           ├── data.sql                 # 种子数据
│   │           └── preset-construction.sql  # 施工行业预设数据
│   │
│   └── test/                                # 单元测试
│       ├── java/com/oa/backend/
│       │   ├── controller/                  # 控制器测试
│       │   ├── service/                     # 服务层测试
│       │   └── security/                    # 安全测试
│       └── resources/
│           └── application.yml              # 测试配置
│
└── pom.xml                                  # Maven 配置
```

## 快速开始

```bash
# 编译
mvn clean compile

# 运行测试
mvn test

# 启动开发服务器
mvn spring-boot:run

# 打包
mvn clean package

# 初始化数据库（需要 PostgreSQL）
psql -U postgres -f src/main/resources/db/schema.sql
```

## 配置文件

### 开发环境（默认）

使用 H2 内存数据库，自动执行 `schema.sql` 和 `data.sql`：

```yaml
spring:
  profiles:
    active: dev
  datasource:
    url: jdbc:h2:mem:oa_dev
```

### 生产环境

```bash
# 指定生产配置运行
mvn spring-boot:run -Dspring.profiles.active=prod
```

## API 规范

- 基础路径：`/api`
- 认证方式：JWT Bearer Token
- 响应格式：`{ "code": 200, "data": {}, "message": "ok" }`

## 核心模块

| 模块 | 说明 |
|------|------|
| 身份认证 | JWT 登录、登出、密码重置 |
| 组织管理 | 部门、岗位、员工 CRUD |
| 项目管理 | 项目、成员、里程碑 |
| 审批流引擎 | 审批定义、节点、记录 |
| 考勤管理 | 请假、加班、工伤审批 |
| 薪资管理 | 工资条、结算周期 |

## 更多文档

- [后端实现细节](../docs/BACKEND_IMPL.md)
- [系统架构设计](../docs/ARCHITECTURE.md)
- [业务设计文档](../docs/DESIGN.md)
- [API 测试脚本](../test/run-all.bat)
