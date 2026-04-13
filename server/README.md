# 博渊 OA 后端

Spring Boot REST API 服务。

## 技术栈

| 技术 | 版本 |
|------|------|
| Java | 17 |
| Spring Boot | 3.2.4 |
| MyBatis-Plus | 3.5.6 |
| PostgreSQL | 15 |

## 开发命令

```bash
# 编译
mvn clean compile

# 运行测试
mvn test

# 启动开发服务器
mvn spring-boot:run

# 打包
mvn clean package

# 生产环境运行
mvn spring-boot:run -Dspring.profiles.active=prod
```

## 数据库初始化

```bash
psql -U postgres -f src/main/resources/db/schema.sql
```

## API 规范

- 基础路径：`/api`
- 认证方式：JWT Bearer Token

## 依赖文档

- [后端实现细节](../docs/BACKEND_IMPL.md)
