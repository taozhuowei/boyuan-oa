# Knip — TypeScript 死代码检测

Knip 检测 TypeScript/Vue 项目中的未使用文件、导出、依赖项。

## 运行

```bash
# 从仓库根目录运行，仅扫描 app/h5 工作区
yarn knip
```

## 结果解读

Knip 输出四类问题：

- **Unused files** — 文件存在但从未被引用，可安全删除
- **Unused exports** — 导出符号未在任何地方导入，可移除 `export` 关键字或删除整个声明
- **Unused devDependencies** — `package.json` 中列出但代码中未 `import` 的开发依赖，可 `yarn remove` 删除
- **Unlisted dependencies** — 代码中被 `import` 但未在 `package.json` 中声明的依赖（通过传递依赖获取，应显式声明）

## 豁免方式

对于确实需要保留的误报项，在 `knip.json` 中配置豁免：

```json
{
  "workspaces": {
    "app/h5": {
      "ignoreDependencies": ["terser", "vue-tsc"],
      "ignoreExportsUsedInFile": true
    }
  }
}
```

代码层面豁免单个导出（不建议滥用）：

```typescript
/** @knip-ignore — used by external tool */
export function internalHelper() { ... }
```

## 当前豁免项说明

- `vue-router`, `@vue/runtime-core` — Nuxt 3 的内置传递依赖，由框架注入，不需要显式声明
- `vue-tsc` — 由 `nuxt typecheck` 命令内部调用，knip 无法检测字符串引用
- `terser` — 在 `nuxt.config.ts` 的 `minify: 'terser'` 字符串选项中引用，knip 无法静态分析

## 集成

CI 中通过 `yarn knip` 退出码判断：退出码 0 表示无问题，非零表示有死代码发现。

在 husky pre-push 钩子或 GitHub Actions Tier 1 workflow 中引入：

```yaml
- name: Dead code check
  run: yarn knip
```
