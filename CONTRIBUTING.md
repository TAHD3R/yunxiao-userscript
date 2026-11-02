# 贡献指南

## 开发调试

脚本为单文件 `yunxiao-enhance.user.js`，无构建步骤。

1. Tampermonkey → 管理面板 → + 新建脚本，粘贴本地文件内容保存；或开启「允许访问文件网址」后 `@require file://` 本地路径
2. 打开 https://devops.aliyun.com ，控制台过滤 `[云效增强]` 查看脚本日志
3. 心跳 / 换票间隔常量在脚本顶部 `TB_INTERVAL` / `AONE_INTERVAL`，调试时可临时调小

## Commit 规范

Conventional Commits，scope 限定：`dark`（暗色）、`keepalive`（续登）、`toggle`（切换按钮）、`meta`（版本发布）、`repo`（仓库设施）、`deps`、`ci`、`docs`。

```
feat(keepalive): probe heartbeat endpoint on real session
fix(dark): compensate overlay backdrop inversion
chore(meta): bump version to 0.6.0
```

commit-msg 钩子（commitlint）本地强制校验。

## 发版流程

1. 修改 `yunxiao-enhance.user.js` 元块 `@version`（语义化递增），同步 `CHANGELOG.md`
2. 提交 `chore(meta): bump version to X.Y.Z` 并合入 `main`
3. `git tag vX.Y.Z && git push origin vX.Y.Z`
4. Release Action 自动创建 GitHub Release 并附加脚本文件；GreasyFork 每日检查同步源 URL，`@version` 变化即发布新版

注意：CI 的元块校验要求 `@version` 不小于最新 tag（防手滑回退版本）；发版漏 bump 会在第 3 步前的自查中发现。

## 校验工具

- `npm run lint` — ESLint（含 GM_* 全局声明检查）
- `npm run check-meta` — 元块完整性：必备字段、语义化版本、`@connect` 覆盖脚本内所有请求域名
