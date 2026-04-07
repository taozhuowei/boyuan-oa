# 后端单元测试

后端单元测试由 Maven + JUnit 5 管理，遵循 Maven 标准目录约定，测试文件位于：

```
server/src/test/java/com/oa/backend/
├── controller/
│   ├── AuthControllerTest.java          (4 cases)  — 登录/重置码
│   └── OaApiIntegrationTest.java        (27 cases) — Controller 层集成
├── security/
│   ├── JwtTokenServiceTest.java         (8 cases)  — JWT 生成/校验
│   └── ResetCodeStoreTest.java          (11 cases) — 验证码存储
└── service/
    ├── EmployeeServiceImplTest.java      (5 cases)  — 员工创建/编码
    ├── PositionServiceImplTest.java      (7 cases)  — 岗位 CRUD
    └── ProjectServiceImplTest.java       (11 cases) — 项目/成员管理
```

**运行**：

```bash
cd server && mvn test
```

**报告**：`server/target/surefire-reports/`  
**覆盖率**：`server/target/site/jacoco/index.html`（需先运行 `mvn verify`）
