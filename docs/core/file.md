# core.file — 文件与附件

## 职责

处理业务附件的上传、存储、下载与访问控制，并管理员工电子签名的绑定与状态查询；附件以本地文件系统存储，元数据记录在数据库，下载时按调用者身份执行权限校验。

## 主要功能

- 文件上传：接收 multipart 文件，校验 MIME 白名单（PDF/JPEG/PNG/GIF/WEBP/DOC/DOCX/XLS/XLSX）、扩展名白名单及前 8 字节 magic bytes 一致性，存至 `${oa.upload-dir}/YYYY-MM-DD/{uuid}{ext}`，计算 MD5 并写入 attachment_meta 表
- 文件下载：按 attachmentId 查询元数据，执行访问控制后返回文件流；响应头使用 RFC 5987 编码处理中文文件名
- 访问控制规则：上传者本人、CEO/FINANCE/HR（审计角色）直接放行；PROJECT_MANAGER 仅限本人负责项目关联的附件；DEPARTMENT_MANAGER 仅限本部门成员提交的附件
- 电子签名绑定：EMPLOYEE/WORKER 提交 Base64 签名图片与 PIN 码（4-6 位），绑定后写入 signature 表
- 电子签名状态查询：返回当前用户是否已绑定签名（`{ "bound": true/false }`）

## 对外暴露的接口

- `POST /api/attachments/upload` — 上传附件（已认证用户，multipart/form-data）
- `GET /api/attachments/{id}` — 下载附件（已认证用户，权限校验）
- `POST /api/signature/bind` — 绑定电子签名（EMPLOYEE/WORKER）
- `GET /api/signature/status` — 查询签名绑定状态（EMPLOYEE/WORKER）

## 依赖

- `core.employee` — 通过 AttachmentAccessService 查询上传者归属和部门信息用于访问控制

## 技术债 / 待完善

- 附件存储在本地文件系统，不支持分布式部署；生产环境须迁移至对象存储（OSS/S3）
- 上传大小限制依赖 Spring 默认配置（multipart.max-file-size），未在业务层显式文档化
- 电子签名 PIN 码以明文传输，服务层应加密存储 PIN 的哈希值，而非原文
