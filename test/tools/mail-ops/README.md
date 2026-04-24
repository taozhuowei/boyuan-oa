# mail-ops — 邮箱运维脚本

本目录下脚本**仅用于测试/开发环境**，与业务代码完全解耦：

- 不被 E2E / 单测 / 集成测试引用
- 不被前后端构建链引用
- 手动运行，用于处理测试邮箱积累的历史邮件

## 前置

- `test/.env.test` 已配置 `TEST_EMAIL` + `TEST_EMAIL_IMAP_PASSWORD`（QQ Mail IMAP 凭证）

## 脚本清单

### cleanup.ts —— 彻底删除 OA 系统发出的历史验证码邮件

```
npx tsx test/tools/mail-ops/cleanup.ts
```

用途：dev SMTP 偶尔绕过 QQ Mail 限流发成功，积累大量历史码干扰调试时清理。
搜 subject 含「OA系统」的全部邮件，MOVE 到 Deleted Messages 再 EXPUNGE 彻底销毁。

QQ Mail IMAP 不广播 UIDPLUS，标准 `UID EXPUNGE` 无效。脚本用 IMAP RFC 3501 §6.4.2
的 CLOSE 命令触发隐式 EXPUNGE，QQ Mail 认这个。

### inspect.ts —— 只读诊断

```
npx tsx test/tools/mail-ops/inspect.ts
```

列出各文件夹邮件总数与「OA系统」主题匹配数量，校验 cleanup 效果用。
