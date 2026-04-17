# 博渊 OA 后端

Spring Boot REST API 服务。

## 技术栈

- **Java**：17
- **Spring Boot**：3.2.4
- **MyBatis-Plus**：3.5.6
- **数据库**：H2（dev） / PostgreSQL 15（prod）
- **迁移工具**：Flyway

## 开发命令

```bash
# 编译
mvn clean compile

# 运行测试
mvn test

# 启动开发服务器（H2 内存库，自动加载种子数据）
mvn spring-boot:run

# 打包
mvn clean package

# 生产环境启动（需注入 DB_URL / DB_USERNAME / DB_PASSWORD / JWT_SECRET / SIGNATURE_AES_KEY 环境变量）
mvn spring-boot:run -Dspring.profiles.active=prod
```

## API 规范

- 基础路径：`/api`
- 认证方式：JWT Bearer Token，Header `Authorization: Bearer <token>`
- 统一响应格式：`{ "code": <int>, "message": "...", "data": ... }`（异常响应由 `GlobalExceptionHandler` 统一生成）

## 更多文档

- [后端实现细节（包结构 / 安全机制 / 数据库迁移 / API 约定）](./BACKEND_IMPL.md)
- [测试策略](../test/TEST_DESIGN.md)
- [项目整体架构](../ARCHITECTURE.md)
