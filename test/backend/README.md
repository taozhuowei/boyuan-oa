# 后端测试指引

> **注意**：后端单元测试代码不在这个目录，而是遵循 Maven 标准结构存放在 `server/src/test/`。

## 测试代码位置

```
server/src/test/java/com/oa/backend/
├── controller/
├── service/
└── security/
```

## 运行测试

```bash
cd ../server && mvn test
```

## 测试报告

- 单元测试：`server/target/surefire-reports/`
- 覆盖率：`server/target/site/jacoco/index.html`（需先运行 `mvn verify`）
