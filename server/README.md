# 后端工程

当前后端用于支撑 OA MVP 联调和集成测试。

## 技术栈

- Java 17
- Spring Boot 3.2.4
- Spring Security + JWT
- JUnit 5 + MockMvc

## 运行命令

```bash
cd app/backend
mvn test
mvn spring-boot:run
```

## 当前说明

- 当前默认以 `OaDataService` 作为内存数据服务。
- API 验证脚本位于 `../../tools/scripts/test-api.ps1`。
