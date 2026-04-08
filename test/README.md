# 博渊 OA 测试套件

项目的测试代码和测试工具集合。

## 目录结构

```
test/
├── frontend/                    # 前端单元测试
│   ├── access.test.ts           # 权限相关测试
│   ├── forms.test.ts            # 表单相关测试
│   ├── org.test.ts              # 组织架构测试
│   ├── stores.user.test.ts      # Pinia store 测试
│   ├── setup.ts                 # 测试配置
│   └── vitest.config.ts         # Vitest 配置（说明文件）
│
├── integration/                 # 前后端集成测试
│   ├── api.test.ts              # API 集成测试
│   └── vitest.config.ts         # 集成测试配置
│
├── backend/                     # 后端测试说明
│   └── README.md                # 后端测试指引
│
├── run-all.bat                  # Windows 一键测试脚本
├── run-all.sh                   # Unix 一键测试脚本
└── TEST_DESIGN.md               # 测试策略设计文档
```

## 测试类型

### 1. 前端单元测试

**位置**：`frontend/`
**运行方式**：在 `app/` 目录下执行

```bash
cd ../app
../node_modules/.bin/vitest run
```

**覆盖范围**：
- 组件渲染测试
- Store 状态管理测试
- 工具函数测试
- 权限逻辑测试

### 2. 后端单元测试

**位置**：`server/src/test/`
**运行方式**：在 `server/` 目录下执行

```bash
cd ../server
mvn test
```

**覆盖范围**：
- Controller 层测试（MockMvc）
- Service 层测试
- 安全相关测试（JWT、权限）

### 3. 集成测试

**位置**：`integration/`
**运行方式**：在 `app/` 目录下执行

```bash
cd ../app
../node_modules/.bin/vitest run --config vitest.integration.config.ts
```

**前置条件**：后端服务需在 `localhost:8080` 运行
**覆盖范围**：前后端 API 联调测试

## 一键运行所有测试

### Windows

```bash
cd test
run-all.bat
```

### Unix/macOS

```bash
bash test/run-all.sh
```

## 测试报告位置

| 测试类型 | 报告位置 |
|---------|---------|
| 后端单元测试 | `server/target/surefire-reports/` |
| 后端覆盖率 | `server/target/site/jacoco/index.html` |
| 前端测试 | 控制台输出 |

## 测试策略

详见 [TEST_DESIGN.md](./TEST_DESIGN.md)

## 编写新测试

### 前端测试示例

```typescript
// frontend/my-feature.test.ts
import { describe, it, expect } from 'vitest'

describe('MyFeature', () => {
  it('should work correctly', () => {
    expect(true).toBe(true)
  })
})
```

### 后端测试示例

```java
// server/src/test/java/.../MyControllerTest.java
@SpringBootTest
@AutoConfigureMockMvc
public class MyControllerTest {
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    public void testEndpoint() throws Exception {
        mockMvc.perform(get("/api/test"))
               .andExpect(status().isOk());
    }
}
```

## 更多文档

- [测试策略设计](./TEST_DESIGN.md)
- [前端实现](../docs/FRONTEND_IMPL.md)
- [后端实现](../docs/BACKEND_IMPL.md)
