# 博渊 OA 基座重构

refactor 分支基座重构进行中：清空业务代码、补齐基座规范、按 platform/<module>/ 与 modules/<biz>/ 重组目录、为业务模块后续逐个回填准备骨架。

---

# Phase 0：紧急安全漏洞前置修复

## P0-T01a：后端 dev_tools 模块 + DevAuthController

`[ ]` 待开始

依据：当前 AuthController.java:260 的 `/dev-login` 端点是无认证、无 profile 限定的"开发后门"——原样部署到 prod 构成全系统沦陷漏洞。本子任务负责把端点抽离到独立的后端 dev_tools 模块，类级 @Profile("dev") 限定，prod profile 不实例化。

实现 agent：Backend Engineer。审计 agent：QA Engineer + Reality Checker。

改动范围：
- 新建顶层包 server/src/main/java/com/oa/dev_tools/（与 com.oa.platform、com.oa.modules 平级）
- 新建 com/oa/dev_tools/auth/DevAuthController.java
- 改写 server/src/main/java/com/oa/backend/controller/AuthController.java（删除 devLogin 方法约第 256-288 行）
- 检查并放行 server/src/main/java/com/oa/backend/security/SecurityConfig.java 中 /api/auth/dev-login 路径

动作步骤：

第一步，建后端 dev_tools 顶层包。新建 com/oa/dev_tools/auth/DevAuthController.java：

```java
package com.oa.dev_tools.auth;

import com.oa.backend.dto.AuthLoginRequest;
import com.oa.backend.dto.AuthLoginResponse;
import com.oa.backend.service.AccessManagementService;
import com.oa.backend.security.JwtTokenService;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Collections;

@Profile("dev")
@RestController
@RequestMapping("/api/auth")
public class DevAuthController {
  private final AccessManagementService accessManagementService;
  private final JwtTokenService jwtTokenService;

  public DevAuthController(AccessManagementService a, JwtTokenService j) {
    this.accessManagementService = a;
    this.jwtTokenService = j;
  }

  /**
   * 开发环境快速登录端点。仅在 dev profile 下注册，prod 与 test profile 完全不存在此路由。
   * 接受 username + role + displayName 三字段，无需密码验证，签发 JWT token。
   * 严禁以任何方式让此端点出现在生产环境。
   */
  @PostMapping("/dev-login")
  public ResponseEntity<AuthLoginResponse> devLogin(@Valid @RequestBody AuthLoginRequest request) {
    // 把原 AuthController.devLogin 方法体完整搬过来（业务逻辑不变）
  }
}
```

第二步，从 AuthController.java 删除 devLogin 方法（第 256-288 行，含 javadoc 与 @PostMapping）。

第三步，SecurityConfig 中确认 `/api/auth/dev-login` 路径放行；如未来引入 prod 独立 SecurityConfig，确保其中不放行此路径作为防御纵深。

第四步，dev profile 启动后端验证：

```
cd server && mvn spring-boot:run &
curl -X POST http://localhost:8080/api/auth/dev-login \
     -H "Content-Type: application/json" \
     -d '{"username":"ceo.demo","role":"ceo"}'
# 预期返回 200 + JWT token
```

第五步，prod profile（mock 配置）验证：

```
cd server && SPRING_PROFILES_ACTIVE=prod mvn spring-boot:run &
curl -X POST http://localhost:8080/api/auth/dev-login \
     -d '{"username":"admin","role":"ceo"}'
# 预期返回 404（端点完全不存在）
```

第六步，mvn test 全绿。

完成阈值：
- com/oa/dev_tools/auth/DevAuthController.java 就位、@Profile("dev") 类级注解
- AuthController.devLogin 方法已删除（`grep "devLogin" server/src/main/java/com/oa/backend/controller/AuthController.java` 输出为空）
- dev profile 下后端 dev-login 端点 200、prod profile 下端点 404
- mvn test 全绿

验收方式：Backend Engineer 自跑命令 + QA Engineer 复跑双 profile + curl 验证。Reality Checker 终审确认 prod 部署模型下后端端点不可达。

---

## P0-T01b：ArchUnit dev_tools 隔离规则

`[ ]` 待开始

依据：P0-T01a 完成时 dev_tools 模块已存在，但平台与业务模块依赖 dev_tools 的限制要等 P3-T05 才加。中间几十个任务的窗口期没有约束防止 platform 代码不小心 import dev_tools。本子任务在 P0-T01a 完成后立即添加 ArchUnit 规则，提前到 Phase 0 而非 Phase 3。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- 改写 server/src/test/java/com/oa/backend/architecture/ArchitectureTest.java（在 P3-T01 重组后路径变为 com/oa/platform/shared/architecture/ArchitectureTest.java，本任务以当前路径为准）

动作步骤：

第一步，在 ArchitectureTest 类里追加两条规则：

```java
@ArchTest
static final ArchRule platform_should_not_depend_on_dev_tools =
  noClasses().that().resideInAPackage("com.oa.platform..")
    .should().dependOnClassesThat().resideInAPackage("com.oa.dev_tools..")
    .as("platform 模块不允许依赖 dev_tools（单向依赖：dev_tools 可以引用 platform）");

@ArchTest
static final ArchRule modules_should_not_depend_on_dev_tools =
  noClasses().that().resideInAPackage("com.oa.modules..")
    .should().dependOnClassesThat().resideInAPackage("com.oa.dev_tools..")
    .as("业务模块不允许依赖 dev_tools");
```

如 P0-T01a 完成时尚未做 P3-T01 重组、AuthController 仍在 com.oa.backend，则规则改为兼容当前两层包：`noClasses().that().resideInAnyPackage("com.oa.backend..","com.oa.platform..","com.oa.modules..")`。P3-T05 重写 ArchUnit 规则集时再统一为最终态。

第二步，故意建临时违规样例（如 com/oa/backend/__archtest_evil/Bad.java 在 platform 包下 import com.oa.dev_tools.auth.DevAuthController）跑 mvn test 验证规则能检出，验证后删除样例。

第三步，mvn test 全绿。

完成阈值：
- ArchUnit 规则就位、含两条 dev_tools 单向依赖约束；
- 故意违规验证检出；
- 临时样例已清理；
- mvn test 全绿。

验收方式：QA Engineer 跑 mvn test + 故意违规验证。

---

## P0-T01c：前端 h5 dev_tools 改造

`[ ]` 待开始

依据：原 app/h5/dev/ 目录下 DevToolbar.vue 含弱密码字面量与 dev 工具入口；按 dev_tools 独立模块原则需要把整个 dev 工具集挪到顶层 dev_tools/ 目录、prod build 完全 tree-shake 排除。

实现 agent：Frontend Engineer。审计 agent：QA Engineer。

改动范围：
- 新建顶层目录 app/h5/dev_tools/（与 app/h5/modules/ 平级）
- 迁移 app/h5/dev/DevToolbar.vue → app/h5/dev_tools/DevToolbar.vue
- 删除原 app/h5/dev/ 目录
- 改写 app/h5/layouts/default.vue 对 DevToolbar 的导入语句
- 配置 app/h5/nuxt.config.ts 确保 prod build 时 dev_tools/ 被排除

动作步骤：

第一步，迁移 DevToolbar：

```
mkdir -p app/h5/dev_tools
git mv app/h5/dev/DevToolbar.vue app/h5/dev_tools/DevToolbar.vue
rmdir app/h5/dev
```

第二步，改 layouts/default.vue 的 DevToolbar 导入为基于 import.meta.env.DEV 的条件动态 import：

```typescript
import { defineAsyncComponent } from 'vue'
const DevToolbar = import.meta.env.DEV
  ? defineAsyncComponent(() => import('~/dev_tools/DevToolbar.vue'))
  : null
// 模板中：<DevToolbar v-if="DevToolbar" />
```

第三步，nuxt.config.ts 加配置确保 prod build 不含 dev_tools。可用 vite.build.rollupOptions.external 或 nuxt 的 hooks 在 NODE_ENV=production 时跳过 dev_tools 目录扫描，参考实现：

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    build: {
      rollupOptions: {
        external: process.env.NODE_ENV === 'production'
          ? [/\/dev_tools\//]
          : []
      }
    }
  }
})
```

第四步，dev 启动 `yarn dev` 浏览器看到 DevToolbar 一键登录正常。

第五步，prod build 验证 tree-shake：

```
yarn workspace oa-h5 build
grep -rE "DevToolbar|dev_tools" app/h5/.output/ 2>/dev/null | wc -l
# 预期输出 0
```

第六步，yarn test 与 yarn build 全绿。

完成阈值：
- app/h5/dev_tools/DevToolbar.vue 就位、原 app/h5/dev/ 目录清理
- dev 浏览器 DevToolbar 显示并工作
- prod build 中 grep DevToolbar 输出 0
- yarn test 与 yarn build 全绿

验收方式：Frontend Engineer 自跑 build + grep + 浏览器走查。QA Engineer 复跑确认。

---

## P0-T01d：前端 mp dev_tools 骨架

`[ ]` 待开始

依据：用户指示 mp 端也建 dev_tools 顶层目录骨架，功能暂不实现但目录与 README 占位先就位，为未来对称演进留位置（决策来源：mp 与 h5 同步演进 + 用户 2026-05-06 指示）。

实现 agent：Frontend Engineer。审计 agent：QA Engineer。

改动范围：
- 新建顶层目录 app/mp/src/dev_tools/（与 app/mp/src/modules/ 平级）
- 新建 app/mp/src/dev_tools/.gitkeep
- 新建 app/mp/src/dev_tools/README.md
- 配置 app/mp/vite.config.ts 在 prod 构建模式排除 dev_tools

动作步骤：

第一步，建目录与占位：

```
mkdir -p app/mp/src/dev_tools
touch app/mp/src/dev_tools/.gitkeep
```

第二步，写 app/mp/src/dev_tools/README.md：

```markdown
# mp dev_tools

mp 端开发工具目录骨架，与 h5 端 app/h5/dev_tools/ 对称。

## 当前状态

仅目录骨架，未实现具体 dev 工具组件。

## 未来扩展

按 h5 端 DevToolbar 同等模式实现 mp 端开发辅助工具，例如：
- 一键切换 demo 角色（不必输用户名密码登录）
- 重置 mock 数据
- 切换网络环境（mock 后端 vs 真实后端）

## 实现要求

- 所有组件通过 vite 构建配置在 prod build 时 tree-shake 排除
- 运行时通过 import.meta.env.DEV 条件加载
- 与 h5 端 DevToolbar 保持 UI 与交互一致

## 与 prod 部署的隔离

prod 构建时本目录整体被排除，prod 构建产物 grep "dev_tools" 应输出 0。
```

第三步，配置 app/mp/vite.config.ts 在 prod 构建模式排除 dev_tools，参考实现：

```typescript
import { defineConfig } from 'vite'
export default defineConfig(({ mode }) => ({
  build: {
    rollupOptions: {
      external: mode === 'production' ? [/\/dev_tools\//] : []
    }
  }
}))
```

第四步，mp prod 构建验证：

```
yarn workspace oa-mp build:mp-weixin --mode production
grep -rE "dev_tools" app/mp/dist/ 2>/dev/null | wc -l
# 预期输出 0
```

第五步，yarn test 与 yarn build 全绿。

完成阈值：
- app/mp/src/dev_tools/ 目录、.gitkeep、README.md 就位
- vite.config.ts 配置 prod 排除 dev_tools
- mp prod build 中 grep dev_tools 输出 0

验收方式：Frontend Engineer 自跑 build + grep。QA Engineer 复跑确认。

---

## P0-T02：dev_tools 模块原则文档化

`[ ]` 待开始

依据：dev_tools 独立模块原则需要在 ARCHITECTURE.md 留下明文条款，避免未来开发者不理解这个约束在 platform 下加代码。本任务在 P5-T02 重写 ARCHITECTURE.md 的"dev_tools 独立模块原则"章节之前先建临时占位说明，确保 P0-P4 阶段如有相关讨论有文档可查。

实现 agent：Technical Architect。审计 agent：QA Engineer。

改动范围：
- 新建临时文档 docs/architecture/dev_tools_isolation.md（P5-T02 时该内容会被合并入 ARCHITECTURE.md，届时本临时文档删除）

动作步骤：

第一步，新建 docs/architecture/dev_tools_isolation.md，内容含：
- dev_tools 独立模块的位置（后端 com.oa.dev_tools 顶层包、前端 h5 app/h5/dev_tools 顶层目录、前端 mp app/mp/src/dev_tools 顶层目录）
- 完全 dev profile/mode 限定（@Profile("dev") + Vite tree-shake）
- 单向依赖约束（dev_tools 可以引用 platform/modules，反向不允许，由 ArchUnit 强约束）
- 当前实现状态（后端 DevAuthController、h5 DevToolbar、mp 仅骨架未实现）
- 与 OWASP A05 Security Misconfiguration 的差异说明

第二步，README.md 加超链接指向此文档。

完成阈值：
- docs/architecture/dev_tools_isolation.md 就位、内容齐全；
- README.md 含指向此文档的链接。

验收方式：QA Engineer 通读 + 抽查链接。

---

## P0-T03：升级后端依赖修复 29 个高危/严重 CVE

`[ ]` 待开始

依据：Snyk 扫描发现后端依赖中 5 个 Critical + 24 个 High 级别 CVE，含 Spring Boot Actuator Authentication Bypass、Spring Security Web Use of Cache Containing Sensitive Information、Tomcat Improper Authentication、PostgreSQL Resource Exhaustion 等真实攻击面漏洞。这些漏洞影响 prod 部署的安全性，必须升级依赖修复。本任务在 Phase 0 紧急安全前置阶段执行，与 P0-T01 dev-login 后门修复同等优先级。

实现 agent：Backend Engineer。审计 agent：QA Engineer + Reality Checker。

改动范围：
- server/pom.xml 中以下依赖升级：
  - org.springframework.boot 父 pom 从 3.2.11 升到 3.5.x（最新稳定，目标 3.5.12）
  - org.flywaydb:flyway-core 从 9.22.3 升到 11.8.x
  - org.postgresql:postgresql 从 42.6.2 升到 42.7.11
  - org.springdoc:springdoc-openapi-starter-webmvc-ui 从 2.5.0 升到 2.8.x
  - 其他 transitive 依赖随主依赖联动升级
- 升级后可能需要适配的代码（Spring Boot 3.2 到 3.5 的兼容性变更需逐一对照官方迁移指南）

动作步骤：

第一步，升级前基线快照——`cd server && mvn dependency:tree > /tmp/deps-before.txt`，记录升级前完整依赖树供回滚比对。

第二步，更新 pom.xml 中的版本声明：
- `<spring.boot.version>3.2.11</spring.boot.version>` → `<spring.boot.version>3.5.12</spring.boot.version>`（如有 properties 节）
- 父 pom `<parent>` 中 spring-boot-starter-parent 版本同步升
- `<flyway.version>` 或直接版本号升到 11.8.x
- `postgresql.version` 升到 42.7.11
- `springdoc.version` 升到 2.8.x

第三步，`cd server && mvn clean compile`——确认升级后能编译通过。如有 deprecation/removal 编译错误（Spring Boot 3.2 → 3.5 间删除的 API），按官方迁移指南（https://github.com/spring-projects/spring-boot/wiki）逐个修复。常见破坏性变更：
- spring-boot-starter-validation 从 starter 拆出（如已显式引入则无影响）
- 部分 Actuator 端点路径或属性名变化
- @ConfigurationProperties 严格化（缺 setter 字段会失败）

第四步，`cd server && mvn test`——确认升级后测试不退化（注：本任务执行前 Backend Tests 已通过 P1-T01/T03/T04/P6-T02 删除大量不适配测试，剩余测试应该绿）。如有失败，按错误类型修：
- ContextLoader 失败：检查 application.yml 配置是否被废弃属性
- @MockBean 警告：Spring Boot 3.4 起 @MockBean 已废弃，改 @MockitoBean
- 其他：按错误信息查 Spring Boot 升级文档

第五步，`yarn install --frozen-lockfile`——升级 Spring Boot 不影响前端，但跑一遍确认无连锁影响。

第六步，验证 Snyk 通过——本地有 Snyk CLI 时跑 `snyk test --file=server/pom.xml --severity-threshold=high`，预期报"no issues found"或仅剩 1-2 个 Snyk DB 滞后未收录的低危漏洞。

第七步，启动后端验证启动正常：`cd server && mvn spring-boot:run`，curl /api/health 200。

第八步，对比依赖树验证升级生效：`cd server && mvn dependency:tree > /tmp/deps-after.txt && diff /tmp/deps-before.txt /tmp/deps-after.txt | head -30` 看到升级后版本号变化。

完成阈值：
- pom.xml 中 spring-boot 主版本为 3.5.x、postgresql 为 42.7.11、flyway 为 11.x、springdoc 为 2.8.x
- mvn clean compile 通过
- mvn test 全绿（不引入新失败）
- Snyk 扫描结果"No issues found at high or critical severity"或仅剩极少数 (≤2) 数据库滞后项
- spring boot 启动 + curl /api/health 200

验收方式：QA Engineer 跑全部命令 + 对比 Snyk 扫描前后报告 + Reality Checker 终审。如升级中遇 Spring Boot 破坏性变更需要重大代码改动（如 Actuator 配置改写、Spring Security 过滤器链 API 变化），暂停并向用户确认。

---

## P0-T04：SonarCloud sonar.organization 配置

`[ ]` 待开始

依据：Full Test workflow 中 SonarCloud Analysis job 因 `sonar-project.properties` 缺 `sonar.organization` 报 "You must define the following mandatory properties for 'com.oa:oa-backend': sonar.organization" 失败。job 配 continue-on-error 不阻塞 workflow 整体绿灯，但 UI 上显示 X 误导观感且失去 SonarCloud 真实分析价值。

实现 agent：DevOps Engineer。审计 agent：QA Engineer。

改动范围：sonar-project.properties。

动作步骤：
1. 在 SonarCloud（https://sonarcloud.io）确认或创建 organization（一般是 GitHub username/org，如 `taozhuowei`）；
2. 在 sonar-project.properties 加一行 `sonar.organization=<your-organization>`；
3. 推一个测试 commit 让 Full Test workflow 跑一次；
4. SonarCloud Analysis job 应变绿、SonarCloud dashboard 应能看到 oa-backend 项目报告。

完成阈值：
- sonar-project.properties 含 `sonar.organization` 一行；
- SonarCloud Analysis job 在最近 push 中 ✓；
- SonarCloud web dashboard 含本项目最新分析报告。

验收方式：QA Engineer 推 dummy commit 看 CI 状态 + 浏览 SonarCloud 看 dashboard。

---

## P0-T05：pre-push hook 加 SNYK_TOKEN 存在守卫

`[ ]` 待开始

依据：本机 pre-push 跑 `snyk test` 时无 SNYK_TOKEN 环境变量（CLI 用 GitHub Secret 只在 CI 注入），每次 push 输出两段 401 错误噪音。`|| true` 兜底不阻塞但显眼。

实现 agent：DevOps Engineer。审计 agent：QA Engineer。

改动范围：.husky/pre-push。

动作步骤：
1. 修改 .husky/pre-push，给 snyk 步骤加 token 存在守卫：

```bash
# Snyk dependency audit (conditional: installed in C+-D-06)
if [ -n "$SNYK_TOKEN" ] && command -v snyk > /dev/null 2>&1; then
  snyk test --file=app/h5/package.json --severity-threshold=high || true
  snyk test --file=server/pom.xml --severity-threshold=high || true
fi
```

2. 本地 push 验证 hook 输出无 401 噪音；
3. CI（有 SNYK_TOKEN secret）仍能跑 Snyk（CI 用 fast-check.yml 不依赖此 hook）。

完成阈值：
- .husky/pre-push 含 token 守卫；
- 本机 push 无 401 噪音输出。

验收方式：本地 git push 看 hook 输出。

---

## P0-T06：Semgrep 无效 config 修复

`[ ]` 待开始

依据：CI Fast Check 日志含 "invalid configuration file found (1 configs were invalid)" 警告。`|| true` 兜底不阻塞但是真实质量信号被掩盖。

实现 agent：DevOps Engineer。审计 agent：QA Engineer。

改动范围：.github/workflows/fast-check.yml 中 Semgrep 步骤的 `--config` 参数。

动作步骤：
1. 本地跑 `semgrep --config p/spring-boot --config p/owasp-top-ten server/src --error` 看哪个 config 报无效；
2. 用 `--no-rewrite-rule-ids --validate` 单独验证每个 config 文件；
3. 移除或更新无效的 config（可能是 semgrep registry 中老 ruleset 已删除）；
4. 重跑 CI 看 invalid config 警告是否消失。

完成阈值：
- CI Semgrep 步骤无 "invalid configuration file" 警告；
- 报告内容仅含真实代码扫描结果。

验收方式：QA Engineer 跑 semgrep 本地验证 + 推 commit 看 CI 输出。

---

## P0-T07：Maven Central 优先级显式声明

`[ ]` 待开始

依据：本地 mvn 操作时 flyway-parent pom 注册的 GitHub Packages 私有 repo `flyway-community-db-support` 401 阻塞 Maven 从 Central 拉取新版本依赖（如 jackson 升级 override）。CI 环境是否同样问题待验证。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：server/pom.xml（添加 `<repositories>` 块）或仓库根的 .mvn/settings.xml。

动作步骤：
1. 在 server/pom.xml 顶层添加 `<repositories>` 块显式声明 Maven Central 与必需的 flyway 仓库，控制顺序优先级：

```xml
<repositories>
    <repository>
        <id>maven-central</id>
        <url>https://repo.maven.apache.org/maven2</url>
        <releases><enabled>true</enabled></releases>
        <snapshots><enabled>false</enabled></snapshots>
    </repository>
    <!-- flyway-community-db-support 不需要拉 jackson 等通用依赖，仅用于 flyway 自身组件 -->
    <!-- 通过 <repository><id>...</id> 限定优先级 -->
</repositories>
```

2. 本地验证 `mvn -U dependency:get -Dartifact=com.fasterxml.jackson.core:jackson-core:2.21.3` 能成功（之前 401 失败）；
3. 测试 jackson override 能正常下载与解析；
4. mvn test 通过，无回归。

完成阈值：
- pom.xml 含明确 `<repositories>` 块；
- jackson 2.21.3 可从 Maven Central 下载；
- mvn test 全绿。

验收方式：QA Engineer 跑本地 dependency:get 验证 + mvn test。

---

## P0-T08：GitHub Actions 升级到支持 Node 24 的版本

`[ ]` 待开始

依据：CI annotation 持续警告 `actions/checkout@v4`、`actions/setup-node@v4`、`actions/setup-java@v4`、`actions/cache@v4`、`actions/upload-artifact@v4` 等都是 Node 20 版本，GitHub 公告 2026-06-02 默认切 Node 24、2026-09-16 删除 Node 20 runner。当前距硬截止 4 个月，不修复会在 9 月 16 日后突然全部红灯。

实现 agent：DevOps Engineer。审计 agent：QA Engineer。

改动范围：所有 .github/workflows/*.yml（ci.yml、fast-check.yml、full-test.yml、nightly.yml、release.yml）。

动作步骤：
1. 调研每个 action 的 Node 24 兼容版本：
   - `actions/checkout@v5`（最新版支持 Node 24）
   - `actions/setup-node@v5`
   - `actions/setup-java@v5`
   - `actions/cache@v5`
   - `actions/upload-artifact@v5`
   - `actions/setup-python@v6`（如使用）
2. 每份 yml 中所有 `@v4` 升到对应 `@v5+`；
3. 推 PR 到 GitHub 验证 CI 全绿、annotations 无 Node 20 deprecation；
4. 如某 action 升级有破坏性变更（如 cache key 格式改变），按官方迁移文档调整。

完成阈值：
- 所有 workflows 中无 `@v4`（特定不支持 v5 的 action 可保留并在注释说明）；
- CI annotations 无 Node 20 deprecation 警告；
- 所有 workflow 跑通。

验收方式：QA Engineer 推 dummy commit 看 CI annotations 与状态。

---

## P0-T09：启用 GitHub Dependabot 自动依赖升级

`[ ]` 待开始

依据：业内做法（Snyk 官方博客）推荐"Snyk 扫描漏洞 + Dependabot 自动 PR 升级"配套使用。当前 Dependabot 未启用，依赖更新全靠手工。Dependabot 免费、GitHub 原生支持、对 npm + Maven + GitHub Actions 三个生态都能自动开升级 PR。

实现 agent：DevOps Engineer。审计 agent：QA Engineer。

改动范围：新建 .github/dependabot.yml。

动作步骤：
1. 新建 .github/dependabot.yml 配置三个生态：

```yaml
version: 2
updates:
  - package-ecosystem: "maven"
    directory: "/server"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    labels: ["dependencies", "backend"]

  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    labels: ["dependencies", "frontend"]

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels: ["dependencies", "ci"]
```

2. commit + push 让 GitHub 识别配置；
3. 几小时内观察 GitHub PR 列表是否出现 Dependabot 自动开的升级 PR。

完成阈值：
- .github/dependabot.yml 就位；
- GitHub 仓库 Insights → Dependency graph → Dependabot 显示已激活；
- 观察一周内有 Dependabot PR 出现（可能为 0 if 当前所有依赖已最新）。

验收方式：QA Engineer 检查 GitHub 仓库 Settings → Code security and analysis 确认 Dependabot alerts 与 security updates 启用。

---

## P0-T10：清理仓库根 sonar-scanner.zip 工作区残留

`[ ]` 待开始

依据：仓库根存在 sonar-scanner.zip（57MB）。已在 .gitignore 中（git ls-files 不追踪），但占用本地与新 clone 后的磁盘空间，且对开发体验无价值。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：物理删除 sonar-scanner.zip 与 sonar-scanner*/ 目录（如有）。

动作步骤：
1. `rm -f sonar-scanner.zip && rm -rf sonar-scanner*`；
2. 验证 sonar-project.properties 与 CI workflow 不依赖本地 sonar-scanner.zip（CI 使用 mvn sonar:sonar 不依赖）。

完成阈值：
- sonar-scanner.zip 不存在；
- CI 不受影响（推 commit 看 SonarCloud Analysis 仍能跑）。

验收方式：QA Engineer ls + 推 commit 验证 CI。

---

## P0-T11：Snyk 扫描阈值降到 medium 处理中低危漏洞

`[ ]` 待开始

依据：当前 Snyk 用 `--severity-threshold=high` 仅扫高危/严重，medium 与 low 级别依赖漏洞被默默忽略。完整安全姿态要求至少把 medium 也纳入持续监控；low 可暂不阻塞但需周期回顾。

实现 agent：Backend Engineer + DevOps Engineer。审计 agent：QA Engineer。

改动范围：
- .github/workflows/fast-check.yml 中 Snyk 步骤参数
- .snyk 文件可能新增 medium 级别 ignore 条目

动作步骤：
1. 把 fast-check.yml 中两条 snyk test 命令的 `--severity-threshold=high` 改为 `--severity-threshold=medium`；
2. 推 commit 触发 CI，看 Snyk 报告 medium 级新增条目数量；
3. 评估 medium 条目逐个：能修复升级则升级（参考 P0-T03 + P2-T15/T16 经验）、不能修则评估 reachability 写 .snyk ignore 含 reason+expires；
4. CI 通过后保持 medium 阈值作为新基线。

完成阈值：
- 阈值降到 medium；
- CI Snyk 步骤通过（无未处理 medium）；
- 新增的 .snyk ignore 条目均含完整 reason 与 expires。

验收方式：QA Engineer 跑 CI + 通读 .snyk 新增条目。

---

## P0-T12：清理 husky hook 中过时项目编号注释

`[ ]` 待开始

依据：.husky/pre-commit 与 pre-push 含旧 9 阶段路线的任务编号注释（如 "C+-D-09/13/14"、"C+-D-06"），原 TODO.md 早已重写，这些引用是已废弃的过时信息会误导读者。

实现 agent：DevOps Engineer。审计 agent：QA Engineer。

改动范围：
- .husky/pre-commit
- .husky/commit-msg
- .husky/pre-push

动作步骤：
1. 通读三个 hook 文件，把含 "C+-D-XX" 与"in C+-D-XX phase"等过时引用的注释删除或改写成与新 TODO.md 任务编号对齐的引用（或干脆改为不引用具体任务编号，只描述 hook 的当前职责）；
2. 重新跑一次本地 git commit + push 确认 hook 行为不变。

完成阈值：
- grep -E "C\+-D-[0-9]+" .husky/ 输出为空；
- hook 行为正常。

验收方式：QA Engineer grep + 本机 push 验证。

---

## P0-T13：正式配置 lint-staged + ESLint + Prettier + Spotless

`[ ]` 待开始

依据：当前 package.json 的 `lint-staged` 字段为 `{ "*.{ts,vue,js,json}": [], "*.java": [] }`——空数组等于不做任何 lint。pre-commit hook 跑 lint-staged 也实际不执行任何检查，等同摆设。lint-staged + ESLint + Prettier + Spotless 是业内标准的"提交前格式与 lint 守门"组合，必须正式配置。

实现 agent：DevOps Engineer + Frontend Engineer + Backend Engineer。审计 agent：QA Engineer。

改动范围：
- package.json 的 lint-staged 字段
- app/h5/eslint.config.mjs（已存在，需确认正常工作）
- 仓库根新建 .prettierrc.json（如不存在）
- server/pom.xml 中 spotless-maven-plugin 配置（已配在 pre-commit 中调用，需确认 pom 中 plugin 已声明）

动作步骤：
1. 确认 ESLint 与 Prettier 各自独立可用：`yarn workspace oa-h5 lint`、`yarn format:check`；
2. 配置 lint-staged：

```json
"lint-staged": {
  "*.{ts,vue,js}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"],
  "server/**/*.java": ["bash -c 'cd server && mvn spotless:apply -DspotlessFiles=$0'"]
}
```

3. 修改 .husky/pre-commit 让 lint-staged 真正运行（删除原 `|| true` 兜底，让 lint 失败实际阻塞 commit）；
4. 测试场景：
   - 故意改一个 .ts 文件含格式问题 → git add → git commit 应自动 fix 后通过；
   - 故意改一个 .ts 含 ESLint 错误 → git commit 应被阻塞；
   - 故意改一个 .java 文件含格式问题 → git commit 应自动 spotless apply 后通过；
5. CI 端 Backend Checks 与 Frontend Checks 已含 spotless:check + eslint，与 hook 形成"本地 + CI 双保险"。

完成阈值：
- lint-staged 配置非空；
- 4 种测试场景行为正确；
- CI 跑通。

验收方式：QA Engineer 跑 4 种测试场景。

---

## P0-T14：knip 配置加 mp workspace

`[ ]` 待开始

依据：knip.json 当前只配 `.` 与 `app/h5` workspace，没有 `app/mp`。mp 端死代码检测不工作，可能积累未使用 export。P1-T08 后 mp 端保留平台壳并准备未来业务回填，期间 knip 应该工作。

实现 agent：Frontend Engineer。审计 agent：QA Engineer。

改动范围：knip.json。

动作步骤：
1. 在 knip.json 的 workspaces 字段加 `app/mp`：

```json
"app/mp": {
  "entry": [
    "src/main.ts",
    "src/App.vue",
    "src/pages.json",
    "src/manifest.json",
    "vite.config.ts",
    "vitest.config.ts"
  ],
  "project": ["src/**/*.{ts,vue}"],
  "ignore": [
    "node_modules/**",
    "dist/**",
    ".vite/**"
  ]
}
```

2. 跑 `yarn knip` 验证 mp workspace 也被扫到；
3. 处理 knip 报告中的死代码（删除或加注释说明保留原因）。

完成阈值：
- knip.json 含 mp workspace 配置；
- yarn knip 输出含 mp 端结果；
- 死代码项已处理或写明保留原因。

验收方式：QA Engineer 跑 yarn knip。

---

## P0-T15：.env.example 字段完整性审计

`[ ]` 待开始

依据：.env.example 是新部署者的 ENV 配置模板。当前有 SERVER_PORT、JWT_SECRET、DB_URL、DB_USERNAME、DB_PASSWORD 五个字段。但 prod 部署可能还需要 SONAR_TOKEN、SNYK_TOKEN（本机开发不需要但 CI 需要在 GitHub Secrets 配置，README 应说明）、邮件配置（spring.mail.*）、企微集成 API 配置（未来 P0-T01 dev_tools clock 模块）等。如未来部署者按 .env.example 配置，可能漏配关键字段。

实现 agent：Backend Engineer + DevOps Engineer。审计 agent：QA Engineer。

改动范围：.env.example。

动作步骤：
1. 通读 application.yml、application-dev.yml、application-prod.yml、application-test.yml，列出所有 `${ENV_VAR}` 占位符；
2. 列出所有 GitHub Actions secrets 需配的字段（SONAR_TOKEN、SNYK_TOKEN 等）；
3. 把上述全部字段加入 .env.example，按用途分组（应用端口、认证密钥、数据库、邮件、SaaS 工具 token 等）；
4. 每个字段加占位值（`<your_xxx>` 风格）+ 简短注释说明用途与是否必需；
5. README.md 引用 .env.example 作为部署说明的起点（与 P5-T01 README 重写整合）。

完成阈值：
- .env.example 含所有 application*.yml 中引用的 ENV 变量；
- 所有 CI 需要的 secret 名也列出（注释说明是 GitHub Secret 不是本地 ENV）；
- 字段分组与注释清晰。

验收方式：QA Engineer 通读 .env.example + 跑 grep 确认没有遗漏 ENV 引用。

---

# Phase 1：业务代码删除（无架构改动，纯删除）

## P1-T01：删除 signature 模块全链路

`[ ]` 待开始

依据：用户已确认工资条不再走电子签名，改为"确认无误"按钮；signature 不通过"业务无关、换业务系统照样能用"判据，整体下放并删除。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- server/src/main/java/com/oa/backend/controller/SignatureController.java
- server/src/main/java/com/oa/backend/service/SignatureService.java
- server/src/main/java/com/oa/backend/entity/EmployeeSignature.java
- server/src/main/java/com/oa/backend/mapper/EmployeeSignatureMapper.java
- server/src/test/java/com/oa/backend/service/SignatureServiceTest.java

动作步骤：
1. 物理删除上述五个文件；
2. `grep -rn "Signature" server/src` 扫残留引用（候选位置：GlobalExceptionHandler、SetupFinalizeRequest、其他 service），逐一清掉；
3. `mvn compile` 确认编译通过；
4. `mvn test` 确认现有测试不退化。

完成阈值：
- `grep -rn "Signature" server/src/main/java/com/oa` 输出为空（不含 java.security.Signature 等 JDK 类引用）；
- `mvn compile` 与 `mvn test` 全绿；
- V1 schema 的 employee_signature 表本任务不动（留待 P2-T08 V1 重写时一并删除）；本任务做最后一步扫描确认 H2 启动后 employee_signature 表存在但无任何 Java 代码引用：`grep -rn "employee_signature" server/src/main/java` 输出仅在 V1 SQL 路径下（如有 Mapper xml 路径残留也归此扫描）。

验收方式：QA Engineer 在独立分支跑上述命令，输出 PASS 或 NEEDS WORK 报告。实现完推 `[>]`，QA PASS 推 `[?]`，Reality Checker 验收推 `[x]`。

---

## P1-T02：删除业务相关 Flyway 迁移

`[ ]` 待开始

依据：用户已确认业务相关 Flyway 迁移物理删除并重排剩余基座为连续 V1 起步；业务模块未来迁移走 db/migration/<module>/ 子目录；V4 归 DELETE-BUSINESS（用户已确认 2026-05-06）。本任务只删，重排在 P2-T08。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围（共 11 份 SQL，物理删除）：
- server/src/main/resources/db/migration/V3__expense_module.sql
- V4__fix_expense_flow.sql（修补 EXPENSE 审批流节点 + 补 OFFICE 报销类型）
- V5__payroll_composition.sql
- V6__payroll_correction.sql
- V7__second_role_aftersale_material_delegation_hr_fields.sql
- V8__revenue_insurance_cost.sql
- V9__construction_attendance_and_audit.sql
- V11__project_extra_fields.sql
- V12__leave_type_quota.sql
- V13__employee_extra_fields.sql
- V17__add_compensatory_leave_type.sql

动作步骤：
1. 物理删除上述 11 份 SQL；
2. 不修改剩余 V1/V2/V10/V14/V15/V16/V18/V19/V20/V21；
3. 本任务不重排版本号（在 P2-T08 集中重排）。

完成阈值：
- 上述 11 份文件不存在；
- 剩余 10 份基座迁移仍在原位、未改文件名；
- H2 dev 启动 + Flyway 仍能跑过现有迁移（因为业务表的依赖会在 P2-T08 才真正切换）。

验收方式：`ls server/src/main/resources/db/migration/V*.sql` 列表与预期一致；`mvn spring-boot:run`（dev profile）能起到 health check。

---

## P1-T03：删除业务覆盖度堆料测试

`[ ]` 待开始

依据：CoverageBoostTest 系列与 AccessControlTest、OaApiIntegrationTest 等业务驱动测试将随业务代码一起被删除；新基座测试在 Phase 5/6 按模块就近重写。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- server/src/test/java/com/oa/backend/controller/CoverageBoostTest{1..12,14..17}.java（编号 13 不存在，删除时跳过）
- server/src/test/java/com/oa/backend/controller/AccessControlTest.java
- server/src/test/java/com/oa/backend/controller/OaApiIntegrationTest.java
- server/src/test/java/com/oa/backend/service/FormServiceTest.java
- server/src/test/java/com/oa/backend/service/SystemConfigServiceTest.java

动作步骤：
1. 物理删除（用通配安全脚本，跳过不存在编号）：

```
rm -f server/src/test/java/com/oa/backend/controller/CoverageBoostTest{,2,3,4,5,6,7,8,9,10,11,12,14,15,16,17}.java
rm -f server/src/test/java/com/oa/backend/controller/AccessControlTest.java
rm -f server/src/test/java/com/oa/backend/controller/OaApiIntegrationTest.java
rm -f server/src/test/java/com/oa/backend/service/FormServiceTest.java
rm -f server/src/test/java/com/oa/backend/service/SystemConfigServiceTest.java
```

2. 跳号断言：`ls server/src/test/java/com/oa/backend/controller/CoverageBoost*.java 2>/dev/null` 输出为空（包括 CoverageBoostTest13 此前不存在所以不会报错）；
3. `cd server && mvn test` 确认剩余测试仍能跑、未引入编译错误。

完成阈值：
- `find server/src/test -name "CoverageBoost*" -o -name "AccessControl*" -o -name "OaApiIntegration*"` 输出为空；
- `find server/src/test -name "FormServiceTest.java" -o -name "SystemConfigServiceTest.java"` 输出为空；
- `mvn test` 全绿。

验收方式：QA Engineer 跑 find + mvn test，输出 PASS。

---

## P1-T04：删除 DELETE-STALE 后端孤儿与种子

`[ ]` 待开始

依据：DevController 已被 30 项业务表名硬编码污染、TestController 仅含一个 reset-code 端点是孤儿、db/data.sql 含项目/审批流业务种子、db/schema.sql 与 Flyway V1 重复（含 58 张混合表）、db/preset-construction.sql 全代码无引用。新基座按需重建，不留遗骸。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- server/src/main/java/com/oa/backend/controller/DevController.java
- server/src/main/java/com/oa/backend/controller/TestController.java
- server/src/main/resources/db/data.sql
- server/src/main/resources/db/schema.sql
- server/src/main/resources/db/preset-construction.sql

动作步骤：
1. 物理删除上述五份文件；
2. `grep -rn "DevController\|TestController\|preset-construction\|/db/data.sql\|/db/schema.sql"` 扫残留引用（如 application.yml 的 `spring.sql.init` 配置、SecurityConfig 的路径放行），逐一清掉；
3. `mvn spring-boot:run` 启动后端（dev profile），确认能正常启动到 `/api/health` 200。

完成阈值：
- 上述路径不存在；
- 残留引用为零；
- 后端能启动、health 200。

验收方式：QA Engineer 启动 server 并 curl /api/health 验证。

---

## P1-T05：删除前端业务页面

`[ ]` 待开始

依据：data_export 与 data_viewer 涉及业务数据导出与历史数据查看，属于业务相关；新基座暂无业务，删除后未来由业务模块或独立模块自带。

实现 agent：Frontend Engineer。审计 agent：QA Engineer。

改动范围：
- app/h5/pages/data_export/index.vue
- app/h5/pages/data_viewer/index.vue
（连同其上级 data_export/ 与 data_viewer/ 目录一起删除）

动作步骤：
1. 物理删除两个目录：`rm -rf app/h5/pages/data_export app/h5/pages/data_viewer`；
2. 清菜单与守卫中的对应条目——精确删除以下 key：
   - layouts/default.vue 的 ROLE_MENUS 中删除 key 为 `/data_export`、`/data_viewer` 的条目（影响 ceo、sys_admin 两个角色的菜单数组）；
   - middleware/auth.global.ts 的 PAGE_ACCESS 中删除 path 为 `/data_export`、`/data_viewer` 的条目；
   - layouts/middleware 整体重构留 P4-T08/T09，本任务只精确删这 4 行；
3. `yarn workspace oa-h5 build` 确认构建通过；
4. `yarn dev` 启动后浏览器访问 /data_export 与 /data_viewer，确认 404 或被守卫拦截。

完成阈值：
- 两个目录不存在；
- yarn build 通过；
- 浏览器走查无白屏、无 console error。

验收方式：QA Engineer 跑 build + 浏览器走查。

---

## P1-T06：删除前端业务组件 SignatureCanvas

`[ ]` 待开始

依据：与 P1-T01 后端 signature 删除呼应；前端签名画布只服务于工资条签字，工资条已确认改为"确认无误"按钮，组件无用。

实现 agent：Frontend Engineer。审计 agent：QA Engineer。

改动范围：
- app/h5/components/customized/SignatureCanvas/index.vue（连同 SignatureCanvas/ 目录）

动作步骤：
1. 物理删除目录；
2. `grep -rn "SignatureCanvas" app/h5` 找残留 import，逐一清掉；
3. `yarn workspace oa-h5 build` 确认通过；
4. mp 端同名组件（app/mp/src/components/cross-platform/SignatureCanvas/）在 P1-T08 整体删除时一并处理，本任务不动 mp。

完成阈值：
- grep 在 app/h5 下输出为空；
- build 绿。

验收方式：QA Engineer 跑 grep + build。

---

## P1-T07：删除 app/shared 业务工具

`[ ]` 待开始

依据：app/shared 是 h5 与 mp 共享的纯类型与工具库，但 form.ts/forms.ts/formLabels.ts 含 LEAVE/OVERTIME/INJURY/LOG 等业务表单类型与字段映射，违反"shared 应业务无关"原则。

实现 agent：Frontend Engineer。审计 agent：QA Engineer。

改动范围：
- app/shared/types/form.ts
- app/shared/utils/forms.ts
- app/shared/utils/formLabels.ts
- app/shared/types/index.ts（移除对 form.ts 的 re-export）
- app/shared/utils/index.ts（移除对 forms.ts、formLabels.ts 的 re-export）
- test/unit/shared/forms.test.ts
- test/unit/shared/formLabels.test.ts

动作步骤：
1. 删除三份业务工具与对应单测；
2. 改 barrel index.ts 移除 export 语句；
3. `grep -rn "from '@shared/types/form'\|from '@shared/utils/forms'\|from '@shared/utils/formLabels'" app/h5 app/mp` 扫残留 import，逐一清掉（mp 端的引用在 P1-T08 整体删除时一并处理，但本任务不能让 h5 端 build 断）；
4. `yarn workspace oa-h5 build` 与 `yarn workspace oa-h5 test` 通过。

完成阈值：
- 三份业务工具与两份单测不存在；
- barrel 已更新；
- h5 端 grep 无残留 import；
- yarn h5 build 与 test 全绿。

验收方式：QA Engineer 跑 build + test + grep。

---

## P1-T08：清理 app/mp 业务代码（与 h5 同步处理，保留平台壳）

`[ ]` 待开始

依据：用户已明确 mp 与 h5 同步演进、两端永远平级（决策来源：mp 与 h5 同步演进原则，已记入 ARCHITECTURE.md 路线图）。mp 当前已含可用的平台壳代码（登录、工作台、AppShell、stores、http util 等），与 h5 对称，应当与 h5 一样做"清业务、留基座"处理而非整体删除。

实现 agent：Frontend Engineer。审计 agent：QA Engineer。

改动范围：
- 删除业务页：app/mp/src/pages/attendance/index.vue、pages/projects/index.vue、pages/projects/detail.vue、pages/projects/construction_log_form.vue
- 删除业务工具与 mock：app/mp/src/utils/forms.ts（含 LEAVE/OVERTIME 字段映射）、app/mp/src/utils/org.ts 中的业务 mock 数据部分（保留通用 fetch wrapper 部分）
- 删除业务组件：app/mp/src/components/cross-platform/SignatureCanvas/ 整目录（与 h5 端 SignatureCanvas 同步删除）、app/mp/src/components/customized/ModuleCard.vue 中业务硬编码部分（如有）
- 保留平台代码：pages/login/、pages/index/、pages/auth/forgot_password/、pages/todo/、layouts/AppShell.vue、stores/user.ts、stores/index.ts、utils/http.ts、utils/access.ts、utils/index.ts、utils/device.ts、跨端通用 UI 组件（ApprovalTimeline、FileUpload、Steps、Timeline、Table、Row、Col、Permission 等）
- 保留 uni-app 工程文件：App.vue、main.ts、manifest.json、pages.json、vite.config.ts、tsconfig.json、package.json、styles/

动作步骤：
1. 物理删除上述业务代码（与 h5 端 P1-T05/T06/T07 同步进行）；
2. `grep -rn "attendance\|payroll\|expense\|project\|injury\|leave\|overtime\|signature" app/mp` 找残留，逐一清理（业务相关的全删，与平台共存的（如 utils/org.ts）只删业务部分留通用部分）；
3. pages.json 中删除已删页面对应的路由条目；
4. 修改 AppShell 或 workbench 入口的硬编码业务跳转（如有）为占位或读未来的 module registry；
5. `yarn workspace oa-mp build:mp-weixin` 通过（如 package.json 缺此 script 先在 mp 端 package.json 加上）；
6. `yarn workspace oa-mp test` 通过（验证 mp 端 vitest 配置仍可工作，剩余测试无业务依赖）；
7. mp 端登录与工作台壳能正常打开（用 demo 账号登录后看到平台菜单、无业务条目）。

完成阈值：
- 业务页与业务工具与业务组件全部删除；
- 平台壳完整保留并能 build；
- grep 业务关键字在 app/mp/ 下输出仅剩 pages.json 中的占位（如有）；
- mp 端能登录并看到空业务的平台壳；
- yarn workspace oa-mp build 与 test 两条命令均通过（与 h5 端对称验证）。

验收方式：QA Engineer 跑 grep + build + test + 浏览器或微信开发者工具走查 mp 登录后页面。

---

## P1-T09：删除 e2e 业务测试

`[ ]` 待开始

依据：e2e 业务 spec 全部基于已删业务页面，定位器与断言失效；新基座 E2E 在 P6-T06 按平台模块就近重建。

实现 agent：Frontend Engineer。审计 agent：QA Engineer。

改动范围：
- test/e2e/modules/D-M01.md
- test/e2e/modules/D-M08.md
- test/e2e/specs/D-M01.spec.ts
- test/e2e/specs/calculation_accuracy.spec.ts
- test/e2e/specs/construction_log_flow.spec.ts
- test/e2e/specs/date_boundaries.spec.ts
- test/e2e/specs/e2e_01_employee.spec.ts
- test/e2e/specs/e2e_02_worker.spec.ts
- test/e2e/specs/e2e_03_dept_manager.spec.ts
- test/e2e/specs/e2e_04_pm.spec.ts
- test/e2e/specs/e2e_05_finance.spec.ts
- test/e2e/specs/e2e_06_ceo.spec.ts
- test/e2e/specs/expense_flow.spec.ts
- test/e2e/specs/expense_upload.spec.ts
- test/e2e/specs/leave_flow.spec.ts
- test/e2e/specs/leave_type_crud.spec.ts
- test/e2e/specs/overtime_flow.spec.ts
- test/e2e/specs/payroll_cycle_flow.spec.ts
- test/e2e/specs/project_crud.spec.ts
- test/e2e/specs/rejection_resubmit.spec.ts
- test/e2e/pages/FormsPage.ts

动作步骤：
1. 物理删除上述文件；
2. `npx playwright test --list` 确认列表不再含已删用例；
3. 剩余基础设施类 spec（a11y/visual/ui-interactions）保留不动。

完成阈值：
- 上述路径不存在；
- playwright list 输出预期。

验收方式：QA Engineer 跑 playwright --list 比对。

---

## P1-T10：删除 mp 单测

`[ ]` 待开始

依据：与 P1-T08 mp 子项目处置呼应；mp 单测无任何独立保留价值。

实现 agent：Frontend Engineer。审计 agent：QA Engineer。

改动范围：test/unit/mp/ 整目录（含 access.test.ts、appshell.test.ts、org.test.ts、stores.user.test.ts、setup.ts）

动作步骤：
1. `rm -rf test/unit/mp`；
2. `yarn workspace oa-h5 test` 仍能跑通剩余 unit 测试。

完成阈值：
- 路径不存在；
- yarn h5 test 全绿。

验收方式：QA Engineer 跑 ls + test。

---

## P1-T11：删除测试历史文档与报告

`[ ]` 待开始

依据：旧 TEST_DESIGN/BUG_LOCATOR/TEST_COVERAGE_GAPS/blackbox/manual 等基于已废弃的业务模型与已删除的 controller；测试历史报告快照（h5-coverage、playwright-report、manual-walkthrough 截图）属于历史快照，无未来参考价值；新测试设计在 Phase 5 按模块就近重写。

实现 agent：QA Engineer。审计 agent：QA Engineer 自审（删除类任务无需用户复查，仅 tree 输出与预期一致即认为通过）。

改动范围：
- test/BUG_LOCATOR.md
- test/TEST_COVERAGE_GAPS.md
- test/TEST_DESIGN.md
- test/blackbox/ 整目录
- test/manual/ 整目录
- test/manual-test-2026-04-17/ 整目录
- test/integration/TEST_DESIGN.md
- test/e2e/TEST_DESIGN.md
- test/reports/h5-coverage/ 整目录
- test/e2e/playwright-report/ 整目录
- test/tools/manual-walkthrough/ 整目录（含截图）

动作步骤：
1. 物理删除上述文件与目录；
2. test/ 仅剩基础设施目录骨架（integration/、e2e/、unit/、tools/）与少量被保留的文件；
3. 检查根目录 README.md 等是否引用以上路径，有则同步清理。

完成阈值：
- 上述路径不存在；
- test/ 顶层结构与新基座规划一致。

验收方式：QA Engineer 跑 tree test/ 输出与预期一致。

---

## P1-T12：批量删除审计

`[ ]` 待开始

依据：本阶段所有删除完成后须做集中审计，确认业务残留为零、基座可启动、现有基座测试不退化。

实现 agent：QA Engineer。审计 agent：Reality Checker。

改动范围：无文件改动，仅做扫描与启动验证。

动作步骤：
1. 业务关键字扫描，明确排除规则（避免误命中 ARCHITECTURE.md 决策章节、TODO.md 任务说明、模块 README 中迁移自 DESIGN.md 的业务说明）：

```
grep -rn "attendance\|payroll\|expense\|project\|injury\|signature\|leave\|overtime\|construction\|aftersale\|material_delegation" \
  --include="*.java" --include="*.ts" --include="*.vue" --include="*.sql" --include="*.yml" --include="*.yaml" \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=target --exclude-dir=docs \
  . 2>/dev/null
```

排除目录与扩展名说明：业务模块 README（在 docs 与 modules 目录下）会引用业务关键字，是合规的；这条扫描只针对**代码与 SQL 与配置**（实际业务残留），文档不在范围；

2. `cd server && mvn clean test` 跑通；
3. `yarn workspace oa-h5 lint && yarn workspace oa-h5 test && yarn workspace oa-h5 build` 全绿；
4. `cd server && mvn spring-boot:run`（dev profile）后端起来到 /api/health 200；
5. `cd app/h5 && yarn dev` 前端起来、登录页可见（curl http://localhost:3000 返回 200 含登录页 HTML）。

完成阈值：
- 业务关键字命中清单为空（或全部已记入处置方案）；
- 三命令全绿；
- 前后端能启动。

验收方式：Reality Checker 出具 PASS 或 NEEDS WORK 报告。NEEDS WORK 必须当阶段修复（参考全局 CLAUDE.md 阶段质量治理规则），不允许遗留到 Phase 2。

---

# Phase 2：业务字段从基座代码剥离

## P2-T01：剥离 Employee 实体的 expense_limit 字段

`[ ]` 待开始

依据：基座 platform/employee 应业务无关，expense_limit（报销额度）属于 expense 业务字段，应归 modules/expense 自管；新基座 employee 实体不带任何业务字段。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- server/src/main/java/com/oa/backend/entity/Employee.java（移除字段、setter/getter）
- server/src/main/java/com/oa/backend/dto/EmployeeCreateRequest.java（移除 expenseLimit）
- server/src/main/java/com/oa/backend/dto/EmployeeResponse.java
- server/src/main/java/com/oa/backend/dto/EmployeeUpdateRequest.java
- server/src/main/java/com/oa/backend/service/impl/EmployeeServiceImpl.java（移除赋值与读取）
- server/src/main/java/com/oa/backend/mapper/EmployeeMapper.java（项目用 @Select/@Update 注解 SQL，无 xml；移除注解 SQL 中相关列引用）
- 前端 app/h5/ 下使用 expenseLimit 的页面、组件、表单（如 employees 列表与详情页）

动作步骤：
1. 后端实体与 DTO 移除字段及 getter/setter；
2. service 与 mapper 注解 SQL 移除该字段的赋值与查询（项目用注解，不用 xml）；
3. 前端模板与脚本移除该字段——`grep -rn "expenseLimit\|expense_limit" app/h5/` 命中处全删；
4. V1 schema 中的 expense_limit 列定义本任务不动（留 P2-T08 V1 重写时一起删）；
5. `cd server && mvn test` 全绿；
6. `yarn workspace oa-h5 build` 与 `yarn workspace oa-h5 test` 全绿。

完成阈值：
- `grep -rn "expense_limit\|expenseLimit" server/ app/h5/` 输出为空；
- 后端与前端全绿。

验收方式：QA Engineer 跑 grep + 全部测试命令。

---

## P2-T02：剥离 Position 实体的 requires_construction_log 字段

`[ ]` 待开始

依据：requires_construction_log（是否要求填写施工日志）是 project.log 业务字段，属于业务关注点，不应在基座 position 实体上。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- server/src/main/java/com/oa/backend/entity/Position.java（移除 requires_construction_log 字段、setter/getter）
- server/src/main/java/com/oa/backend/dto/PositionResponse.java（移除 requiresConstructionLog）
- server/src/main/java/com/oa/backend/dto/PositionUpsertRequest.java
- server/src/main/java/com/oa/backend/service/impl/PositionServiceImpl.java（移除赋值与读取）
- server/src/main/java/com/oa/backend/mapper/PositionMapper.java（项目用注解 SQL，移除相关列引用）
- 前端 app/h5/pages/positions/index.vue 与 app/mp 中如有 requiresConstructionLog 渲染（grep 找）

动作步骤：与 P2-T01 同结构，操作对象换成 requires_construction_log / requiresConstructionLog：

1. 后端实体与 DTO 移除字段及 getter/setter；
2. service 与 mapper 注解 SQL 移除该字段的赋值与查询；
3. 前端 `grep -rn "requiresConstructionLog\|requires_construction_log" app/h5 app/mp` 命中处全删；
4. V1 schema 中的 requires_construction_log 列定义本任务不动（留 P2-T08 V1 重写时一起删，与 P2-T01 同处理方式）；
5. `cd server && mvn test` 全绿；
6. 前端 build 与 test 全绿。

完成阈值：
- grep 输出为空；
- 后端与前端全绿。

验收方式：QA Engineer 跑 grep + 全部测试命令。

---

## P2-T03：剥离 ApprovalFlowService 的两个业务方法

`[ ]` 待开始

依据：用户已确认表单编号生成与表单类型展示名称由各业务模块自管（决策来源：清理决策第二项 选项 A）；基座 approval 引擎只做"推进节点、回调通知"等纯审批流逻辑，不管业务级编号字典。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- server/src/main/java/com/oa/backend/service/ApprovalFlowService.java（删除 generateFormNo 与 getFormTypeName 两个方法及其内部 LEAVE/OVERTIME/INJURY/LOG 字典）
- 全仓库调用方：扫 server/src、app/h5、app/mp、test 找谁在调

动作步骤：
1. 删除 ApprovalFlowService.java 中 generateFormNo 与 getFormTypeName 两个方法及其内部 LEAVE/OVERTIME/INJURY/LOG 字典常量；
2. 全仓库扫描调用方：

```
grep -rn "generateFormNo\|getFormTypeName" server/src app/h5 app/mp test
```

对每个命中按以下规则处理：
- 调用方在 controller 直接渲染前端响应字段：删调用 + 删响应字段（基座彻底剥离业务依赖）；
- 调用方在内部 service 间或单测：直接删调用，让被调用方变成 dead code 后续随业务模块回填时重新设计；
- 调用方在前端代码（app/h5、app/mp）：通常已被 P1-T05/T08 删除，本任务一般无前端改动；如有残留则一并删；

3. `mvn test` 全绿。

完成阈值：
- grep 输出为空；
- 测试绿。

验收方式：QA Engineer 跑 grep + mvn test。

---

## P2-T04：删除 SystemConfigController，按方案二重建为 ConfigController

`[ ]` 待开始

依据：用户已选 B（删除后新建）；配置基座方案二要求 platform/config 只暴露通用 K-V/JSON 操作，业务专属端点（attendance-unit、payroll-cycle、company-name 等）剥离到对应业务模块或基座其他模块。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- 删除：server/src/main/java/com/oa/backend/controller/SystemConfigController.java、对应的 SystemConfigService（其中业务专属端点逻辑全删，通用 K-V 部分整体重构）
- 新建：server/src/main/java/com/oa/backend/controller/ConfigController.java（位于新位置 com/oa/platform/config/controller/ 在 P3-T01 重组后）
- 新建：对应 ConfigService、ConfigServiceImpl
- 改动 SystemConfig 实体的字段为 namespace + key + value（JSON 字符串） + version + updated_at + updated_by

动作步骤：
1. 物理删除旧 Controller 与 Service；
2. 新建 ConfigController，端点设计：

```
GET    /api/config/{namespace}/{key}    # 单 key 详情
GET    /api/config/{namespace}          # namespace 下全部 key
GET    /api/config/namespaces           # 所有 namespace 列表
PUT    /api/config/{namespace}/{key}    # 创建或更新（含乐观锁 expectedVersion）
DELETE /api/config/{namespace}/{key}    # 删除（仅 CEO，慎用）
```

DTO 详细签名见 P4-T06；本任务先用临时简化 DTO（仅 value 字符串），P4-T06 升级为含 version、updatedAt、updatedBy 的完整 DTO；

3. 鉴权钩子用 Spring Security 注解：所有路径要求已认证用户读、写要求 CEO 角色。具体按 key 的细粒度权限矩阵在 P4-T06 落地（本任务粗放即可）；
4. 错误响应：本任务暂用现有 GlobalExceptionHandler（返回 `{code, message}` 简单结构）；P4-T01 完成 ProblemDetail 改造后由 P4-T06 一并适配。本任务在新 ConfigController 顶部添加注释：`// TODO(P4-T06): 适配 ProblemDetail 响应格式`；
5. 配置变更通过 OperationLogAspect 自动写 operation_log（基座已有切面，不需要改造）；
6. `cd server && mvn test` 全绿。

完成阈值：
- `grep -rn "attendance-unit\|payroll-cycle\|/config/company-name" server/` 仅在 ARCHITECTURE.md 历史决策章节出现；
- curl 新接口五条路径分别返回预期状态码：未带 token 401、普通用户 GET 200、普通用户 PUT 403、CEO PUT 200/204、不存在 key GET 404；
- operation_log 表中能查到配置变更记录。

验收方式：QA Engineer 通过 curl + JDBC 查 operation_log + mvn test 综合验证。

---

## P2-T05：删除 platform/team

`[ ]` 待开始

依据：用户已确认 platform/team 删除（决策来源：架构 P0 第二项）；team 在当前代码里只是 department 视图的别名，没有独立语义。"我所在部门成员"查询合并到 platform/department 的新端点。

实现 agent：Backend Engineer + Frontend Engineer。审计 agent：QA Engineer。

改动范围：
- server/src/main/java/com/oa/backend/controller/TeamController.java
- server/src/main/java/com/oa/backend/service/TeamService.java（含被审计标记的 getMonthlyAttendanceStats、getOvertimeHours 业务统计方法，连同服务一并删除）
- 前端 app/h5/pages/team/index.vue（连同 team/ 目录）
- DepartmentController 添加新端点 GET /api/department/my/members（返回当前用户所属部门的成员列表）

动作步骤：
1. 删除三份文件与目录；
2. 在 DepartmentController 添加新端点；
3. 前端 layouts/default.vue 中 ROLE_MENUS 的 /team 条目暂留（P4-T08 一并清理）；
4. `mvn test` + 前端 build 全绿；
5. `grep -rn "TeamController\|TeamService\|/team" server/ app/h5/` 仅剩 layouts/middleware 中的过渡条目。

完成阈值：
- 三份文件不存在；
- 新端点 curl 返回预期；
- 前后端全绿。

验收方式：QA Engineer 跑 grep + curl + 测试命令。

---

## P2-T06：清理基座代码中的业务注释与 javadoc

`[ ]` 待开始

依据：基座代码即便保留也不应在注释里出现"请假/加班/工资条/工伤/施工日志"等具体业务名词，否则换业务系统读起来困惑。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- server/src/main/java/com/oa/backend/service/AttachmentService.java（注释列举 LOG/INJURY/EXPENSE 业务类型）
- server/src/main/java/com/oa/backend/entity/AttachmentMeta.java
- server/src/main/java/com/oa/backend/service/NotificationService.java（PAYROLL javadoc）
- server/src/main/java/com/oa/backend/entity/Notification.java
- server/src/main/java/com/oa/backend/entity/CleanupTask.java（PAYROLL_SLIP javadoc）
- server/src/main/java/com/oa/backend/dto/SetupFinalizeRequest.java（业务字段示例）
- 其他通过 grep 扫描发现的

动作步骤：
1. `grep -rn "PAYROLL\|LEAVE\|OVERTIME\|EXPENSE\|INJURY\|CONSTRUCTION\|payslip\|attendance" server/src/main/java/com/oa/backend/` 找全部命中；
2. 逐条把注释里的具体业务名词替换为通用描述（"业务表单"代替"请假/加班"、"业务记录"代替"工资条"、"业务类型枚举"代替具体枚举值列举），不删除字段；
3. `mvn compile` 与 `mvn test` 全绿。

完成阈值：
- 上述 grep 在 server/src/main/java/com/oa/backend/ 下命中只剩 ArchUnit 测试或基座枚举名（如 ProblemDetailType 中可能含 BUSINESS 字符）；
- 编译与测试全绿。

验收方式：QA Engineer 跑 grep + 人工抽查 + 测试命令。

---

## P2-T07：剥离 AttachmentAccessService 与 RetentionService 的 FormRecordMapper 依赖

`[ ]` 待开始

依据：基座 service 不应跨模块直接读 form_record 表（违反"基座业务无关"判据）；用户已确认附件鉴权委托业务记录鉴权（决策来源：清理决策第三项），数据保留期清理通过 SPI 委托业务模块（决策来源：清理决策第四项的 file_storage cleanup 子模块）。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- server/src/main/java/com/oa/backend/service/AttachmentAccessService.java（去除 FormRecordMapper 注入与调用）
- server/src/main/java/com/oa/backend/service/RetentionService.java（同上）

动作步骤：
1. 从两个 service 移除 FormRecordMapper 字段与 @Autowired/构造参数；
2. 把直接 mapper 调用替换为 stub 占位实现：
   - AttachmentAccessService.canAccess 默认返回 false（拒绝所有访问），等 P4-T05 file_storage 模块的 BusinessRecordAccessChecker SPI 接入后再切换；
   - RetentionService 的清理过期 form_record 路径删除，cleanup 调度切换为遍历占位的 RetentionCleanupHandler 列表（当前为空，所以无清理动作），等 P4-T05 SPI 接入后业务模块各自实现自己的 handler；
3. `mvn test` 中相关单测可能失败：按 P6-T01 测试处理硬规则（"不适配的就删除，只留完全适配的"），整份删除涉及 AttachmentAccessService 与 RetentionService 的旧测试用例，不再标记延后或裁剪；新测试在 P4-T05 完成 SPI + P5-T04 platform README 完成 + P6-T06 happy_path 骨架时按新结构重写；
4. `cd server && mvn compile` 通过、`mvn test` 全绿（删除旧测试后剩余测试通过）。

完成阈值：
- `grep -rn "FormRecordMapper" server/src/main/java/com/oa/backend/service/AttachmentAccessService.java server/src/main/java/com/oa/backend/service/RetentionService.java` 输出为空；
- mvn compile 通过；
- mvn test 通过率不低于本任务开始前。

验收方式：QA Engineer 跑 grep + mvn 命令。

---

## P2-T08a：累积态分析与新 V1/V2 草稿

`[ ]` 待开始

依据：本子任务负责把当前散落在 V1-V21 中的所有基座 schema 与种子变更累积成最终态草稿，作为 P2-T08b 实际写文件的输入。先分析后落地，避免写文件时反复返工。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- 新建临时草稿文件 server/src/main/resources/db/migration/V1__init_schema.sql.draft（不进 Flyway，仅作 review 用）
- 新建临时草稿文件 server/src/main/resources/db/migration/V2__seed_data.sql.draft

动作步骤：

第一步，通读现有迁移并分析累积变更：
- V1 原始 schema：列出所有表与字段；
- V2 原始种子：列出所有 INSERT；
- V10 部门经理角色：sys_role 表加 department_manager；
- V14 索引：列出加哪些索引到哪些表；
- V15-V18 角色名变化：ops→sys_admin、gm→general_manager 的数据迁移；
- V19 form_record 幂等键：form_record 表加 idempotency_key VARCHAR(64) UNIQUE；
- V20 sys_admin demo 种子：sys_user/employee 加 sys_admin.demo 账号；
- V21 wizard_finalize_state：新增 wizard_finalize_state 表。

第二步，合成新 V1__init_schema.sql.draft：仅含以下 25 张基座表，含所有索引（V14 累积），form_record 含 idempotency_key 字段（V19 累积），wizard_finalize_state 含 finalize_token_hash VARCHAR(64) 字段（对应 P4-T03 token 哈希修复，存 SHA-256 hex）：

```
sys_user、sys_role、permission、role_permission
employee、emergency_contact
department、position、position_level
second_role_def、second_role_assignment
form_type_def、form_record
approval_flow_def、approval_flow_node、approval_record
notification
attachment_meta
operation_log
retention_policy、retention_reminder
cleanup_task、export_backup_task
system_config
wizard_finalize_state
```

不含任何业务表（payroll_*/leave_type_*/overtime_*/project_*/work_item_*/construction_*/injury_*/employee_signature/salary_*/evidence_chain/social_insurance_item 等约 36 张）。文件头部加注释说明累积来源。

第三步，合成新 V2__seed_data.sql.draft：含所有基座角色 9 个（sys_admin、ceo、general_manager、hr、finance、project_manager、department_manager、employee、worker），general_manager 为默认必选；含 system_config 的 prod-safe 默认值——`company.name`=''、`data.retention.days`=1095、其他基座默认；**不**写入 `security.default_password`；**不**写入任何 demo 账号。

第四步，QA Engineer 对照原迁移人工核对累积态草稿——逐字段、逐索引、逐种子记录确认无丢失也无业务残留。

完成阈值：
- 两份草稿文件 .draft 就位；
- QA Engineer 出具核对报告 PASS。

验收方式：QA Engineer 逐项对比累积态文档与原迁移文件，输出"无丢失、无业务残留"的 PASS 报告。

---

## P2-T08b：写新 V1__init_schema.sql 与 V2__seed_data.sql

`[ ]` 待开始

依据：P2-T08a 草稿确认无误后，本子任务负责把草稿落到正式 Flyway 迁移文件并启动验证。

前置依赖：P2-T08a 已 PASS。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- 重写 server/src/main/resources/db/migration/V1__init_schema.sql
- 新建 server/src/main/resources/db/migration/V2__seed_data.sql
- 删除 .draft 临时文件

动作步骤：

第一步，把 V1__init_schema.sql.draft 内容写入正式 V1__init_schema.sql；删除 .draft；

第二步，把 V2__seed_data.sql.draft 内容写入正式 V2__seed_data.sql；删除 .draft；

第三步，dev profile spring boot 启动：

```
cd server && mvn spring-boot:run
```

启动需含 fixtures/dev/R__seed_dev.sql 注入 demo 账号。启动成功后 JDBC 查询：

```
SELECT table_name FROM information_schema.tables WHERE table_schema='PUBLIC' ORDER BY table_name;
```

输出应是 25 张基座表 + flyway_schema_history。

第四步，JDBC 查 sys_role 表，应含 9 个角色记录。JDBC 查 sys_user/employee 表，应有至少一个 employee 绑定 general_manager 角色（来自 fixtures/dev gm.demo）。

第五步，mock prod profile 启动：

```
cd server && SPRING_PROFILES_ACTIVE=prod mvn spring-boot:run
```

JDBC 查询表清单一致、sys_role 9 个角色齐全、sys_user 不含任何 demo 账号、system_config 不含 security.default_password。

第六步，`cd server && mvn test` 全绿。

完成阈值：
- V1 与 V2 文件就位、.draft 已删；
- dev profile 启动 + JDBC 查询符合预期；
- prod profile 启动 + JDBC 查询符合预期；
- mvn test 全绿。

验收方式：Backend Engineer 自跑 + QA Engineer 复跑双 profile + Reality Checker 终审。

---

## P2-T08c：删除 9 份历史迁移文件

`[ ]` 待开始

依据：P2-T08b 完成后新 V1+V2 已是基座基线，原 V1 与 V2/V10/V14/V15/V16/V18/V19/V20/V21 共 10 份迁移内容已被吸收，可物理删除清理 db/migration/ 目录。

前置依赖：P2-T08b 已 PASS（新 V1+V2 启动验证通过）。

实现 agent：Backend Engineer。审计 agent：QA Engineer + Reality Checker。

改动范围：删除原 V1__init_schema.sql.bak（如 P2-T08b 备份了原 V1）、V2__init_data.sql、V10__department_manager_role.sql、V14__add_indexes.sql、V15__add_ops_role.sql、V16__migrate_gm_role.sql、V18__rename_ops_to_sys_admin.sql、V19__form_record_idempotency.sql、V20__seed_sys_admin_demo.sql、V21__add_wizard_finalize_state.sql 共 9 份。

动作步骤：

第一步，物理删除 9 份历史迁移：

```
cd server/src/main/resources/db/migration
rm -f V2__init_data.sql V10__department_manager_role.sql V14__add_indexes.sql V15__add_ops_role.sql V16__migrate_gm_role.sql V18__rename_ops_to_sys_admin.sql V19__form_record_idempotency.sql V20__seed_sys_admin_demo.sql V21__add_wizard_finalize_state.sql
```

第二步，验证 db/migration/ 下只剩 V1__init_schema.sql + V2__seed_data.sql + 业务模块子目录（attendance/、payroll/、expense/、project/、injury/，各空目录含 .gitkeep）+ R__ Repeatable 迁移：

```
ls server/src/main/resources/db/migration/
# 预期输出：V1__init_schema.sql V2__seed_data.sql attendance/ payroll/ expense/ project/ injury/
```

第三步，spring boot dev profile 重启验证：清掉本地 H2 数据库后重启，Flyway 完整跑过新 V1+V2，JDBC 查询表清单与 P2-T08b 验证结果一致；

第四步，mock prod profile 启动验证同上；

第五步，`cd server && mvn test` 全绿。

完成阈值：
- db/migration/ 下只剩 V1+V2 + 业务子目录 + R__；
- 双 profile 重启验证均通过；
- mvn test 全绿。

验收方式：Backend Engineer 自跑 + QA Engineer 复跑双 profile 重启 + Reality Checker 终审。本任务是基座 schema 演进的终态确认。

---

## P2-T09：建立 fixtures/dev/ 测试数据独立目录

`[ ]` 待开始

依据：用户已确认测试数据单独保存在独立目录、不侵入项目主源码、仅在 dev 环境读取、目录里有 README 说明（决策来源：测试数据独立目录指示）。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- 仓库根新建 fixtures/dev/ 目录与 fixtures/dev/migration/ 子目录
- fixtures/dev/README.md
- fixtures/dev/migration/R__seed_dev.sql（单份 Repeatable 迁移，不带版本号）
- 修改 server/src/main/resources/application-dev.yml 的 spring.flyway.locations

动作步骤：
1. 建 fixtures/dev/ 与 fixtures/dev/migration/ 目录（可放 .gitkeep）；
2. 写 fixtures/dev/README.md，含七段内容：
   段一"用途说明"：本目录是 dev 专用种子数据，仅在 dev profile 下被 Flyway 加载执行；
   段二"加载机制"：Flyway filesystem 路径配置在 application-dev.yml 的 spring.flyway.locations，prod profile 与 test profile 不引用此路径；R__ Repeatable 迁移每次启动按文件 checksum 检查变化重跑；
   段三"字段含义"：列出每个 demo 账号的姓名、角色、邮箱、手机号，说明其在开发期承担的测试场景（如 ceo.demo 用于测试 CEO 视角、worker.demo 用于测试劳工视角）；
   段四"维护规则"：不可放真实生产数据、不可放真实姓名手机号邮箱、demo 账号密码统一为 123456 仅供开发使用、改 seed 直接编辑 R__ 文件不新增版本号、本目录与 P8-T02 git orphan init 兼容会一同进 init commit；
   段五"安全语义"（关键）：本目录所有凭据均为开发演示数据非真实生产凭据；prod profile 自动排除整目录意味着生产部署时这些 demo 账号根本不会被加载到生产数据库；本目录的存在不构成 OWASP A05 Security Misconfiguration 漏洞，因为该类漏洞的判据是"敏感数据泄漏到生产环境"，本目录的加载范围严格限于 dev profile；任何安全审计员看到本目录时应理解本说明并参照 prod 部署模型而非 git 仓库内容判断风险；
   段六"扩展规则"：未来新增 demo 数据或 dev 配置项时如何编辑此目录；
   段七"与 prod setup 的关系"：dev 通过本目录预填 default_password 与跳过向导，prod 走 setup wizard DefaultPasswordStep 强制设置，两条路径互不干扰；
3. 写 R__seed_dev.sql：单份 Repeatable 迁移，含三段：
   段一：插入 9 个 demo 账号（ceo.demo、hr.demo、finance.demo、pm.demo、dept_manager.demo、employee.demo、worker.demo、sys_admin.demo、gm.demo），bcrypt('123456') 作为 password_hash，姓名按 demo 假名（陈明远、李静、王建国、张晓宁、赵铁柱、李思文、周伟、刘运维、孙宇），邮箱用 `@oa.demo` 后缀，手机号 13800000001 至 13800000009 递增；其中 gm.demo 绑定 general_manager 角色（满足 default 必选）；
   段二：插入 system_config 中 namespace='security'、key='default_password'、value='123456' 这条记录；
   段三：把 wizard_finalize_state 表标记为 finalize 完成（让 dev 启动后跳过向导直接进工作台）；
   每段都用 ON CONFLICT (key) DO NOTHING（H2 与 PostgreSQL 均支持）确保幂等；
4. 修改 server/src/main/resources/application-dev.yml：

```
spring:
  flyway:
    locations: classpath:db/migration,filesystem:fixtures/dev/migration
```

application-prod.yml 与 application-test.yml 保持只引用 `classpath:db/migration`（不加载 fixtures/dev）；

5. spring boot dev profile 启动验证：所有 demo 账号能登录、wizard 已 finalize、新建员工读到 default_password='123456'；
6. spring boot prod profile 启动（mock）验证：fixtures/dev 不被加载、system_config 中 security.default_password 不存在、wizard_finalize_state 为未完成、需走 setup wizard 才能 finalize。

完成阈值：
- fixtures/dev/ 目录齐全含 README + 两份 SQL；
- application-dev.yml 配置正确加载；
- application-prod.yml 与 application-test.yml 不加载；
- dev 启动后 demo 账号可登录、wizard 已 finalize；
- prod 启动后 demo 账号不存在、wizard 需走完。

验收方式：QA Engineer 双 profile 启动验证 + 浏览器登录抽查。

---

## P2-T10：移除 application-prod.yml 中所有 ENV fallback 默认值

`[ ]` 待开始

依据：用户已确认 prod 配置中 ENV 引用必须强制 ENV 注入、未设直接启动失败（决策来源：安全审计第 3 条选 A）；fail-loud 原则避免运维漏配置时悄悄退化到不安全默认。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：server/src/main/resources/application-prod.yml。

动作步骤：
1. 把 `${DB_URL:jdbc:postgresql://localhost:5432/boyuan_oa}` 改为 `${DB_URL}`；
2. 把 `${DB_USERNAME:oa}` 改为 `${DB_USERNAME}`；
3. 把 `${DB_PASSWORD}` 保持（已无 fallback）或显式确保无 fallback；
4. 把 `${JWT_SECRET}` 与其他 ENV 引用按同样规则去除所有 fallback；
5. 启动验证：mock prod profile 在 ENV 不齐时启动直接抛 PlaceholderResolutionException 失败、ENV 齐时启动成功；
6. dev profile（H2 内存数据库默认配置）保持不动。

完成阈值：
- application-prod.yml 中所有 `${VAR:fallback}` 改为 `${VAR}`；
- ENV 缺失时 prod 启动失败抛明确错误；
- ENV 完整时启动成功。

验收方式：QA Engineer 跑 mock prod 启动两种场景。

---

## P2-T11：EmployeeServiceImpl 与 Controller 中硬编码 "123456" 改为读 ConfigService

`[ ]` 待开始

前置依赖：P3-T01 后端按 platform/<module> 重组完成（路径变化）；P4-T06 ConfigController 重写完成（提供 ConfigService API）。本任务必须在两者之后执行。

依据：用户已确认默认初始密码改为系统配置 K-V 项 + dev 通过 fixtures/dev seed 预设、prod 通过 setup wizard 强制设置（决策来源：安全审计第 1 题方案 A2-Refined）。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- server/src/main/java/com/oa/backend/service/impl/EmployeeServiceImpl.java（在 P3-T01 重组后路径）
- server/src/main/java/com/oa/backend/controller/EmployeeController.java
- server/src/main/java/com/oa/backend/service/EmployeeService.java（接口）

动作步骤：
1. EmployeeServiceImpl 创建员工与重置密码方法中，把 `passwordEncoder.encode("123456")` 改为：

```
String defaultPwd = configService.get("security", "default_password");
if (defaultPwd == null || defaultPwd.isBlank()) {
  throw new BusinessException("PLATFORM.EMPLOYEE.DEFAULT_PASSWORD_NOT_CONFIGURED",
    "管理员尚未设置默认密码，请联系 HR 在系统配置页设置");
}
employee.setPasswordHash(passwordEncoder.encode(defaultPwd));
```

2. 注入 ConfigService（基座 platform/config 已提供）；
3. 修整 EmployeeController.java:115 与对应 service 内的 javadoc 与代码注释，删除"123456"字面量，改为"默认初始密码（由系统配置 security.default_password 决定）"；
4. 单测覆盖：default_password 已配置时正常入库、未配置时抛业务异常；
5. 浏览器 dev 走查：HR 创建员工成功（dev seed 已写入 default_password）。

完成阈值：
- grep "123456" server/src/main/java 在 EmployeeServiceImpl 与 EmployeeController 中输出为空；
- 单测全绿；
- dev 浏览器走查创建员工成功。

验收方式：QA Engineer 跑 grep + mvn test + 浏览器走查。

---

## P2-T12：清理文档中的明文 "123456"

`[ ]` 待开始

依据：用户指示文档与注释中的弱密码字面量直接删除不留引用（决策来源：第 4 题授权）。

实现 agent：Frontend Engineer + Backend Engineer。审计 agent：QA Engineer。

改动范围：
- app/h5/FRONTEND_IMPL.md（三处明文 123456）
- 其他 grep 扫描发现的文档明文（README、各 IMPL 文档等）

动作步骤：
1. 删除 FRONTEND_IMPL.md:278, 347, 363 三处涉及"密码统一 123456"的描述段落；如某段是必要的开发说明（如 DevToolbar 一键登录介绍），改写为"开发演示账号通过 fixtures/dev seed 预设，密码值见该目录 README"；
2. grep 全仓库 "123456" 找其他文档命中（排除测试文件，因为测试文件 P1-T03 与 P1-T04 删除）；
3. 逐一修改：保留必要技术说明、删除 demo 密码字面量。

完成阈值：
- grep "123456" 在 *.md 文件中（排除已确认删除的 V20 SQL 注释）输出为空。

验收方式：QA Engineer 跑 grep。

---

## P2-T13：DevToolbar.vue 与 k6 脚本弱密码字面量改造

`[ ]` 待开始

依据：用户授权 dev 工具与性能脚本中弱密码字面量改造（决策来源：第 6、7 题授权）。

实现 agent：Frontend Engineer + Backend Engineer。审计 agent：QA Engineer。

改动范围：
- app/h5/dev/DevToolbar.vue
- tools/k6/race.js
- tools/k6/normal.js
- tools/k6/soak.js

动作步骤：
1. DevToolbar.vue 一键登录改造：原本硬编码 `password: '123456'` 调 `/api/auth/login`，改为调 `/api/auth/dev-login`（无密码端点）。**重要前置**：当前 AuthController.java:260 的 `/dev-login` 实现**没有 profile 限定**（无 @Profile("dev") 注解、无鉴权），属于"开发后门遗留到生产"安全漏洞——必须先由 P0-T01（见下方）抽离到独立 DevAuthController 类并加 @Profile("dev") 限定。本任务依赖 P0-T01 完成；DevAuthController 的端点路径仍是 /api/auth/dev-login 不变，DevToolbar 改造无感知。改造后 DevToolbar 只传 username 字段，后端 dev profile 自动签发 token；前端代码不出现密码字面量；
2. k6 三个脚本（race.js、normal.js、soak.js）中 `password: '123456'` 改为：

```javascript
const password = __ENV.OA_DEMO_PASSWORD;
if (!password) {
  throw new Error('OA_DEMO_PASSWORD environment variable is required. Run: k6 run -e OA_DEMO_PASSWORD=<password> script.js');
}
// 后续 login 请求用 password 变量
```

运行时通过环境变量直接传入：`k6 run -e OA_DEMO_PASSWORD=123456 tools/k6/race.js`；不依赖 fixtures/dev 内的额外文件；

3. k6 脚本顶部添加 README 风格注释说明运行前必须设置 OA_DEMO_PASSWORD 环境变量；
4. dev 浏览器走查 DevToolbar 一键登录 8 个角色（含 gm.demo）仍能正常工作；
5. k6 跑通一次冒烟验证（5 秒 normal.js 跑通即可）。

完成阈值：
- grep "'123456'" app/h5/dev/DevToolbar.vue 与 tools/k6/ 输出为空；
- DevToolbar 一键登录正常；
- k6 脚本能通过 ENV 跑通。

验收方式：QA Engineer 跑 grep + 浏览器走查 + k6 冒烟。

---

## P2-T14：CI workflows POSTGRES_PASSWORD 改 GitHub Secrets

`[ ]` 待开始

依据：CI workflow 中字面量密码 `oa_dev_password` 不规范，应通过 GitHub Secrets 注入（决策来源：第 9 题自处理）。

实现 agent：DevOps Engineer。审计 agent：QA Engineer。

改动范围：
- .github/workflows/ci.yml
- .github/workflows/fast-check.yml

动作步骤：
1. 在 GitHub 仓库 Settings -> Secrets and variables -> Actions 添加 secret `POSTGRES_TEST_PASSWORD`（可继续用 oa_dev_password 这个值，但通过 secret 注入，避免在 yml 文件里出现明文）；
2. 修改两份 yml 中所有 `POSTGRES_PASSWORD: oa_dev_password` 与相关字面量为 `POSTGRES_PASSWORD: ${{ secrets.POSTGRES_TEST_PASSWORD }}`；
3. PGPASSWORD 与连接字符串中的密码占位同步替换；
4. 推送到分支验证 CI 仍能跑通 PostgreSQL 服务容器。

完成阈值：
- grep "oa_dev_password\|oa_pw" .github/workflows/ 输出为空；
- CI 跑通 PostgreSQL 集成测试。

验收方式：QA Engineer 推一个测试 PR 看 CI 状态。

---

## P2-T15：MybatisPlus DbType 从 H2 改为 POSTGRE_SQL

`[ ]` 待开始

依据：`server/src/main/java/com/oa/backend/config/MybatisPlusConfig.java:20` 写 `new PaginationInnerInterceptor(DbType.H2)`，但 dev/test/prod 三个 profile 实际都连 PostgreSQL（不是 H2）。当前 H2 方言生成的 `LIMIT n OFFSET m` 巧合也被 PostgreSQL 支持所以未崩，但属于"配置错误但跑得起来"的潜在隐患。如果未来用 PG 方言专属优化（如 keyset pagination）需要正确 DbType。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：server/src/main/java/com/oa/backend/config/MybatisPlusConfig.java（在 P3-T01 重组后路径变为 com/oa/platform/shared/config/）。

动作步骤：
1. 把 `new PaginationInnerInterceptor(DbType.H2)` 改为 `new PaginationInnerInterceptor(DbType.POSTGRE_SQL)`；
2. mvn test 全绿（分页相关测试覆盖到分页 SQL 行为）；
3. 启动 spring boot dev profile 验证分页查询（如 GET /api/employees?page=1&size=10）能正常返回；
4. 检查 mvn dependency:tree 确认 mybatis-plus 含 PG 方言支持（默认含）。

完成阈值：
- 代码改为 DbType.POSTGRE_SQL；
- mvn test 全绿；
- 浏览器或 curl 验证分页 API 行为正常。

验收方式：QA Engineer 跑 mvn test + curl 分页接口。

---

## P2-T16：默认 profile 启动 V2 ON CONFLICT 兼容性问题

`[ ]` 待开始

依据：本机不指定 profile 跑 `mvn spring-boot:run` 时 spring boot 用默认配置启动 H2 内存数据库，但 V2_init_data.sql 含 PostgreSQL 专属 `ON CONFLICT (id) DO NOTHING` 语法，H2 解析报错崩溃。CLAUDE.md 已知 B-INFRA-01 issue。dev profile 用 PostgreSQL 没事、CI 用 PostgreSQL 没事，仅本机不带 profile 启动会崩。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：选其一——

方案 A（推荐，与 P2-T08 V1+V2 重写整合）：P2-T08b 写新 V2__seed_data.sql 时使用 H2/PG 双兼容语法。H2 1.4.200+ 支持 `MERGE INTO`，PostgreSQL 9.5+ 支持 `INSERT ... ON CONFLICT`。改用 ANSI SQL `MERGE` 或拆为两条独立 SQL（"插入若不存在"模式），两数据库都能解析。

方案 B：移除默认 profile 的 H2 自动激活逻辑，强制要求启动时显式指定 `-Dspring-boot.run.profiles=dev`。修改 application.yml 或 application-default.yml 让默认 profile 与 dev profile 行为一致（连 PostgreSQL）。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

动作步骤（方案 A 与 P2-T08b 整合）：
1. 在 P2-T08b 写新 V2__seed_data.sql 时用 H2/PG 双兼容语法；
2. 启动 spring boot 不指定 profile（默认）验证 V2 跑通不报错；
3. 启动 dev profile（PostgreSQL）也通过；
4. 启动 mock prod profile 也通过。

完成阈值：
- 新 V2 文件 H2 与 PostgreSQL 都能跑过；
- 三 profile 启动均成功。

验收方式：QA Engineer 跑三 profile 启动验证。

依赖关系：本任务与 P2-T08b 整合执行（不独立做）。如果选方案 B 则独立执行——本任务条目就是这条决策的承载位置。

---

## P2-T17：处理 Spring Boot 升级后 deprecation 警告

`[ ]` 待开始

依据：Spring Boot 3.2.11 → 3.5.12 升级后 `mvn compile` 输出含 "uses or overrides a deprecated API" 与 "unchecked operations" 警告，影响文件包括 ApprovalFlowService、FormService、EmployeeServiceImplTest 等。这些 deprecation 警告未来 SB 主版本（如 3.6 或 4.0）升级时会变成编译错误。当前阶段把它们清掉避免技术债积累。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：mvn compile 报警的所有 .java 文件。

动作步骤：
1. `cd server && mvn compile -Xlint:deprecation -Xlint:unchecked > /tmp/compile.log 2>&1` 收集所有 deprecation 与 unchecked 警告；
2. 按警告类型分组：
   - @MockBean → @MockitoBean（Spring Boot 3.4+ 推荐）
   - 其他 deprecated method → 查 Spring Boot 3.5 文档替代 API
   - unchecked 泛型 → 加显式类型参数或 @SuppressWarnings("unchecked") 含理由注释
3. 按文件批次修，每批 mvn compile 通过；
4. 全部修完后 mvn compile 输出无 deprecation 与 unchecked 警告（或仅剩有理由保留的）；
5. mvn test 全绿。

完成阈值：
- mvn compile 输出无未处理的 deprecation 警告；
- mvn test 全绿；
- 任何 @SuppressWarnings 都含 // reason: 注释说明为什么不能消除。

验收方式：QA Engineer 跑 mvn compile -Xlint:all + mvn test。

---

# Phase 3：平台代码按目录重组

## P3-T01：后端按 platform/<module> 重组目录

`[ ]` 待开始

依据：用户已确认平台模块按 platform/<module>/{controller,service,entity,mapper,dto}/ 三层包深度组织（决策来源：模块化重组方向）；当前按层平铺的 controller/service/entity/mapper 散包要改成按模块嵌套。

实现 agent：Backend Engineer + Technical Architect。审计 agent：QA Engineer。

改动范围：所有 server/src/main/java/com/oa/backend/ 下文件迁移到 com/oa/platform/<module>/{...}/，涉及 15 个 platform 模块（auth、employee、department、position、role、org、form、approval、notification、file_storage、config、operation_log、setup、module_registry、shared）。

动作步骤：
1. Technical Architect 出具完整路径映射表，输入清单通过以下命令生成：

```
find server/src/main/java/com/oa/backend -name "*.java" > /tmp/files-to-migrate.txt
wc -l /tmp/files-to-migrate.txt
```

按文件名映射到目标模块（例 AuthController.java → com/oa/platform/auth/controller/、EmployeeService.java → com/oa/platform/employee/service/、ApprovalFlowDef.java → com/oa/platform/approval/entity/）。整理为映射表 commit 到临时文件 `docs/migration-map.md`，迁移完成后删除；

2. Backend Engineer 按 15 个 platform 模块的顺序分批次迁移：shared → auth → employee → department → position → role → org → form → approval → notification → file_storage → config → operation_log → setup → module_registry。每批一个 commit，commit message 模板 `refactor(platform/<module>): move to platform package`；
3. 每批包括 git mv 文件 + 改 package 声明 + 改 import 路径；每批结束 `cd server && mvn compile && mvn test` 必须绿才能进下一批；
4. 全部 15 批迁移完成后更新 OaApplication 的 `@SpringBootApplication(scanBasePackages = "com.oa.platform")`；MybatisPlusConfig 的 `@MapperScan("com.oa.platform.**.mapper")`、`@EntityScan("com.oa.platform.**.entity")`；
5. `grep -rn "com.oa.backend" server/src` 输出为空；
6. 删除 docs/migration-map.md。

完成阈值：
- 所有源文件落到 com/oa/platform/<module>/<layer>/；
- grep 输出为空；
- mvn compile + mvn test 全绿；
- spring boot 启动正常。

验收方式：QA Engineer 跑 grep + mvn 命令 + 启动验证。

---

## P3-T02：MyBatis-Plus Mapper 扫描通配符化

`[ ]` 待开始

依据：模块化后 Mapper 散落各模块的 mapper 子包，需要通配符扫描；ArchUnit 强约束 Mapper 必须落在 mapper 子包。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- server/src/main/java/com/oa/platform/shared/config/MybatisPlusConfig.java（在 P3-T01 重组后路径）

动作步骤：
1. @MapperScan 改为 "com.oa.platform.**.mapper"（同时考虑未来 com.oa.modules.**.mapper，可写两条或一条 com.oa.**.mapper 通配）；
2. typeAliasesPackage 同步改为 "com.oa.**.entity"；
3. spring boot 启动验证所有 Mapper 仍能正确注册；
4. mvn test 全绿。

完成阈值：
- 配置已改；
- spring 启动无 missing bean 警告；
- 测试绿。

验收方式：QA Engineer 跑启动 + mvn test。

---

## P3-T03：前端按 modules/<name> 重组目录（h5 与 mp 同步）

`[ ]` 待开始

依据：前端与后端 platform 模块一一对应；用户已确认前端路由配置按最合理的方式改（决策来源：目录结构讨论第二点）；mp 与 h5 同步演进、两端永远平级（决策来源：mp 与 h5 同步演进原则）。

实现 agent：Frontend Engineer + Technical Architect。审计 agent：QA Engineer。

改动范围：

第一组（app/h5）：app/h5/pages/、components/、composables/、stores/、types/ 全部文件按 platform 模块归类迁移到 app/h5/modules/<name>/。

第二组（app/mp）：app/mp/src/pages/、components/、stores/、utils/、composables/ 全部平台保留代码按 platform 模块归类迁移到 app/mp/src/modules/<name>/，模块清单与 h5 完全对称。

动作步骤：
1. Technical Architect 出双端迁移映射表（h5 与 mp 各一份，模块清单一致）；
2. Frontend Engineer 分模块批次迁移（一次一个 platform 子模块，h5 与 mp 同 commit 提交保证两端同步）；
3. 每批结束两端各跑一次构建与测试必须绿。h5 端命令：`yarn workspace oa-h5 build` 与 `yarn workspace oa-h5 test`。mp 端命令：`yarn workspace oa-mp build:mp-weixin`（uni-app 编译微信小程序）与 `yarn workspace oa-mp test`。如 mp 工程未配置标准 build 脚本，先在 app/mp/package.json 加 `"build:mp-weixin": "vite build --mode mp-weixin"` 脚本；
4. h5 浏览器走查 + mp 端用微信开发者工具打开 dist/dev/mp-weixin 目录走查路由；mp 端 pages.json 路由表调整也在本任务一并完成（P3-T04 仅针对 h5 nuxt.config.ts）。

完成阈值：
- h5 与 mp 两端所有页面/组件落到各自的 modules/<name>/ 子目录；
- h5 顶层 pages/ 仅剩 login.vue 与 index.vue 或全部迁完；
- mp 端 pages.json 路由表完全指向 modules/<name>/pages/；
- 两端 build 与 test 全绿。

验收方式：QA Engineer 跑 build + test + 双端走查。

---

## P3-T04：前端 nuxt.config.ts 修改 pages 扫描路径

`[ ]` 待开始

依据：模块化后页面文件位于 modules/<name>/pages/ 下，需要 Nuxt 知道扫描这些路径作为路由源。

实现 agent：Frontend Engineer。审计 agent：QA Engineer。

改动范围：app/h5/nuxt.config.ts。

动作步骤：
1. 配置 dir.pages 字段或使用 pages:extend hook，让 Nuxt 扫描 modules/*/pages/ 作为路由源；
2. 保留原 pages/ 顶层壳的扫描（如有 login.vue、index.vue 等）；
3. yarn dev 启动后浏览器测试所有路由能正常解析（不止 modules 内的、还有 pages 顶层的）；
4. yarn build 通过。

完成阈值：
- 配置已改；
- 浏览器测试所有 platform 路由可访问；
- yarn build 绿。

验收方式：QA Engineer 走查 + build。

---

## P3-T05：补 ArchUnit 跨模块依赖规则

`[ ]` 待开始

依据：用户已确认跨模块通信走 CQRS-lite（决策来源：第三条）；ArchUnit 规则强约束防止业务模块未回填时被错误的耦合。

实现 agent：Backend Engineer + QA Engineer。审计 agent：QA Engineer 互审。

改动范围：server/src/test/java/com/oa/platform/shared/architecture/ArchitectureTest.java（在 P3-T01 重组后路径）。

动作步骤：
1. 补充以下 ArchUnit 规则（Java 代码样例）：

```java
@AnalyzeClasses(packages = "com.oa")
class ArchitectureTest {

  // 规则 1：controller 不准注入 mapper
  @ArchTest
  static final ArchRule controllers_should_not_use_mappers =
    noClasses().that().resideInAPackage("..controller..")
      .should().dependOnClassesThat().resideInAPackage("..mapper..");

  // 规则 2：mapper 必须在 .mapper 子包
  @ArchTest
  static final ArchRule mappers_in_mapper_package =
    classes().that().haveSimpleNameEndingWith("Mapper")
      .should().resideInAPackage("..mapper..");

  // 规则 3：entity 必须在 .entity 子包
  @ArchTest
  static final ArchRule entities_in_entity_package =
    classes().that().areAnnotatedWith("com.baomidou.mybatisplus.annotation.TableName")
      .should().resideInAPackage("..entity..");

  // 规则 4：DTO 必须在 .dto 子包（按命名约定 *Request/*Response/*Dto）
  @ArchTest
  static final ArchRule dtos_in_dto_package =
    classes().that().haveSimpleNameEndingWith("Request")
      .or().haveSimpleNameEndingWith("Response")
      .or().haveSimpleNameEndingWith("Dto")
      .should().resideInAPackage("..dto..");

  // 规则 5：service 实现类必须以 ServiceImpl 结尾
  @ArchTest
  static final ArchRule service_impls_naming =
    classes().that().resideInAPackage("..service.impl..")
      .should().haveSimpleNameEndingWith("ServiceImpl");

  // 规则 6：跨业务模块只允许通过 api 子包通信（业务模块未回填时此规则空跑、为未来强制）
  @ArchTest
  static final ArchRule cross_module_only_via_api =
    noClasses().that().resideInAPackage("com.oa.modules.(*)..")
      .should().dependOnClassesThat()
      .resideInAnyPackage("com.oa.modules.(*).service..", "com.oa.modules.(*).mapper..", "com.oa.modules.(*).internal..")
      .as("Modules can only depend on each other's api package");

  // 规则 7：domain event 命名与位置约束
  @ArchTest
  static final ArchRule domain_events_named_and_placed =
    classes().that().haveSimpleNameEndingWith("Event")
      .should().resideInAPackage("..event..");
}
```

2. 故意建临时违规样例（如 com/oa/platform/__archtest__/Bad.java 在 controller 包内注入 mapper）跑 mvn test 验证规则能检出，验证后删除样例；
3. mvn test 全绿（含 7 条 ArchUnit 规则）。

完成阈值：
- 规则齐全；
- 故意违规验证通过；
- 测试绿。

验收方式：QA Engineer 跑 mvn test + 故意违规验证。

---

## P3-T06：迁移测试到模块就近位置

`[ ]` 待开始

依据：文档就近原则（决策来源：第七条），测试与代码同模块、镜像目录结构。

实现 agent：QA Engineer + Backend Engineer。审计 agent：QA Engineer 互审。

改动范围：server/src/test/java 内所有测试按对应被测代码的新模块路径同步迁移（与 P3-T01 配套）。

动作步骤：
1. 与 P3-T01 同批次提交（每个 platform 模块的 main 与 test 一同迁移）；
2. mvn test 全绿。

完成阈值：
- 测试目录结构镜像 main；
- mvn test 全绿。

验收方式：QA Engineer 跑 mvn test + 目录结构对比。

---

## P3-T07：模块就近测试设计文档骨架

`[ ]` 待开始

依据：用户已确认每个模块 README 必含测试设计章节六要素（决策来源：第七条），且测试设计放在该模块自己的 test 子目录里。

实现 agent：QA Engineer。审计 agent：QA Engineer 自审。

改动范围：每个 platform 模块的 `server/src/test/resources/com/oa/platform/<module>/TEST_DESIGN.md` 创建 TEST_DESIGN.md（放 resources 而非 java 包，因为 Markdown 不属于 Java 源码、放 resources 更符合 Maven 项目布局约定）。

动作步骤：
1. 15 个 platform 模块各创建一份 TEST_DESIGN.md；
2. 每份按测试设计六要素（范围、场景、依赖隔离、数据准备、覆盖率、验收标准）写空骨架（六个标题 + 每个标题下"待 Phase 5/6 填充"占位）；
3. 文件路径规则：在 `server/src/test/resources/com/oa/platform/<module>/TEST_DESIGN.md`（resources 子目录下镜像 java 包路径，便于 IDE 导航且符合 Maven 约定）。

完成阈值：
- 15 份 TEST_DESIGN.md 齐全；
- 内容骨架包含六要素的标题占位。

验收方式：QA Engineer 跑 find 命令计数 + 抽查内容。

---

## P3-T08：CI workflow 适配新包结构

`[ ]` 待开始

依据：P3-T01 把后端代码从 com.oa.backend 搬到 com.oa.platform 与 com.oa.modules 后，CI 配置中所有路径硬编码（ArchUnit 测试 jar 路径、SonarQube 扫描路径、覆盖率报告路径等）会失效；如不同步改 CI 跑废、PR 合不进 main。本任务必须与 P3-T01 同 PR 内提交，避免 CI 红灯期。

实现 agent：DevOps Engineer。审计 agent：QA Engineer。

改动范围：
- .github/workflows/ci.yml
- .github/workflows/fast-check.yml
- .github/workflows/release.yml
- sonar-project.properties
- 任何其他含 com.oa.backend 路径的 CI 配置文件

动作步骤：
1. `grep -rn "com.oa.backend\|server/src/main/java/com/oa/backend" .github/ sonar-project.properties` 列出所有命中位置；
2. 逐个把硬编码路径改为新包结构——com.oa.backend → com.oa.platform 或 com.oa.modules（按文件实际功能判断），路径 server/src/main/java/com/oa/backend 改为 server/src/main/java/com/oa（或更精确的子路径如 com/oa/platform、com/oa/modules、com/oa/dev_tools）；
3. ArchUnit 测试启动配置（如 jar 路径）随之更新；
4. SonarQube 的 sonar.sources、sonar.tests、sonar.coverage.exclusions 等属性更新；
5. 推一个测试 PR 到 GitHub 验证 CI 跑通（mvn test、ArchUnit、SonarQube、Snyk 全绿）。

完成阈值：
- `grep -rn "com.oa.backend\|server/src/main/java/com/oa/backend" .github/ sonar-project.properties` 输出为空；
- GitHub Actions 所有 jobs 绿；
- SonarQube 报告能正确生成。

验收方式：QA Engineer 推一个 dummy commit 触发 CI，看所有 jobs 状态。

---

## P3-T09：业务关键字扫描脚本统一化

`[ ]` 待开始

依据：P1-T12、P2-T06、P9-T01 等多个任务都做"grep 业务关键字 + 排除若干路径"的扫描，每个任务自定义排除规则存在不一致风险。封装为单一脚本可保证扫描结果在所有调用方一致。

实现 agent：DevOps Engineer。审计 agent：QA Engineer。

改动范围：
- 新建：tools/scripts/scan_business_residual.sh
- 新建：tools/scripts/README.md（说明此目录所有脚本的用途与运行方式）
- 改动：TODO.md 中 P1-T12、P2-T06、P9-T01 三个任务的"动作步骤"中扫描命令改为调脚本

动作步骤：
1. 新建 tools/scripts/scan_business_residual.sh，内容含完整 grep 命令 + 完整白名单：

```bash
#!/usr/bin/env bash
# 扫描全仓库的业务关键字残留
# 退出码 0 = 干净；非零 = 有命中（命中行已输出到 stdout）

KEYWORDS="attendance|payroll|expense|project|injury|signature|leave|overtime|construction|aftersale|material_delegation|payslip"

EXCLUDES=(
  --include="*.java"
  --include="*.ts"
  --include="*.vue"
  --include="*.sql"
  --include="*.yml"
  --include="*.yaml"
  --exclude-dir=node_modules
  --exclude-dir=.git
  --exclude-dir=target
  --exclude-dir=docs
  --exclude-dir=modules
  --exclude=ARCHITECTURE.md
  --exclude=TODO.md
)

result=$(grep -rEn "${KEYWORDS}" "${EXCLUDES[@]}" . 2>/dev/null)
if [ -z "$result" ]; then
  echo "PASS: no business keyword residual"
  exit 0
else
  echo "FAIL: found business keyword residual:"
  echo "$result"
  exit 1
fi
```

2. `chmod +x tools/scripts/scan_business_residual.sh`；
3. 写 tools/scripts/README.md：列出本目录所有脚本（当前一份），每份脚本的用途、输入输出、退出码语义、调用方式；
4. 改 P1-T12 任务的"动作步骤第 1 步"中的 grep 命令为 `bash tools/scripts/scan_business_residual.sh`；
5. 改 P2-T06 任务的"动作步骤第 1 步"中的 grep 命令为同上；
6. 改 P9-T01 任务的"动作步骤第 1 步"中的 grep 命令为同上；
7. 干净基座（mock）上跑脚本退出码 0；故意建一个含 LEAVE 关键字的临时 java 文件、再跑脚本退出码非零、命中清单含此文件；删除临时文件后再跑退出码 0。

完成阈值：
- 脚本就位、可执行；
- 三个调用方任务描述中的扫描命令已替换；
- 三组验收命令均按预期。

验收方式：QA Engineer 跑三组验证（干净/有命中/移除后干净）。

---

## P3-T10：应用配置三 profile 一致性检查

`[ ]` 待开始

依据：application.yml、application-dev.yml、application-test.yml、application-prod.yml 四份配置在多个任务中被改动（P2-T09、P2-T10、P0-T01 等），每份配置的字段集与 profile 间差异需要明确并验证一致性，避免漂移导致某 profile 启动失败或行为不一致。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- 新建：docs/architecture/config_baseline.md（配置基线对照文档）
- 新建：server/src/test/java/com/oa/platform/shared/config/ConfigConsistencyTest.java（启动时验证配置一致性的测试）
- 检查并修订：server/src/main/resources/application.yml、application-dev.yml、application-test.yml、application-prod.yml

动作步骤：
1. 通读四份 application*.yml，列出每份的所有顶级键与子键，整理成一张对照矩阵：每行是一个配置项、每列是一个 profile、单元格是该 profile 下的值（或"未定义"）；
2. 把对照矩阵写入 docs/architecture/config_baseline.md，含每个配置项的"必填 vs 可选"标注、"prod 必填项 vs dev 可缺省项"分类、ENV 注入项清单；
3. 修订四份 application.yml 让它们符合矩阵预期——dev profile 的 H2 默认配置完整、prod profile 所有 ENV 引用无 fallback、test profile 与 dev 共用大部分配置但隔离数据库连接；
4. 写 ConfigConsistencyTest.java：启动时读 Spring Environment、断言每个 profile 下必填项已设、prod profile 下无 fallback；
5. 跑 mvn test 验证三 profile 启动均通过、ConfigConsistencyTest 绿。

完成阈值：
- docs/architecture/config_baseline.md 含完整对照矩阵；
- 三 profile 配置实际值与矩阵一致；
- ConfigConsistencyTest 在三 profile 下都通过；
- mvn test 全绿。

验收方式：QA Engineer 通读对照文档 + mvn test 跑通。

---

# Phase 4：新基座规范落地

## P4-T01：异常类层级 + ProblemDetail 输出

`[ ]` 待开始

依据：用户已确认错误码体系采用方案 A（基座异常框架 + 错误码命名空间 + ProblemDetail）；命名空间式错误码（如 PAYROLL.CYCLE_LOCKED）让每个模块管自己的错误码字典。

实现 agent：Backend Engineer + Technical Architect。审计 agent：QA Engineer。

前置依赖：P3-T01 后端按 platform/<module> 重组完成（路径在 com/oa/platform/shared/exception/ 下）。本任务必须在 P3-T01 之后执行。

改动范围：
- 新增异常类：server/src/main/java/com/oa/platform/shared/exception/ResourceNotFoundException.java、PermissionDeniedException.java、ConflictException.java、ValidationException.java（BusinessException 已存在作为基类）
- 改写：server/src/main/java/com/oa/platform/shared/exception/GlobalExceptionHandler.java（输出 ProblemDetail RFC 7807 格式）
- 新增：server/src/main/java/com/oa/platform/shared/exception/ProblemDetailFactory.java
- 文档：ARCHITECTURE.md 新增"错误码体系"章节由 P5-T02 完成（本任务先在代码层落地，文档章节在 P5-T02 时基于本任务的实现总结）

动作步骤：
1. 写五个异常类（每个继承 BusinessException 抽象基类），每个携带 errorCode 字段、message、details 字段（Map<String,Object>）。基类签名草稿：

```java
public abstract class BusinessException extends RuntimeException {
  private final String errorCode;       // 命名空间.CODE 字符串
  private final Map<String,Object> details;
  public abstract HttpStatus httpStatus();
}
public class ResourceNotFoundException extends BusinessException { /* 404 */ }
public class PermissionDeniedException extends BusinessException { /* 403 */ }
public class ConflictException extends BusinessException { /* 409 */ }
public class ValidationException extends BusinessException { /* 400 */ }
```

2. GlobalExceptionHandler 改写：捕获每种异常映射到对应 HTTP 状态（404/403/409/400/500），调用 ProblemDetailFactory 构造响应。响应 JSON 结构（RFC 7807 + 自定义 extensions）：

```json
{
  "type": "https://boyuan-oa.local/errors/PLATFORM.AUTH.UNAUTHORIZED",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Token expired",
  "instance": "/api/employees/42",
  "errorCode": "PLATFORM.AUTH.UNAUTHORIZED",
  "timestamp": "2026-05-06T10:23:45Z",
  "traceId": "abc-123-def",
  "details": { "any": "extra fields" }
}
```

`type` 字段是错误码 URL 化的命名空间（不必真访问到，仅作唯一标识），`errorCode` 字段是字符串便于前端 i18n key 查表，`traceId` 由 TraceIdFilter 注入。

3. 错误码命名空间约定：基座为 `PLATFORM.<MODULE>.<CODE>`（如 PLATFORM.AUTH.UNAUTHORIZED、PLATFORM.EMPLOYEE.NOT_FOUND）、业务为 `<MODULE>.<CODE>`（如 PAYROLL.CYCLE_LOCKED）；本任务先定基座命名空间常量类 `com/oa/platform/shared/exception/PlatformErrorCodes.java` 含约 20 个常用基座 code（UNAUTHORIZED、FORBIDDEN、TOKEN_EXPIRED、RESOURCE_NOT_FOUND、VALIDATION_FAILED、CONFLICT、RATE_LIMIT_EXCEEDED、INTERNAL_ERROR 等）；业务命名空间在业务模块回填时各自定；
4. 单测覆盖每种异常的映射结果（5 个异常 × 至少 2 场景 = 10 个测试方法）；
5. 启动后 curl 触发故意错误（如 GET /api/employees/9999999）验证 ProblemDetail 响应结构含上述全部字段。

完成阈值：
- 五个异常类 + ProblemDetailFactory + PlatformErrorCodes 常量类落地；
- GlobalExceptionHandler 输出符合上述 JSON schema 的 ProblemDetail；
- 单测全绿；
- curl 抽查 4 种 HTTP 状态（401/403/404/400）响应结构均符合 schema。

验收方式：QA Engineer 跑 mvn test + curl 抽查 + JSON schema validator 校验响应结构。

---

## P4-T02：跨模块通信契约 + ArchUnit 强约束

`[ ]` 待开始

依据：用户已确认 CQRS-lite 模式（读 Facade 同步 + 写 AFTER_COMMIT 事件），ArchUnit 强约束禁止跨模块直接 service 注入与 SQL JOIN。当前没有业务模块，规则先写死、留给业务模块回填时被强制约束。

实现 agent：Backend Engineer + Technical Architect。审计 agent：QA Engineer。

改动范围：
- 文档：ARCHITECTURE.md 新增"模块通信契约"章节（在 P5-T02 完成主体）
- ArchUnit 测试：server/src/test/java/com/oa/platform/shared/architecture/ArchitectureTest.java 新增规则

动作步骤：
1. 文档章节写明：
   - 跨模块同步读必须通过对方模块的 Facade 接口（位于 modules.<x>.api 子包），禁止直接注入对方 service；
   - 跨模块异步写必须通过 Spring ApplicationEvent + @TransactionalEventListener(phase=AFTER_COMMIT)；
   - 禁止跨模块 SQL JOIN；
   - 禁止跨模块直接调用 mapper；
2. ArchUnit 规则补充：
   - classes().that().resideInAPackage("..modules.X..").should().onlyAccessClassesThat().resideOutsideOfPackages("..modules.Y.internal..", "..modules.Y.service..", "..modules.Y.mapper..")（X != Y）；
   - 强制 Domain Event 类必须以 Event 结尾且位于 modules.X.event 子包；
3. 故意建临时 modules/test_a 与 modules/test_b 写违规代码验证规则能检出，验证后清理临时样例；
4. mvn test 全绿。

完成阈值：
- ArchUnit 规则就位；
- 故意违规检出验证；
- 临时样例已清理；
- mvn test 全绿。

验收方式：QA Engineer 跑 mvn test。

---

## P4-T03：platform/setup 改造为引擎 + SetupStep SPI

`[ ]` 待开始

依据：用户已确认 setup 引擎归 platform/setup（决策来源：架构 P0 第一项 选项 A），业务初始化步骤通过 SetupStep SPI 由各模块各自实现；总经理改为默认必选（决策来源：第十五条）。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- 改写：com/oa/platform/setup/service/SetupService.java（拆出业务初始化、保留协调）
- 新增：com/oa/platform/setup/api/SetupStep.java（SPI 接口）
- 新增：com/oa/platform/setup/service/SetupStepRegistry.java
- 改写：com/oa/platform/setup/controller/SetupController.java（按 SPI 编排）
- 内置 platform 步骤：CompanyNameStep、AdminAccountStep、GeneralManagerStep（第十五条）等（这些算是 platform 内部步骤，不走外部 SPI 而是直接注册）

动作步骤：
1. 定义 SetupStep 接口与 SetupContext，签名草稿：

```java
package com.oa.platform.setup.api;

public interface SetupStep {
  int order();                                      // 步骤顺序，小先大后
  String stepKey();                                 // 唯一标识，例 "company-name"
  String displayName();                             // 中文标题，例 "设置企业名称"
  StepExecutionResult execute(SetupContext ctx);    // 执行该步骤
  ValidationResult validate(SetupContext ctx);      // 校验输入
  boolean isCompleted();                            // 当前是否已完成
}

public class SetupContext {
  private final Long currentUserId;                 // 操作员（首装时通常为初始 admin）
  private final Map<String,Object> params;          // 步骤入参（前端表单数据）
  private final SetupSession session;               // 跨步骤共享状态（含 finalizeToken 等）
  // getters
}

public record StepExecutionResult(boolean success, String message, Map<String,Object> output) {}
public record ValidationResult(boolean valid, List<String> errors) {}
```

2. SetupStepRegistry 在启动时通过 Spring 自动收集所有 SetupStep bean，按 order 排序，提供 listSteps() 与 findByKey() 查询方法；
3. SetupController 暴露端点：

```
GET  /api/setup/steps                       # 列出所有步骤与状态
GET  /api/setup/steps/{key}                  # 获取单步详情
POST /api/setup/steps/{key}/execute         # 执行某步骤（body 是该步骤的 params）
POST /api/setup/finalize                    # 全部步骤完成后落定
```

4. 实现 platform 内置步骤：CompanyNameStep（order=10，写 system_config 公司名）、AdminAccountStep（order=20，建第一个管理员）、GeneralManagerStep（order=30，强制至少一个 general_manager 账号）、DefaultPasswordStep（order=40，HR/CEO 设置 security.default_password 含强度校验、isCompleted 实现为 system_config 中该 key 非空且非空字符串）；
5. 改 wizard_finalize_state 表的逻辑：finalize 前必须所有 SetupStep 的 isCompleted 都为 true，否则返回 400 + ProblemDetail 含未完成步骤清单；
6. 修复 wizardFinalizeToken 设计缺陷：token 生成时返回原文给客户端 + 立即 SHA-256 哈希入库；校验时把用户回传明文 SHA-256 后跟数据库哈希比对；wizard_finalize_state 表新增 `finalize_token_hash` 字段（VARCHAR(64) 存 SHA-256 hex）+ 删除原 `finalize_token` 字段。schema 改动随 P2-T08 V1 重写一并落实；
7. 单测覆盖：registry 按 order 排序、step 执行成功/失败、finalize 校验全部 step 通过、跳过 GeneralManagerStep 或 DefaultPasswordStep 时 finalize 拒绝、SHA-256 token 哈希校验（明文匹配/不匹配/空）；
8. 浏览器走查：sys_admin 重置后能完整走完首装含设置默认密码与总经理账号。

完成阈值：
- SetupStep SPI 落地；
- 内置三步骤工作；
- 跳过 GeneralManagerStep 时 finalize 返回 400；
- 单测全绿；
- 浏览器走查通过。

验收方式：QA Engineer 跑 mvn test + 浏览器走查。

---

## P4-T04：platform/role 数据保证总经理默认必选

`[ ]` 待开始

依据：用户已确认总经理改为默认必选（第十五条）；本任务在 P2-T08 V2 种子数据已落实"general_manager 角色 + gm.demo 默认账号"基础上，补 setup 向导的运行时校验。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- 与 P4-T03 SetupStep SPI 联动，新增 GeneralManagerStep（已在 P4-T03 列出）。
- DESIGN 文档同步：P5-T03/T04 撰写 platform/role 与 platform/setup README 时去掉"总经理可选"措辞。

动作步骤：
1. GeneralManagerStep.isCompleted 实现为：检查 sys_user 表是否有至少一个 employee 绑定 general_manager 角色；
2. SetupController.finalize 校验：所有 step 都 isCompleted 才允许 finalize，否则返回 400 + ProblemDetail with errorCode PLATFORM.SETUP.GENERAL_MANAGER_REQUIRED；
3. 单测：跳过 GeneralManagerStep 直接调 finalize 返回 400；
4. JDBC 验证 fresh init 后 V2 种子已建 gm.demo 与角色绑定。

完成阈值：
- 校验逻辑就位；
- 单测覆盖；
- JDBC 验证通过。

验收方式：QA Engineer 跑 mvn test + JDBC 查询。

---

## P4-T05：platform/file_storage 模块脚手架（attachment + retention 合并）

`[ ]` 待开始

依据：用户已确认 platform/attachment 与 platform/retention 合并为 platform/file_storage，含五子模块 file_io、retention_policy、expiry_warning、extension、cleanup（决策来源：file_storage 子模块设计）；附件鉴权委托业务记录鉴权（决策来源：清理决策第三项 选项 D）；DB 数据清理通过 SPI 委托业务模块（决策来源：清理决策第四项）。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- 新建 com/oa/platform/file_storage/ 目录与五子模块（file_io、retention_policy、expiry_warning、extension、cleanup）的 controller/service/entity/mapper/dto/api 子包；
- 把原 platform/attachment（在 P3-T01 已迁移到 com/oa/platform/attachment/）的代码迁入 file_storage/file_io/；
- 把原 platform/retention（同上）的代码按职责分到 file_storage/retention_policy、expiry_warning、extension、cleanup；
- 新增 SPI：com/oa/platform/file_storage/file_io/api/BusinessRecordAccessChecker.java
- 新增 SPI：com/oa/platform/file_storage/cleanup/api/RetentionCleanupHandler.java
- 默认 stub 实现：DefaultDenyAccessChecker、NoOpCleanupHandler

SPI 接口签名草稿：

```java
package com.oa.platform.file_storage.file_io.api;

public interface BusinessRecordAccessChecker {
  String sourceType();  // 关联业务记录类型，例 "FORM_RECORD"、"PAYROLL_SLIP"
  boolean canAccess(Long sourceId, AuthenticatedUser user);
}

public class DefaultDenyAccessChecker implements BusinessRecordAccessChecker {
  @Override public String sourceType() { return "*"; }     // 兜底
  @Override public boolean canAccess(Long id, AuthenticatedUser u) { return false; }
}

package com.oa.platform.file_storage.cleanup.api;

public interface RetentionCleanupHandler {
  String dataType();                                    // 处理的数据类型，例 "FORM_RECORD"
  CleanupReport cleanupExpired(LocalDate beforeDate);   // 清理 beforeDate 之前过期记录
}

public record CleanupReport(int deletedCount, long bytesFreed, List<String> errors) {}

public class NoOpCleanupHandler implements RetentionCleanupHandler {
  @Override public String dataType() { return "*"; }
  @Override public CleanupReport cleanupExpired(LocalDate d) { return new CleanupReport(0, 0L, List.of()); }
}
```

动作步骤：
1. 建五子模块目录骨架；
2. 把 attachment 代码迁入 file_io 子模块、调整 import；
3. 把 retention 代码按职责分到四个子模块；
4. 写两个 SPI 接口（按上面签名）与 stub 实现；
5. AttachmentAccessService 改造：注入 List<BusinessRecordAccessChecker>，按 sourceType 路由到对应 checker 询问是否可访问；找不到匹配 checker 默认拒绝；
6. RetentionService 改造：cleanup 调度改为遍历 List<RetentionCleanupHandler>，按 dataType 调用 cleanupExpired，汇总结果；
7. 单测覆盖 file_io 上传下载、retention_policy 配置读写、expiry_warning 扫描逻辑（mock 时间）、extension 延期请求、cleanup 调度（mock SPI 列表测试路由与汇总）；
8. 启动后 curl 验证文件上传下载（无业务 checker 注册时下载默认 403、验证 stub 工作正常）。

完成阈值：
- 五子模块各自能独立编译跑单测；
- 与外部模块依赖只通过 SPI；
- ArchUnit 检查通过；
- mvn test 全绿；
- curl 上传 200、下载 403（stub 拒绝）。

验收方式：QA Engineer 跑 mvn test + curl + ArchUnit 检查。

---

## P4-T06：platform/config 重写为新基座 ConfigController

`[ ]` 待开始

依据：本任务在 P2-T04 删除旧 SystemConfigController 基础上，按 P3-T01 重组后的路径在 com/oa/platform/config/ 下重建 ConfigController；按方案二只暴露通用 K-V 操作。

实现 agent：Backend Engineer。审计 agent：QA Engineer。

改动范围：
- 新建：com/oa/platform/config/controller/ConfigController.java（已在 P2-T04 创建过，本任务在新位置确认）
- 调整：com/oa/platform/config/service/ConfigService.java 与 ConfigServiceImpl.java
- 调整：com/oa/platform/config/entity/SystemConfig.java（确保 namespace、key、value、version、updated_at、updated_by 字段齐全）

动作步骤：
1. 确认在 P3-T01 重组后路径正确；
2. 端点 DTO 定义：

```java
// PUT /api/config/{namespace}/{key} body
public record ConfigUpsertRequest(String value, Long expectedVersion) {}
// 响应（GET /api/config/{namespace}/{key}）
public record ConfigItemResponse(
  String namespace, String key, String value,
  Long version, Instant updatedAt, Long updatedBy
) {}
// 响应（GET /api/config/{namespace}）
public record ConfigNamespaceResponse(String namespace, List<ConfigItemResponse> items) {}
// 响应（GET /api/config/namespaces）
public record NamespacesResponse(List<String> namespaces) {}
```

`expectedVersion` 字段用于乐观锁（PUT 时若数据库 version 与请求 expectedVersion 不一致则返回 409 ConflictException）；首次创建时 expectedVersion=null；更新已有记录则必填。

3. 适配 P4-T01 的 ProblemDetail 格式：错误响应统一走 GlobalExceptionHandler，错误码命名空间 PLATFORM.CONFIG.<CODE>，常用 code：NAMESPACE_NOT_FOUND、KEY_NOT_FOUND、VERSION_MISMATCH、READ_DENIED、WRITE_DENIED；
4. 实现按 key 的读权限矩阵——选 enum 常量方式（不建表）。新建 `com/oa/platform/config/security/ConfigKeyPermissions.java` 含静态 Map 声明每个内置 key 的读写角色：

```java
public final class ConfigKeyPermissions {
  private static final Map<String, KeyAcl> ACL = Map.of(
    "security.default_password", new KeyAcl(Set.of("CEO","HR"), Set.of("CEO","HR")),
    "company.name",              new KeyAcl(Set.of("*"), Set.of("CEO")),
    "data.retention.days",       new KeyAcl(Set.of("CEO","HR"), Set.of("CEO","HR")),
    // ... 其他基座 key
  );
  public static KeyAcl get(String fullKey) {
    return ACL.getOrDefault(fullKey, KeyAcl.DEFAULT);  // 默认所有已认证用户可读、CEO 可写
  }
  public record KeyAcl(Set<String> readRoles, Set<String> writeRoles) {
    public static final KeyAcl DEFAULT = new KeyAcl(Set.of("*"), Set.of("CEO"));
  }
}
```

ConfigController 在响应任何 GET/PUT 前查 ACL 表做角色校验。`*` 代表任意已认证用户；具体角色名为 sys_role.role_code。

5. 单测覆盖：GET 单 key 200、GET namespace 200、GET namespaces 200、PUT 创建 200/201、PUT 更新 200、PUT version 不匹配 409、未授权 401、普通员工 GET security.default_password 403、CEO PUT 任意 key 200；
6. operation_log 表中能查到配置变更记录（变更前值、变更后值、操作人、时间）。

完成阈值：
- 接口落地；
- 单测全绿；
- ProblemDetail 响应；
- operation_log 可见。

验收方式：QA Engineer 跑 mvn test + curl + JDBC 查 operation_log。

---

## P4-T07：platform/module_registry 子模块骨架

`[ ]` 待开始

依据：用户已选 B（渐进式：本轮 module_registry 仅留骨架与 README，registry 真实实现延后到第一个业务模块回填时一起做）。

实现 agent：Backend Engineer + Frontend Engineer。审计 agent：QA Engineer。

改动范围：
- 后端：新建 com/oa/platform/module_registry/api/BusinessModule.java（SPI 接口，方法签名包含 menuContributions、permissionContributions、eventContributions、configSchemaContributions）
- 后端：新建 com/oa/platform/module_registry/service/ModuleRegistry.java（启动时扫 BusinessModule 实现，提供查询，本轮空实现因为没业务模块）
- 后端：新建 com/oa/platform/module_registry/controller/ModuleRegistryController.java（暴露 GET /api/platform/modules，本轮返回空 JSON 数组）
- 前端：新建 app/h5/modules/module_registry/module.config.ts（manifest 类型定义）
- 前端：新建 app/h5/modules/module_registry/composables/useModuleRegistry.ts（暂时返回空数组）
- 文档：com/oa/platform/module_registry/README.md（写 SPI 设计与未来扩展点）
- 测试：com/oa/platform/module_registry/TEST_DESIGN.md

动作步骤：
1. 写 BusinessModule SPI 接口（后端），签名草稿：

```java
package com.oa.platform.module_registry.api;

public interface BusinessModule {
  String moduleKey();                                // 唯一标识，例 "payroll"
  String displayName();                              // 中文名，例 "薪资管理"
  String version();                                  // 模块版本（语义版本 SemVer）
  List<MenuContribution> menuContributions();        // 贡献的菜单条目
  List<PermissionContribution> permissionContributions();  // 贡献的角色路径权限
  List<EventTopic> eventContributions();             // 模块发布或订阅的事件主题
  List<ConfigSchema> configSchemaContributions();    // 注册的 system_config schema
}

public record MenuContribution(
  String key,           // 菜单 key，例 "/payroll/cycle"
  String label,         // 中文名
  String path,          // 路由路径
  Set<String> roles,    // 哪些角色看到
  String group,         // 菜单分组，例 "工作"
  int order             // 排序权重
) {}

public record PermissionContribution(String pathPattern, Set<String> roles) {}

public record EventTopic(String topicName, String mode /* PUBLISH / SUBSCRIBE */) {}

public record ConfigSchema(String namespace, String key, String type, Object defaultValue, Set<String> readRoles, Set<String> writeRoles) {}
```

2. ModuleRegistry bean：启动时通过 Spring `@Autowired List<BusinessModule>` 注入所有实现，按 moduleKey 索引存 Map；本轮无任何 BusinessModule 实现，registry 实际为空 Map；提供 listModules()、findByKey(key) 查询方法；
3. ModuleRegistryController：暴露 `GET /api/platform/modules`，返回 `List<BusinessModuleManifest>`（manifest 是 BusinessModule 的对外快照 JSON）；本轮返回空数组 `[]`；
4. 前端 module.config.ts：定义 TypeScript 类型镜像后端 BusinessModule 与 ManifestContribution，字段对齐；

```typescript
export interface ModuleManifest {
  moduleKey: string
  displayName: string
  version: string
  menuContributions: MenuContribution[]
  permissionContributions: PermissionContribution[]
  eventContributions: EventTopic[]
  configSchemaContributions: ConfigSchema[]
}
// MenuContribution 等接口定义同后端字段
```

5. 前端 useModuleRegistry composable：调 GET /api/platform/modules 并缓存到 Pinia store，本轮永远返回空数组；
6. 写 README.md（按 P5-T04 后端模板三章 + 前端 module_registry 也写一份按七章模板的 README）与 TEST_DESIGN.md（六要素）；
7. 单测覆盖：后端 ModuleRegistry 注入空列表时 listModules() 返回空 + GET 端点 200；前端 useModuleRegistry 返回空数组。

完成阈值：
- 接口与骨架就位；
- 单测全绿；
- 文档齐全。

验收方式：QA Engineer 跑 mvn test + yarn test + 文档抽查。

---

## P4-T08：layouts/default.vue 清硬编码业务菜单

`[ ]` 待开始

依据：用户已选 B（渐进式：layouts 改造时机延后；本轮只清硬编码业务条目，保留 platform 模块菜单条目仍硬编码）。

实现 agent：Frontend Engineer。审计 agent：QA Engineer。

改动范围：app/h5/modules/.../layouts/default.vue 中的 ROLE_MENUS 常量（在 P3-T03 重组后路径，可能落 modules/auth 或独立 modules/shell）。

动作步骤：
1. 删除指向已删业务页的菜单条目（/data_export、/data_viewer 等）；
2. 删除 /team 菜单条目（platform/team 已删）；
3. 保留 platform 模块的菜单条目硬编码（工作台、个人中心、员工、组织、岗位、角色、通知、操作日志、系统配置、首装、待办通用骨架）；
4. 菜单文案不出现具体业务名词（请假、加班、报销、薪资、项目、工伤）；
5. yarn build 通过、5 个测试用户走查菜单显示符合预期。

完成阈值：
- `grep -E "请假|加班|报销|薪资|项目|工伤|leave|overtime|expense|payroll|project|injury|attendance|signature" app/h5/modules/.../layouts/default.vue` 输出为空；
- yarn build 绿；
- 浏览器走查通过。

验收方式：QA Engineer 跑 grep + build + 浏览器走查。

---

## P4-T09：middleware/auth.global.ts 清硬编码业务路径

`[ ]` 待开始

依据：与 P4-T08 配套；同样按 B 渐进式只清业务部分。

实现 agent：Frontend Engineer。审计 agent：QA Engineer。

改动范围：app/h5/middleware/auth.global.ts（在 P3-T03 后位置确认）的 PAGE_ACCESS 常量。

动作步骤：
1. 删除指向已删业务页的路径条目；
2. 删除 /team 条目；
3. 保留 platform 路径硬编码；
4. 5 个测试用户登录后访问 platform 路径通畅、访问已删业务路径跳 404 或登录页。

完成阈值：
- grep 业务关键字输出为空；
- 浏览器走查通过。

验收方式：QA Engineer 跑 grep + 浏览器走查。

---

## P4-T10：pages/workbench/index.vue 清硬编码业务卡片

`[ ]` 待开始

依据：与 P4-T08/T09 配套。

实现 agent：Frontend Engineer。审计 agent：QA Engineer。

改动范围：app/h5/modules/workbench/pages/index.vue（在 P3-T03 重组后路径）。

动作步骤：
1. 删除"快速请假""快速加班""快速报销"等业务跳转卡片；
2. 保留"我的资料""设置"等 platform 跳转卡片，或显示"暂无快捷入口"占位；
3. 5 个测试用户工作台均可正常显示，无 console error。

完成阈值：
- 工作台不出现任何业务跳转链接；
- 浏览器走查通过。

验收方式：QA Engineer 跑浏览器走查。

---

# Phase 5：文档与目录骨架

## P5-T01：根目录 README.md 重写

`[ ]` 待开始

依据：用户已确认文档分级——根 README 是项目总纲（功能介绍 + 架构思路 + 全模块超链接索引）；架构思路核心是"后端定业务、前端薄渲染"。

实现 agent：Technical Architect + Orchestrator。审计 agent：QA Engineer。

改动范围：根目录 README.md（覆盖现有内容）。

动作步骤：
1. 写整体功能介绍（一段：博渊建工 OA、单租户独立部署、PC 端 + 微信小程序、覆盖人事/审批/通知/附件/配置等基座能力 + 计划回填的业务模块）；
2. 写架构思路（薄客户端 + 后端定业务、模块插拔 + ModuleRegistry SPI、CQRS-lite + ACL Facades + Domain Events、单租户 + 二次开发模式、文档就近原则、错误码命名空间）；
3. 写超链接索引（指向 ARCHITECTURE.md、各 platform 与业务模块 README）；
4. 链接全部相对路径，不出现损坏链接。

完成阈值：
- README 包含三大要素；
- 超链接全部有效。

验收方式：QA Engineer 通读 + 抽查链接 + 用户最终确认。

---

## P5-T02：ARCHITECTURE.md 重写

`[ ]` 待开始

依据：用户已确认 ARCHITECTURE.md 作为根级独立文档承载跨切面架构信息（决策来源：目录结构讨论第一点）。

实现 agent：Technical Architect。审计 agent：QA Engineer。

改动范围：根目录 ARCHITECTURE.md。

动作步骤：
1. 写章节：模块总线契约（BusinessModule SPI、ModuleRegistry、菜单/权限/事件/配置 schema 四类贡献）；
2. 写章节：CQRS-lite 通信模型（Facade 同步读 + AFTER_COMMIT 事件异步写、ArchUnit 强约束规则、对应 ACL 防腐层与 Domain Event 概念）；
3. 写章节：错误码体系（异常类层级、ProblemDetail RFC 7807、命名空间规则）；
4. 写章节：API 不带版本策略（理由、未来双轨切换路径）；
5. 写章节：SetupStep SPI；
6. 写章节：配置基座方案二（K-V/JSON 通用形态、审计、可选审批触发）；
7. 写章节：附件鉴权委托业务记录鉴权；
8. 写章节：file_storage 五子模块；
9. 写章节：dev_tools 独立模块原则（前后端 + mp 都建顶层 dev_tools 与 platform/modules 平级、@Profile("dev") + Vite tree-shake、ArchUnit 单向依赖约束）；
10. 写章节：未来多租户改造路径（届时如何加 tenant_id，但当前不做）；
11. 写章节：Git 历史策略（main 保留旧、refactor orphan init、main 作为参考蓝本）；
12. 写章节："阶段历程"——位于文档末尾，作为各阶段完成节点的固定承载位置。本章节初始内容是占位"基座 init 在 Phase 8 完成（具体日期由 P9-T03 填写）"。未来每完成一个大阶段就在此追加一条记录，形如"基座 init 完成于 2026-XX-XX、业务模块 attendance 上线于 2026-XX-XX"等；
13. 附录：列出各 ADR（架构决策记录），每个 ADR 一段说明决策、备选方案、最终选择、理由。

完成阈值：
- 涵盖累计决策的 17 条全部要点；
- 含 ASCII 或 mermaid 图（模块通信、SPI 流程）；
- 与 README.md 互链。

验收方式：QA Engineer + Technical Architect 双认可。

---

## P5-T03 业务模块文档迁移（按业务模块拆 5 子任务）

P5-T03a 至 P5-T03e 五个子任务分别处理 5 个业务模块的文档迁移。每个子任务独立验收，互不阻塞。所有子任务共享以下通用约定：

通用文档模板：

后端模块 README（server/src/main/java/com/oa/modules/<biz>/.../README.md）按三章模板——需求设计（业务规则、字段定义、状态机）+ 技术架构（数据表设计、API 接口、领域模型、与其他模块的事件/Facade 通信契约）+ 测试设计六要素（范围、场景、依赖隔离、数据准备、覆盖率、验收标准）。

前端模块 README（app/h5/modules/<biz>/README.md 与 app/mp/src/modules/<biz>/README.md 各一份，两端结构对称）按七章模板——界面设计（页面外观、布局结构、视觉规范、关键交互反馈）+ 操作流程（核心路径完整流程图含异常路径如提交失败/权限不足/网络错误）+ 视图清单（按 list/detail/form/modal/dashboard 分类含路径与入口角色与核心字段）+ 组件清单（antd 或 uni-ui 通用组件 + 跨模块共用组件 + 版本要点）+ 自定义组件（本模块特有复用组件清单 + 每个的 props/emits/slots/职责）+ 目录结构说明（modules/<name>/ 下各子目录各放什么 + 文件命名约定 + 与后端对应关系）+ 测试设计六要素。

前后端三份 README 末尾交叉链接：h5 链向 server README 与 mp README、mp 链向 server README 与 h5 README、server 链向 h5 README 与 mp README。父子文档双向链接：父文档末尾列子文档超链接索引、子文档开头反向链接到父文档。

通用 agent 分工：Technical Architect 主导文档拆分与撰写；Frontend Engineer 协助前端模块 README 的七章模板（界面设计、视图清单、组件清单、自定义组件等需要前端视角）；QA Engineer 逐章节核对原 DESIGN.md 与 docs/modules/ 内容是否全部落地、无丢失关键点；用户抽样确认。

---

## P5-T03a：迁移考勤模块文档

`[ ]` 待开始

依据：通用约定见 P5-T03 章节首；按业务模块拆分独立验收。

实现 agent：Technical Architect + Frontend Engineer。审计 agent：QA Engineer + 用户抽样确认。

改动范围（共 4 后端 + 4 h5 + 4 mp = 12 份 README）：

后端：modules/attendance/README.md（综合，含计量单位、§7.5 窗口期规则）+ clock/README.md（含 ClockProvider 抽象 + 企微 SDK 集成方案 + 四 profile 切换）+ leave/README.md（§7.2 假期类型与配额）+ overtime/README.md（§7.3 加班类型与补贴倍率）。

h5：app/h5/modules/attendance/{README.md, clock/README.md, leave/README.md, overtime/README.md} 共 4 份。

mp：app/mp/src/modules/attendance/{README.md, clock/README.md, leave/README.md, overtime/README.md} 共 4 份。

文档来源：DESIGN.md §7（含 §7.1 计量单位、§7.2 请假、§7.3 加班、§7.4 工伤剥离至 injury 不在本任务、§7.5 窗口期规则）+ docs/modules/attendance.md。

动作步骤：
1. 通读 DESIGN.md §7 与 docs/modules/attendance.md，按子模块（综合、clock、leave、overtime）逐段映射到对应 README；
2. clock/README.md 含 ClockProvider 接口签名（前面 P5-T02 ARCHITECTURE.md 已定的 dev/test/staging/prod 四 profile 切换 + 企微 SDK 集成方案）；
3. 父子文档超链接互通；前后端三端 README 交叉链接；
4. QA Engineer 核对内容完整；用户抽样确认。

完成阈值：12 份 README 齐全；DESIGN.md §7（除 §7.4）与 docs/modules/attendance.md 内容全部落地；链接互联完整。

验收方式：QA Engineer 逐章节对照原文核对 + 用户抽样。

---

## P5-T03b：迁移薪资模块文档

`[ ]` 待开始

依据：通用约定见 P5-T03 章节首。

实现 agent：Technical Architect + Frontend Engineer。审计 agent：QA Engineer + 用户抽样确认。

改动范围（共 7 后端 + 7 h5 + 7 mp = 21 份 README）：

后端：modules/payroll/README.md（综合）+ cycle/README.md（§6.2 周期 + §6.6 锁定）+ social_insurance/README.md（§6.1）+ salary_structure/README.md（§6.4 计算基准 + 基本工资/岗位工资/固定津贴/绩效奖金四字段独立）+ allowance/README.md（§6.4 AllowanceDef 四层覆盖 + 唯一性约束）+ settlement/README.md（§6.3 结算流程）+ payslip/README.md（§6.5 工资条格式 + 改"确认无误"按钮、不签字）。

h5 与 mp：与后端 7 个子模块对称的 README 各 7 份。

文档来源：DESIGN.md §6（全章）+ docs/modules/payroll.md。

动作步骤：
1. 通读 DESIGN.md §6 与 docs/modules/payroll.md；
2. 按子模块逐段映射，注意四字段独立（基本工资、岗位工资、固定津贴、绩效奖金）放 salary_structure/README.md，AllowanceDef 四层覆盖放 allowance/README.md；
3. payslip/README.md 明确"不签字、改确认无误按钮"的设计变更；
4. 父子文档超链接互通；前后端三端交叉链接；
5. QA Engineer 核对；用户抽样确认。

完成阈值：21 份 README 齐全；DESIGN.md §6 与 docs/modules/payroll.md 内容全部落地；链接互联完整。

验收方式：QA Engineer 逐章节核对 + 用户抽样。

---

## P5-T03c：迁移报销模块文档

`[ ]` 待开始

依据：通用约定见 P5-T03 章节首。

实现 agent：Technical Architect + Frontend Engineer。审计 agent：QA Engineer + 用户抽样确认。

改动范围（共 4 后端 + 4 h5 + 4 mp = 12 份 README）：

后端：modules/expense/README.md（综合）+ category/README.md（§9.1 类型与配额）+ application/README.md（§9.2 申请表单）+ posting/README.md（§9.4 与工资条及项目的关联）。

h5 与 mp：与后端对称各 4 份。

文档来源：DESIGN.md §9（全章）+ docs/modules/expense.md。

动作步骤：
1. 通读 DESIGN.md §9 与 docs/modules/expense.md；
2. 按子模块映射；
3. posting/README.md 含与薪资工资条及项目成本的事件契约（ExpenseApproved 事件签名）；
4. 链接互通；
5. QA Engineer 核对；用户抽样确认。

完成阈值：12 份 README 齐全；内容全部落地；链接互联完整。

验收方式：QA Engineer 核对 + 用户抽样。

---

## P5-T03d：迁移项目模块文档

`[ ]` 待开始

依据：通用约定见 P5-T03 章节首。

实现 agent：Technical Architect + Frontend Engineer。审计 agent：QA Engineer + 用户抽样确认。

改动范围（共 8 后端 + 8 h5 + 8 mp = 24 份 README）：

后端：modules/project/README.md（综合）+ basic/README.md（§8.1 项目基础信息）+ member/README.md（含工长、售后、物资管理三类第二角色赋予）+ milestone/README.md（§8.2 里程碑与状态管理）+ log/README.md（§8.3 施工日志）+ cost/README.md（§8.4 成本管理 - 实体/保险/差旅/其他四类）+ revenue/README.md（§8.5 营收管理）+ aftersales/README.md（§8.6 售后管理）。

h5 与 mp：与后端对称各 8 份。

文档来源：DESIGN.md §8（全章）+ docs/modules/project.md。

动作步骤：
1. 通读 DESIGN.md §8 与 docs/modules/project.md；
2. 按子模块映射，重点是 member/README.md 含三类第二角色赋予的具体逻辑（与基座 platform/role 的 second_role 协作约定）；
3. cost/README.md 含四类成本（实体/保险/差旅/其他）的字段与计算规则、保险成本与施工日志出勤天数的联动；
4. 链接互通；
5. QA Engineer 核对；用户抽样确认。

完成阈值：24 份 README 齐全；内容全部落地；链接互联完整。

验收方式：QA Engineer 核对 + 用户抽样。

---

## P5-T03e：迁移工伤模块文档

`[ ]` 待开始

依据：通用约定见 P5-T03 章节首。

实现 agent：Technical Architect + Frontend Engineer。审计 agent：QA Engineer + 用户抽样确认。

改动范围（共 3 后端 + 3 h5 + 3 mp = 9 份 README）：

后端：modules/injury/README.md（综合）+ claim/README.md（§7.4 工伤申报）+ settlement/README.md（理赔金额录入 + 跨周期归属薪资）。

h5 与 mp：与后端对称各 3 份。

文档来源：DESIGN.md §7.4（注：§7.4 在原章节属于"考勤管理"下、但工伤独立成模块、本任务剥离 §7.4 全部内容到 injury 模块）+ docs/modules/injury.md。

动作步骤：
1. 通读 DESIGN.md §7.4 与 docs/modules/injury.md；
2. claim/README.md 含申报入口、跨周期申报特性、三种发起方式（劳工本人/项目经理/工长代录）、申报表单字段（受伤人员/日期/时间/医生诊断/事故经过/附件）；
3. settlement/README.md 含理赔金额录入逻辑、跨周期归属薪资周期的规则、与 payroll.settlement 的事件契约（InjuryClaimSettled 事件签名）；
4. 链接互通；
5. QA Engineer 核对；用户抽样确认。

完成阈值：9 份 README 齐全；§7.4 内容全部落地；链接互联完整。

验收方式：QA Engineer 核对 + 用户抽样。

---

## P5-T04 platform 模块文档迁移（按模块功能群拆 3 子任务）

P5-T04a 至 P5-T04c 三个子任务按 platform 模块功能群分别处理。共享通用约定见 P5-T03 章节首（后端三章模板、前端七章模板、双向交叉链接、agent 分工）。

总体覆盖：15 个 platform 模块（auth、employee、department、position、role、org、form、approval、notification、file_storage 含 5 子模块、config、operation_log、setup、module_registry、shared）+ modules/shared，共 17 份后端 README + 17 份 h5 README + 17 份 mp README。

注意：platform/file_storage 拆 5 子模块（file_io、retention_policy、expiry_warning、extension、cleanup），文件夹下含子文档；其他 platform 模块单 README 即可。

文档来源：DESIGN.md §1（系统模块）、§2（初始化）、§3（人员组织）、§4（审批流）、§5（角色工作台，按角色拆到对应 platform 模块）、§10（数据归档→file_storage）+ docs/core/ 全部 15 份。

---

## P5-T04a：迁移基座身份与组织模块文档

`[ ]` 待开始

依据：通用约定见 P5-T03 章节首；按 platform 模块功能群"身份与组织"拆分。

实现 agent：Technical Architect + Frontend Engineer。审计 agent：QA Engineer + 用户抽样确认。

改动范围（共 6 platform 模块 × 3 端 = 18 份 README）：

platform/auth/README.md（§2 初始密码、登录、JWT、找回密码、首登设密、邮箱验证、验证码）

platform/employee/README.md（§3.3 人员字段）

platform/department/README.md（§3.5 组织架构管理）

platform/position/README.md（§3.4 岗位与等级）

platform/role/README.md（§3.2 角色系统、第二角色定义、§3.6 直系领导取值优先级）

platform/org/README.md（§3.5 组织树视图聚合）

每个 platform 模块对应 3 份 README（server/h5/mp）。共 6 × 3 = 18 份。

文档来源：DESIGN.md §2、§3 与 docs/core/auth.md、employee.md、org.md、setup.md 中的 setup 步骤拆分（与 platform/setup 重叠部分留 P5-T04c）。

动作步骤：
1. 通读 DESIGN.md §2、§3 与 docs/core/{auth,employee,org}.md；
2. 按 platform 模块逐段映射；
3. 每份 README 含三/七章模板章节；
4. 父子文档链接（auth/employee 等无子文档）；前后端三端 README 交叉链接；
5. QA Engineer 核对；用户抽样确认。

完成阈值：18 份 README 齐全；DESIGN.md §3 全部内容与 docs/core 中身份组织相关内容已落地；链接互联完整。

验收方式：QA Engineer 核对 + 用户抽样。

---

## P5-T04b：迁移通用业务能力模块文档

`[ ]` 待开始

依据：通用约定见 P5-T03 章节首；本子任务覆盖跨业务复用的通用能力 platform 模块。

实现 agent：Technical Architect + Frontend Engineer。审计 agent：QA Engineer + 用户抽样确认。

改动范围（共 4 platform 模块 + file_storage 5 子模块 × 3 端 ≈ 27 份 README）：

platform/form/README.md（通用表单基座）

platform/approval/README.md（§4 审批流：§4.1 概念、§4.2 节点结构、§4.3 末端节点配置、§4.4 各业务审批流一览作为引用、§4.5 驳回重提、§4.6 历史记录）

platform/notification/README.md

platform/file_storage/README.md（综合）+ file_io/README.md（写读、附件元信息、SPI 鉴权委托 BusinessRecordAccessChecker）+ retention_policy/README.md（§10.1 默认 3 年）+ expiry_warning/README.md（到期预警）+ extension/README.md（延期）+ cleanup/README.md（SPI 调度业务清理 RetentionCleanupHandler）

文档来源：DESIGN.md §4、§10 + docs/core/form.md、approval.md、notification.md、file.md、retention.md、bus.md、tracking.md、error.md。

动作步骤：
1. 通读 DESIGN.md §4、§10 与 docs/core/ 中相关 5-7 份；
2. file_storage 五子模块各自 README 含子模块职责、与 SPI 接口的契约、与其他模块的事件/调用关系；
3. file_io/README.md 含附件鉴权委托业务记录鉴权的设计（与 SPI 接口签名对齐）；
4. cleanup/README.md 含 SPI 调度业务清理的设计（与 RetentionCleanupHandler 接口对齐）；
5. 前后端三端 README 交叉链接；父子文档双向链接；
6. QA Engineer 核对；用户抽样确认。

完成阈值：约 27 份 README 齐全；DESIGN.md §4、§10 与 docs/core 通用能力相关内容已落地；链接互联完整。

验收方式：QA Engineer 核对 + 用户抽样。

---

## P5-T04c：迁移系统治理与共享层文档

`[ ]` 待开始

依据：通用约定见 P5-T03 章节首；本子任务覆盖系统级治理模块与跨模块共享层。

实现 agent：Technical Architect + Frontend Engineer。审计 agent：QA Engineer + 用户抽样确认。

改动范围（共 5 platform 模块 + 1 modules/shared × 3 端 = 18 份 README）：

platform/config/README.md（K-V/JSON 形态、审计、可选审批触发、namespace 约定、按 key 读权限矩阵 ConfigKeyPermissions）

platform/operation_log/README.md（操作日志切面与查询）

platform/setup/README.md（§2 初始化向导引擎、SetupStep SPI、首装步骤总编排、含 CompanyNameStep/AdminAccountStep/GeneralManagerStep/DefaultPasswordStep 内置步骤）

platform/module_registry/README.md（模块总线、BusinessModule SPI 接口、manifest 字段定义、ModuleRegistry 启动收集机制）

platform/shared/README.md（技术原语 Money、DateRange、AuditFields、ProblemDetailFactory、PlatformErrorCodes 等）

modules/shared/README.md（业务级领域语义 AllowanceDef、Duration、FiscalPeriod、ApprovalFlowDefinition 等）

文档来源：DESIGN.md §1、§2（初始化部分）、§5（角色工作台中关于 sys_admin 与 ceo 跨模块视图） + docs/core/config.md、logging.md、setup.md、health.md、retention.md（部分）。

动作步骤：
1. 通读 DESIGN.md §1、§2、§5 与 docs/core/ 中相关；
2. setup/README.md 含 SetupStep SPI 完整接口签名、SetupContext 字段定义、4 个内置步骤的职责；
3. config/README.md 含按 key 读权限矩阵 ConfigKeyPermissions 的设计与示例；
4. module_registry/README.md 含 BusinessModule 接口、ModuleManifest 类型定义；
5. shared 两份分别说明"技术原语"与"业务级领域语义"的判据；
6. 链接互通；
7. QA Engineer 核对；用户抽样确认。

完成阈值：18 份 README 齐全；DESIGN.md §1、§2、§5 与 docs/core 系统治理相关内容已落地；链接互联完整。

验收方式：QA Engineer 核对 + 用户抽样。

---

## P5-T05：删除旧 DESIGN.md、docs/、BUSINESS_REPORT_PRICING_ANALYSIS.md

`[ ]` 待开始

依据：DESIGN.md 与 docs/ 内容已在 P5-T03/T04 完整迁移到模块 README，保留旧版会造成"哪份算数"的混淆；BUSINESS_REPORT_PRICING_ANALYSIS.md 是商业/定价报告，跟代码混在仓库里有商业信息泄漏给二次开发客户的风险（决策来源：用户已确认删除）。

实现 agent：Orchestrator。审计 agent：QA Engineer。

改动范围：
- DESIGN.md（根目录）
- docs/core/ 整目录
- docs/modules/ 整目录
- BUSINESS_REPORT_PRICING_ANALYSIS.md（根目录）

动作步骤：
1. 机械化验证 P5-T03 全部 5 子任务（a/b/c/d/e）与 P5-T04 全部 3 子任务（a/b/c）状态都已推进到 [x]：用 `grep -E "## P5-T03[a-e]|## P5-T04[a-c]" -A 2 TODO.md | grep "\[x\]"` 应有 8 条命中；同时人工抽查 modules/ 与 platform/ 各模块 README 内容齐全；两条都满足才进下一步；
2. 物理删除四项：`rm -f DESIGN.md BUSINESS_REPORT_PRICING_ANALYSIS.md && rm -rf docs/core docs/modules`；
3. `grep -rn "DESIGN.md\|docs/core\|docs/modules\|BUSINESS_REPORT_PRICING_ANALYSIS" --exclude-dir=node_modules --exclude-dir=.git --exclude=TODO.md .` 扫全仓库，逐一更新失效引用（README.md、ARCHITECTURE.md、模块 README 中的链接），TODO.md 内的引用允许保留（任务依据来源说明）。

完成阈值：
- 上述路径不存在；
- grep 不返回失效引用。

验收方式：QA Engineer 跑 grep + ls。

---

## P5-T06：业务模块代码目录骨架（h5 与 mp 同步）

`[ ]` 待开始

依据：用户已确认"暂未实现的业务模块要把目录建好"（决策来源：目录结构讨论第二点）；mp 与 h5 同步演进（决策来源：mp 与 h5 同步演进原则），两端业务模块骨架同时建。

实现 agent：Backend Engineer + Frontend Engineer。审计 agent：QA Engineer。

改动范围：
- 后端：server/src/main/java/com/oa/modules/{attendance,payroll,expense,project,injury}/ 与各子模块（按 P5-T03 列出的子模块清单）的空目录，每个 controller/service/entity/mapper/dto/api 子包放 .gitkeep
- 前端 h5：app/h5/modules/{attendance,payroll,expense,project,injury}/ 与各子模块占位，含 pages/components/store/types/test 子目录占位 + module.config.ts 占位
- 前端 mp：app/mp/src/modules/{attendance,payroll,expense,project,injury}/ 与各子模块占位，结构与 h5 端对称
- 前端 mp pages.json：在 subPackages 数组中预先声明 5 个业务模块作为 sub-package 占位（即便当前 pages 为空），格式：

```json
{
  "pages": [...],
  "subPackages": [
    { "root": "modules/attendance", "pages": [] },
    { "root": "modules/payroll",    "pages": [] },
    { "root": "modules/expense",    "pages": [] },
    { "root": "modules/project",    "pages": [] },
    { "root": "modules/injury",     "pages": [] }
  ]
}
```

每个业务模块未来加 page 时只需把 vue 文件路径添加到对应 root 的 pages 数组；
- 数据库迁移：server/src/main/resources/db/migration/{attendance,payroll,expense,project,injury}/ 各空目录含 .gitkeep

动作步骤：
1. 按 P5-T03 列出的子模块清单建后端骨架（每个模块与子模块根目录放 README.md 占位文件，预先写好后端三章模板的章节标题：需求设计、技术架构、测试设计六要素，每章下"待 P5-T03 阶段填充"占位）；
2. 按相同清单建 h5 端骨架（每个模块与子模块根目录放 README.md 占位文件，预先写好前端七章模板的章节标题：界面设计、操作流程、视图清单、组件清单、自定义组件、目录结构说明、测试设计六要素，每章下"待 P5-T03 阶段填充"占位）；
3. 按相同清单建 mp 端骨架（与 h5 完全对称，README 占位文件按相同七章模板）；
4. 建数据库迁移子目录骨架；
5. 在每份 README 占位文件末尾预先写好交叉链接结构（先放占位 URL，等 P5-T03 阶段填具体路径）；
6. 确保 git 能追踪空目录（用 .gitkeep）。

完成阈值：
- tree 命令可见双端完整骨架；
- 后端、h5、mp 三处的业务模块清单与子模块清单完全一致；
- 与 P5-T03 子模块清单一一对应。

验收方式：QA Engineer 跑 tree + 三处对比 + 抽查。

---

# Phase 6：测试基础设施重写

## P6-T01：删除不适配的基座 service 单测、保留完全适配的

`[ ]` 待开始

依据：用户已确认测试处理硬规则——业务相关、不适配、不通用的测试一律删除，只保留完全适配新基座的纯平台测试（决策来源：测试处理硬规则）。

实现 agent：QA Engineer。审计 agent：QA Engineer 互审。

改动范围与处置：

第一，**删除以下 4 份测试**：

`server/src/test/java/com/oa/backend/service/ApprovalFlowServiceTest.java`（923 行）—— 大量硬编码 `"LEAVE"` 作为 business_type 测试值，与新基座 ApprovalFlowService 删除业务字典（P2-T03）的方向矛盾，删除整份；

`server/src/test/java/com/oa/backend/service/PositionServiceImplTest.java`（413 行）—— 含 overtimeRateWeekday/Weekend/Holiday 加班倍率断言（薪资业务）与 requiresConstructionLog 断言（项目业务），与 P2-T02 字段剥离矛盾，删除整份；

`server/src/test/java/com/oa/backend/service/RetentionServiceTest.java`（726 行）—— 大量用 `"PAYROLL_SLIP"` 作为 DataType，与 P4-T05 file_storage 模块改造方向矛盾（retention 改造为 SPI 调度），删除整份；

`server/src/test/java/com/oa/backend/service/SetupServiceTest.java`（519 行）—— SetupService 在 P4-T03 大改造为 SetupStep SPI 引擎，旧测试断言基于旧 service 形态完全不适配，删除整份。

第二，**保留以下 3 份测试**：

`server/src/test/java/com/oa/backend/service/AccessManagementServiceTest.java`（498 行）—— 纯平台角色与权限管理测试，无业务字段依赖，保留；

`server/src/test/java/com/oa/backend/service/NotificationServiceTest.java`（280 行）—— 纯平台通知测试，无业务字段依赖，保留；

`server/src/test/java/com/oa/backend/service/EmployeeServiceImplTest.java`（421 行）—— 主体测试员工 service 基础逻辑，但与 P2-T01 expense_limit 字段剥离 + P2-T11 默认密码改 ConfigService 读取相关的断言需要同步裁剪。保留并裁剪。

动作步骤：
1. 物理删除 4 份不适配测试：

```
rm -f server/src/test/java/com/oa/backend/service/ApprovalFlowServiceTest.java
rm -f server/src/test/java/com/oa/backend/service/PositionServiceImplTest.java
rm -f server/src/test/java/com/oa/backend/service/RetentionServiceTest.java
rm -f server/src/test/java/com/oa/backend/service/SetupServiceTest.java
```

2. 检查保留的 3 份测试在 P2-T01、P2-T11 改动后是否仍能通过——`cd server && mvn test -Dtest=AccessManagementServiceTest,NotificationServiceTest,EmployeeServiceImplTest`：
   - 全绿 → 不动；
   - EmployeeServiceImplTest 编译失败或断言失败 → 找到含 `expense_limit` / `expenseLimit` / `passwordEncoder.encode("123456")` 的断言行，删除这些行（用 grep 定位行号）；其他保留测试预期不受影响；
3. 在 P3-T01 后端重组时这 3 份测试随主代码迁移到 com/oa/platform/<module>/test/；
4. 新基座 service 测试在 P5-T04 platform 模块 README 写完、P6-T06 E2E 骨架补齐时按新结构重写（含 ApprovalFlow、Position、Retention、Setup 四个 service 的新版测试）；
5. mvn test 全绿。

完成阈值：
- 4 份不适配测试已删除；
- 3 份保留测试在适配性改动后仍能通过；
- mvn test 全绿（覆盖率会暂时下降，由 P6-T06 补齐）。

验收方式：QA Engineer 跑 ls 确认删除 + mvn test 确认通过。

---

## P6-T02：删除不适配的 AuthControllerTest 与 SetupFinalizeIntegrationTest

`[ ]` 待开始

依据：用户已确认测试处理硬规则——业务相关、不适配、不通用的测试一律删除（决策来源：测试处理硬规则）。

实现 agent：QA Engineer。审计 agent：QA Engineer。

改动范围与处置（按测试硬规则统一删除，避免临场评估）：

`server/src/test/java/com/oa/backend/controller/AuthControllerTest.java` —— 整份删除。Auth 层在 P3-T01 重组、P4-T01 异常体系改造后接口与异常映射会变，旧测试断言基本失效；按测试硬规则"不适配的删除"统一处理。新基座 Auth 测试在 P6-T06 happy_path 阶段按新结构重写。

`server/src/test/java/com/oa/backend/controller/SetupFinalizeIntegrationTest.java` —— 整份删除。SetupService 在 P4-T03 大改造为 SetupStep SPI 引擎，本测试对应的旧链路完全不适配。新基座 setup SPI 的对应集成测试在 P5-T04 与 P6-T06 时按新形态重写。

动作步骤：
1. 物理删除两份测试：

```
rm -f server/src/test/java/com/oa/backend/controller/AuthControllerTest.java
rm -f server/src/test/java/com/oa/backend/controller/SetupFinalizeIntegrationTest.java
```

2. `cd server && mvn test` 全绿（删除后剩余测试不受影响）。

完成阈值：
- AuthControllerTest 状态符合评估结果；
- SetupFinalizeIntegrationTest 已删除；
- mvn test 全绿。

验收方式：QA Engineer 跑 grep + mvn test。

---

## P6-T03：删除 test-accounts.sql 重叠

`[ ]` 待开始

依据：test-accounts.sql 与 R__test_accounts.sql 内容重叠，保留 R__ repeatable migration 即可。

实现 agent：QA Engineer。审计 agent：QA Engineer。

改动范围：server/src/test/resources/db/test-accounts.sql。

动作步骤：
1. 物理删除；
2. mvn test 仍能注入测试账号（R__ 还在）。

完成阈值：
- 路径不存在；
- 测试绿。

验收方式：ls + mvn test。

---

## P6-T04：删除 test/integration/api.test.ts

`[ ]` 待开始

依据：用户已确认测试处理硬规则——业务相关、不适配、不通用的测试一律删除（决策来源：测试处理硬规则）。该文件是混合用例，含 auth/employee/department 平台用例与 project/payroll 等业务用例，硬要拆分代价比重写大，且新基座架构改造后旧用例的依赖与断言基本都不成立。整体删除。

实现 agent：QA Engineer。审计 agent：QA Engineer。

改动范围：test/integration/api.test.ts。

动作步骤：
1. 物理删除；
2. 新基座的集成测试在 P5 阶段每个 platform 模块的 test 子目录下分别按 TEST_DESIGN.md 重写（auth.test.ts、employee.test.ts、department.test.ts、role.test.ts 等按 platform 模块就近）；
3. yarn test:integration 命令更新指向新路径。

完成阈值：
- 文件已删除；
- 新基座集成测试在 P6 阶段补齐。

验收方式：QA Engineer 确认 ls + 集成测试在新路径下能跑。

---

## P6-T05：删除业务化的 e2e PageObject 与 spec 残余

`[ ]` 待开始

依据：用户已确认测试处理硬规则——业务相关、不适配、不通用的测试一律删除（决策来源：测试处理硬规则）。原文件断言与定位器基于旧业务硬编码，新基座的菜单/路径/字段都变了，重写比裁剪经济。新的基座 E2E 在 P6-T06 按 platform 模块就近重写。

实现 agent：Frontend Engineer。审计 agent：QA Engineer。

改动范围：
- test/e2e/pages/WorkbenchPage.ts
- test/e2e/pages/ApprovalPage.ts
- test/e2e/specs/employee_crud.spec.ts
- test/e2e/specs/position_crud.spec.ts
- test/e2e/specs/e2e_07_hr.spec.ts
- test/e2e/specs/e2e_08_setup_wizard.spec.ts

动作步骤：
1. 物理删除上述文件；
2. playwright list 不再含已删除用例。

完成阈值：
- 路径不存在；
- playwright 列表正确。

验收方式：QA Engineer 跑 playwright --list。

---

## P6-T06：补齐 platform 模块 E2E 骨架

`[ ]` 待开始

依据：每个 platform 模块需要 happy_path E2E 验证基座可启动可用。

实现 agent：Frontend Engineer + QA Engineer。审计 agent：QA Engineer 互审。

改动范围：
- 后端：每个 platform 模块在 src/test/java/com/oa/platform/<m>/test/ 下补 E2E 用例骨架（Java 端到端 with REST Assured 或 Spring Boot Test）
- 前端：app/h5/modules/<m>/test/ 下补 Playwright 用例骨架

动作步骤：
1. 每个 platform 模块按其类型选择对应的 happy_path 模板：

```
auth                  → 登录-工作台-退出（covers: POST /api/auth/login → GET workbench → POST /api/auth/logout）
employee              → 列表-新建-保存-列表刷新（标准 CRUD 模板）
department            → 列表-新建-保存（CRUD）
position              → 列表-新建-保存（CRUD）
role                  → 列表-查看角色绑定（只读为主）
org                   → 树视图-展开节点（只读）
form                  → 列表-查看一条通用表单记录（只读）
approval              → 待办列表-查看一条审批详情（只读）
notification          → 通知中心-标记已读（POST /api/notifications/{id}/read）
file_storage          → 上传-下载（默认拒绝场景验证 stub）
config                → 列表-修改一个 namespace.key 值-审计日志可见
operation_log         → 列表-按时间筛选（只读）
setup                 → 完成首装向导四步（DefaultPasswordStep + GeneralManagerStep + CompanyNameStep + AdminAccountStep）
module_registry       → GET /api/platform/modules 返回空数组校验
shared                → 不需要 E2E（纯技术原语，无用户入口）
```

2. 后端 E2E 用 Spring Boot Test + RestAssured（或 MockMvc），位置 `src/test/java/com/oa/platform/<m>/test/<m>HappyPathE2ETest.java`；
3. 前端 E2E 用 Playwright，位置 `app/h5/modules/<m>/test/happy_path.spec.ts`；mp 端按需也补（Phase G 阶段才做，本任务不要求 mp E2E）；
4. mvn test + npx playwright test 全绿；
5. 用例骨架数量：后端 13 份（不含 shared 与 module_registry 是因 module_registry 已有单测、shared 不需要 E2E）；前端 14 份（含 module_registry 一份）。

完成阈值：
- happy_path E2E 骨架数量正确；
- playwright 全绿。

验收方式：QA Engineer 跑 playwright test。

---

## P6-T07：测试覆盖率工具配置

`[ ]` 待开始

依据：P6 阶段补齐测试但没说覆盖率怎么衡量。新基座需要可机械化输出覆盖率报告供 P9-T01 终审使用，避免凭感觉判断"测试够不够"。后端用 jacoco（业内 Java 覆盖率事实标准），前端用 vitest 内置 coverage（基于 c8）。

实现 agent：DevOps Engineer + Backend Engineer + Frontend Engineer。审计 agent：QA Engineer。

改动范围：
- 后端：server/pom.xml 加 jacoco-maven-plugin 配置
- 后端：server/.gitignore 加 target/site/jacoco/（生成产物不入 git）
- 前端 h5：app/h5/vitest.config.ts 加 coverage 配置
- 前端 h5：app/h5/.gitignore 加 coverage/（生成产物不入 git）
- CI 配置：.github/workflows/ci.yml 中 mvn test 与 yarn test 后产生的覆盖率报告作为 artifact 上传供 PR review 查看

动作步骤：

第一步，后端配置 jacoco。在 server/pom.xml 的 build/plugins 下加 jacoco-maven-plugin：

```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.11</version>
  <executions>
    <execution>
      <id>prepare-agent</id>
      <goals><goal>prepare-agent</goal></goals>
    </execution>
    <execution>
      <id>report</id>
      <phase>test</phase>
      <goals><goal>report</goal></goals>
    </execution>
    <execution>
      <id>check</id>
      <goals><goal>check</goal></goals>
      <configuration>
        <rules>
          <rule>
            <element>BUNDLE</element>
            <limits>
              <limit><counter>LINE</counter><value>COVEREDRATIO</value><minimum>0.60</minimum></limit>
              <limit><counter>BRANCH</counter><value>COVEREDRATIO</value><minimum>0.50</minimum></limit>
            </limits>
          </rule>
        </rules>
      </configuration>
    </execution>
  </executions>
</plugin>
```

行覆盖率最低 60%，分支覆盖率最低 50%（基座 MVP 阶段的合理基线，业务模块回填时再提升至 80%）；

第二步，前端 h5 配置 vitest coverage。在 app/h5/vitest.config.ts 加：

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 60,
        branches: 50,
        functions: 60,
        statements: 60
      },
      exclude: ['**/dev_tools/**', '**/node_modules/**', '**/dist/**']
    }
  }
})
```

dev_tools 目录排除（不强求覆盖）；

第三步，安装前端 coverage 依赖：`yarn workspace oa-h5 add -D @vitest/coverage-v8`；

第四步，本地跑 `cd server && mvn test` 后查看 server/target/site/jacoco/index.html 生成的覆盖率 HTML 报告；本地跑 `yarn workspace oa-h5 test --coverage` 后查看 app/h5/coverage/index.html；

第五步，CI 修改：在 mvn test 与 yarn test 步骤后，添加 actions/upload-artifact 步骤把 jacoco 与 vitest 的报告上传作为 PR artifact；

第六步，更新 .gitignore 排除生成产物（server/target/site/jacoco/、app/h5/coverage/）。

完成阈值：
- jacoco 与 vitest coverage 均能跑出 HTML 报告；
- 当前基座覆盖率 ≥ 60% 行覆盖（如不足则补关键路径单测）；
- CI artifact 上传成功；
- mvn test 与 yarn test 全绿（不达阈值会触发失败，需要补测试或调整 threshold）。

验收方式：QA Engineer 跑 mvn test 与 yarn test 看 HTML 报告 + 推 PR 看 CI artifact。

---

# Phase 7：基座启动验证

## P7-T01：后端构建与单测全绿

`[ ]` 待开始

依据：基座必须可启动可测试才算建好。

实现 agent：QA Engineer。审计 agent：Reality Checker。

动作步骤：在 server/ 目录跑 `mvn clean test`，包含全部单测、集成测试、ArchUnit 测试。

完成阈值：BUILD SUCCESS、0 失败、0 错误、0 跳过。

验收方式：Reality Checker 复跑确认。

---

## P7-T02：前端构建与单测全绿

`[ ]` 待开始

依据：同 P7-T01。

实现 agent：QA Engineer。审计 agent：Reality Checker。

动作步骤：在仓库根目录跑 `yarn workspace oa-h5 lint`、`yarn workspace oa-h5 test`、`yarn workspace oa-h5 build`。

完成阈值：lint 0 error（warnings 可接受）、test 全绿、build 成功。

验收方式：Reality Checker 复跑确认。

---

## P7-T03：后端启动 + 健康检查

`[ ]` 待开始

依据：可启动是基座最基本验收。

实现 agent：QA Engineer。审计 agent：Reality Checker。

动作步骤：在 server/ 目录跑 `mvn spring-boot:run`（dev profile），等待 H2 + Flyway 完成、application 启动；curl http://localhost:8080/api/health 返回 200。

完成阈值：启动日志无 ERROR 级别记录；health 200。

验收方式：Reality Checker 复跑。

---

## P7-T04：前端启动 + 登录走查

`[ ]` 待开始

依据：可登录、菜单正确是基座可用性的最低要求。

实现 agent：QA Engineer。审计 agent：Reality Checker。

动作步骤：在 app/h5/ 跑 `yarn dev`；浏览器分别用 P2-T09 fixtures/dev seed 中预设的 9 个 demo 账号登录（账号清单：sys_admin.demo、ceo.demo、gm.demo、hr.demo、finance.demo、pm.demo、dept_manager.demo、employee.demo、worker.demo，密码统一 '123456'）；每个用户依次：
1. 登录成功；
2. 菜单只显示 platform 模块条目，无业务条目；
3. 进 setup wizard、me、employees、role、config、operation_log 等核心页面均能正常打开（具体页面按角色权限范围）；
4. 无白屏、无 console error；
5. 退出登录。

完成阈值：9 个用户全部通过上述五项。

验收方式：Reality Checker 复跑。

---

## P7-T05：基座功能集成回归

`[ ]` 待开始

依据：用户场景级走查检验基座的端到端可用性。

实现 agent：Reality Checker。审计 agent：用户。

动作步骤：用户场景：
1. CEO 登录 → 创建一个员工 → 设置员工部门、岗位 → 列表能查到；
2. HR 登录 → 调整组织架构（增加部门、调整层级）；
3. sys_admin 登录 → 修改系统配置（公司名）；
4. CEO 登录 → 配置数据保留期；
5. CEO 登录 → 接收一条通知（HR 在前一步动作中触发）；
6. CEO 登录 → 上传一个文件附件、其他用户验证默认拒绝下载（鉴权 stub 期）；
7. sys_admin 登录 → 操作日志查到上述操作记录。

完成阈值：每个场景跑通无堵塞错误。

验收方式：Reality Checker 出 PASS 报告 + 用户旁观确认。

---

# Phase 8：Git 历史 init

## P8-T01：清理工作区

`[ ]` 待开始

依据：orphan init 前必须工作区干净。

实现 agent：Orchestrator。审计 agent：QA Engineer。

动作步骤：
1. `git status` 检查 working tree clean；
2. 如有未保存修改先 commit 到 refactor 分支。

完成阈值：git status 输出"working tree clean"。

验收方式：QA Engineer 复查。

---

## P8-T02：创建 orphan init 分支

`[ ]` 待开始

依据：用户已确认 orphan init 方式（决策来源：第十六条）。

实现 agent：Orchestrator。审计 agent：QA Engineer。

动作步骤：
1. `git checkout --orphan refactor-init` 创建无父 commit 的新分支；
2. `git add -A` 把当前所有文件加入暂存；
3. `git commit -m "init: platform base"` 提交为唯一 commit。

完成阈值：`git log refactor-init` 只显示一个 commit。

验收方式：QA Engineer 跑 git log。

---

## P8-T03：替换 refactor 分支

`[ ]` 待开始

依据：让 main 之外的工作分支看起来是从 init 起步。

实现 agent：Orchestrator。审计 agent：QA Engineer。

动作步骤：
1. `git branch -D refactor` 删除原 refactor；
2. `git branch -m refactor-init refactor` 重命名 orphan 分支为 refactor。

完成阈值：`git branch` 显示 refactor 与 main 两个本地分支；`git log refactor` 只显示 init commit。

验收方式：QA Engineer 跑 git branch + git log。

---

## P8-T04：远程同步

`[ ]` 待开始

依据：用户已确认 main 不动，refactor force push（决策来源：第十六条）。

实现 agent：Orchestrator。审计 agent：QA Engineer。

动作步骤：
1. `git push --force origin refactor` 把本地新 refactor 推上去；
2. main 完全不动（不 push、不 reset）。

完成阈值：远程 refactor 与本地一致；远程 main 历史未变。

验收方式：QA Engineer 跑 git log origin/main 与 git log origin/refactor 对比。

---

## P8-T05：legacy 历史确认可访问

`[ ]` 待开始

依据：未来回填业务时需要从 main 取业务代码作为参考蓝本（决策来源：第十六条）。

实现 agent：QA Engineer。审计 agent：Reality Checker。

动作步骤：
1. `git log main` 仍显示完整历史；
2. 抽样 `git show main:server/src/main/java/com/oa/backend/controller/SignatureController.java` 仍能输出旧文件内容；
3. 抽样 `git checkout main -- <path>` 试取一个旧文件（取完恢复）。

完成阈值：上述命令均成功。

验收方式：Reality Checker 复跑。

---

# Phase 9：总验收

## P9-T01：Reality Checker 终审

`[ ]` 待开始

依据：基座完整性最终把关。

实现 agent：Reality Checker。审计 agent：用户。

动作步骤：
1. 业务关键字扫描（仅针对代码与 SQL 与配置，不针对模块 README 文档）：

```
grep -rn "attendance\|payroll\|expense\|project\|injury\|leave\|overtime\|construction\|aftersale\|material_delegation\|signature" \
  --include="*.java" --include="*.ts" --include="*.vue" --include="*.sql" --include="*.yml" --include="*.yaml" \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=target --exclude-dir=docs \
  . 2>/dev/null
```

预期命中只剩 ArchUnit 测试类名（含 BUSINESS 字符）、modules/ 业务模块骨架的 module.config.ts（业务模块名是预留），其余皆为零；

2. 检查目录结构：tree -L 3 server/src/main/java/com/oa 与 app/h5/modules 与 app/mp/src/modules，与 P3-T01/P3-T03/P5-T06 任务规划目录完全对齐；
3. 检查 P1 至 P8 全部任务状态：`grep -E "^## P[1-8]-T" TODO.md | wc -l` 输出全部任务数；`grep -E "^\\\`\\\\[x\\\\]\\\`" TODO.md | wc -l` 输出已完成数；二者应相等；
4. 运行 P7-T01 至 P7-T05 五条命令复跑验证（mvn test、yarn build/test/lint、后端启动、前端启动、用户场景回归）。

完成阈值：
- 业务关键字命中只在 ARCHITECTURE.md 与 modules/ 业务文档中出现；
- 所有任务 [x]；
- 五命令全绿。

验收方式：Reality Checker 输出 PASS 或 NEEDS WORK 报告。NEEDS WORK 必须当阶段修复。

---

## P9-T02：用户人工走查

`[ ]` 待开始

依据：用户最终签字。

实现 agent：用户。审计 agent：用户。

动作步骤：用户在浏览器中用以下 8 个 demo 角色（与 P2-T09 fixtures/dev seed 中预设的账号清单一致）完整走一遍基座流程：sys_admin.demo、ceo.demo、gm.demo、hr.demo、finance.demo、pm.demo、dept_manager.demo、employee.demo、worker.demo（共 9 个，每个用 password '123456' 登录）。每个角色覆盖：登录、菜单、个人中心、首装（仅 sys_admin / ceo 角色）、配置、通知、附件上传下载、操作日志。

完成阈值：用户口头或书面确认无阻塞问题。

验收方式：用户签字。

---

## P9-T03：阶段归档

`[ ]` 待开始

依据：基座完成后归档本计划，准备进入业务模块回填阶段。

实现 agent：Orchestrator。审计 agent：QA Engineer。

动作步骤：
1. 把本 TODO.md 所有任务状态推进到 [x]；
2. ARCHITECTURE.md 增加"基座 init 完成于 YYYY-MM-DD（具体填实际日期）"的阶段记录；
3. 把本 TODO.md 整体复制到 `docs/archive/TODO_base_init_<YYYY-MM-DD>.md`（按实际日期命名）作为阶段验收依据存档（不能直接清空，否则 P8 orphan init 后这份验收记录就丢失了）；TODO.md 主体可改为下一阶段（业务模块回填）的初始计划骨架；
4. 通知用户进入下一阶段（业务模块回填）。

完成阈值：
- 文档状态一致；
- 用户已收到通知。

验收方式：QA Engineer 复查。
