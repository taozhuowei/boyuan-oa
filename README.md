# 博渊 OA 工作台

面向中小型建筑施工企业的内部办公协同系统，包含 H5 管理后台和微信小程序端。

## 核心架构

```
┌─────────────┐    ┌─────────────┐
│  小程序端    │    │   H5 端     │
│  (uni-app)  │    │  (Nuxt 3)   │
└──────┬──────┘    └──────┬──────┘
       │                  │
       └────────┬─────────┘
                │ HTTP / REST
                ▼
       ┌─────────────────┐
       │  Spring Boot    │
       │  PostgreSQL     │
       └─────────────────┘
```

## 目录结构

| 目录 | 说明 |
|------|------|
| [app/h5/](./app/h5/) | H5 前端（Nuxt 3 + Ant Design Vue） |
| [app/mp/](./app/mp/) | 小程序前端（uni-app） |
| [app/shared/](./app/shared/) | 前端共享类型和工具 |
| [server/](./server/) | 后端服务（Spring Boot + MyBatis-Plus） |
| [docs/](./docs/) | 技术文档 |
| [test/](./test/) | 测试设计文档和集成测试 |
| [tools/](./tools/) | 部署脚本和运维工具 |

## 快速开始

```bash
# 后端
cd server && mvn spring-boot:run

# H5 前端
cd app/h5 && npm run dev

# 小程序
cd app/mp && npm run dev
```

## 运行测试

```bash
# 后端单元测试 + 集成测试
cd server && mvn test

# H5 前端单元测试
cd app/h5 && npm run test

# 小程序单元测试
cd app/mp && npm run test
```

---

## 生产环境部署

### 环境准备

| 依赖 | 版本要求 | 备注 |
| ---- | -------- | ---- |
| Linux 服务器 | Ubuntu 22.04 / Debian 12 推荐 | — |
| Docker | ≥ 24.0 | 后端容器化部署 |
| PostgreSQL | ≥ 15 | 可使用云数据库或自建 |
| Nginx | ≥ 1.24 | H5 静态文件 + API 反代 |
| Node.js | ≥ 20 LTS | 仅构建时需要，运行时不需要 |
| Java | 21（JRE） | 仅直接运行 JAR 时需要 |

### 1. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填写所有 [必填-生产] 项
vim .env
```

必须填写的变量：

| 变量 | 说明 |
|------|------|
| `DB_URL` | PostgreSQL 连接串 |
| `DB_USERNAME` / `DB_PASSWORD` | 数据库账号 |
| `JWT_SECRET` | JWT 签名密钥（`openssl rand -base64 64`） |
| `SIGNATURE_AES_KEY` | 签名加密密钥（`openssl rand -hex 32`） |
| `OA_UPLOAD_DIR` | 附件存储目录，如 `/var/oa/uploads` |

### 2. 部署后端（Docker）

**Dockerfile 说明**：项目根目录的 `Dockerfile` 用于打包**后端 Spring Boot 服务**（不含前端）。它分两阶段构建：第一阶段用 JDK 编译打包 JAR，第二阶段用更小的 JRE 镜像运行，以非 root 用户 `oa` 启动，内置健康检查，强制加载 `prod` 配置文件。

```bash
# 构建镜像
docker build -t boyuan-oa-backend:latest .

# 运行容器（从 .env 注入环境变量）
docker run -d \
  --name oa-backend \
  --env-file .env \
  -p 8080:8080 \
  -v /var/oa/uploads:/var/oa/uploads \
  --restart unless-stopped \
  boyuan-oa-backend:latest
```

> 如果 `OA_UPLOAD_DIR` 设为 `/var/oa/uploads`，`-v` 参数需与其保持一致。

**健康检查**：

```bash
curl http://localhost:8080/actuator/health
# 返回 {"status":"UP"} 表示正常
```

#### 使用部署脚本（替代 docker run）

`tools/deploy/update.sh` 支持不停机热更新，`rollback.sh` 支持一键回滚：

```bash
# 将新 JAR 上传到服务器
scp server/target/backend-*.jar user@server:/opt/boyuan-oa/app-new.jar

# 在服务器执行更新（自带健康检查，失败自动回滚）
OA_DEPLOY_DIR=/opt/boyuan-oa bash tools/deploy/update.sh

# 手动回滚到上一版本
OA_DEPLOY_DIR=/opt/boyuan-oa bash tools/deploy/rollback.sh
```

### 3. 部署 H5 前端（静态文件）

H5 是纯 SPA（`ssr: false`），构建产物为静态文件，通过 Nginx 托管。

```bash
# 安装依赖
yarn install

# 构建（指定后端地址，构建时不需要后端运行）
SERVER_PORT=8080 yarn build:h5
# 产物位置：app/h5/.output/public/
```

**Nginx 配置示例**：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # H5 静态文件
    root /var/www/boyuan-oa;
    index index.html;

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 10s;
        proxy_read_timeout 60s;
    }
}
```

```bash
# 将构建产物同步到 Nginx 目录
rsync -av --delete app/h5/.output/public/ /var/www/boyuan-oa/
nginx -s reload
```

### 4. 小程序（MP）

小程序需发布到微信平台，不涉及服务器部署。

```bash
# 构建微信小程序包
yarn build:mp
# 产物位置：app/mp/dist/build/mp-weixin/
```

用微信开发者工具打开 `app/mp/dist/build/mp-weixin/`，提交审核后上线。小程序通过同一后端接口地址访问，需在微信公众平台将域名加入合法域名白名单。

### 5. 数据库初始化

后端使用 **Flyway** 管理数据库迁移，首次启动时自动执行：

```text
server/src/main/resources/db/migration/
├── V1__init_schema.sql   # 建表
└── V2__init_data.sql     # 基础数据（角色、默认配置等）
```

生产环境只需确保 `DB_URL` 对应的数据库已创建，Flyway 会自动完成剩余初始化，无需手动执行 SQL。

```sql
-- 在 PostgreSQL 中创建数据库（仅首次）
CREATE DATABASE boyuan_oa OWNER oa;
```

### 部署检查清单

- [ ] `.env` 所有 `[必填-生产]` 项已填写
- [ ] `JWT_SECRET` 和 `SIGNATURE_AES_KEY` 已使用随机值，未使用默认占位值
- [ ] `OA_UPLOAD_DIR` 目录已创建且可写
- [ ] 数据库已创建，账号权限正常
- [ ] 后端健康检查 `/actuator/health` 返回 `UP`
- [ ] Nginx 已配置 `/api/` 反代，前端能正常调用接口
- [ ] HTTPS 证书已配置（生产环境强烈建议）

---

## 声明

- 本项目为私有项目，未经授权不得使用
- 详见 [docs/](./docs/) 目录下的架构设计和业务文档
