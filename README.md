# 云效增强：暗黑模式 + 自动续登

[![License: MIT](https://img.shields.io/github/license/TAHD3R/yunxiao-userscript)](LICENSE)
[![GreasyFork](https://img.shields.io/greasyfork/v/603401)](https://greasyfork.org/zh-CN/scripts/603401)
[![GreasyFork installs](https://img.shields.io/greasyfork/dt/603401)](https://greasyfork.org/zh-CN/scripts/603401)

为阿里云·云效（Yunxiao）提供**暗黑模式**与**登录会话自动续期**的用户脚本，覆盖项目协作（devops）、代码管理（Codeup）、流水线（Flow）三个站点。

## 安装

- **GreasyFork（推荐）**：[https://greasyfork.org/zh-CN/scripts/603401](https://greasyfork.org/zh-CN/scripts/603401)
- **GitHub 直装**：Tampermonkey 中打开 [main 分支源码](https://github.com/TAHD3R/yunxiao-userscript/raw/main/yunxiao-enhance.user.js) 即触发安装；后续更新需手动或改用 GreasyFork 渠道

## 功能

**暗黑模式**

- 全站 invert 反转打底，图片 / 头像 / 视频自动还原，代码编辑器（原生深色）二次还原
- 弹窗阴影与弹层遮罩做了反转补偿，无白色光晕 / 白纱
- 文本对比度经 WCAG 逐元素实测审计，正文与次级文字均达标
- 默认跟随系统 `prefers-color-scheme`；导航栏头像左侧按钮循环切换 **◐ 跟随系统 → ☾ 暗色 → ☀ 亮色**，选择持久保存，油猴菜单亦可切换

**自动续登**

- 每 30 分钟心跳续期 `TB_ACCESS_TOKEN`（72h 滑动窗口）
- 每 12 小时经 SSO 链路静默换发 `AONE_SESSION`（24h 固定有效期）
- 心跳 401 时自动走 SSO 恢复（限 3 次防循环）；多标签页共享时间戳，不重复请求
- 菜单「续登状态」弹窗显示最近续期时间与运行状态

## 工作原理

2026-11 在真实登录态下实测，云效浏览器侧共四层凭据，续登策略按层施加：

| 凭据 | 生命周期 | 实测行为 | 脚本策略 |
| --- | --- | --- | --- |
| `TB_ACCESS_TOKEN` | 72h 滑动 | metric 网关 GET 响应自动换发 | 30min 心跳 |
| `AONE_SESSION` | 24h 固定 | `GET /login?next_url=…` 无交互 302 回源并换新票 | 12h 主动换发 |
| `TEAMBITION_SESSIONID` | 30 天滑动 | 正常访问即刷新 | 无需干预 |
| SSO 主登录态（`.aliyun.com`） | 浏览器会话 | 过期后必须人工登录 | 401 兜底 + 明确提示 |

掉线信号为 API `401 + errorCode:"Unauthorized"`。阿里云登录有效期的绝对上限（主账号最长 72h / RAM 用户最长 24h）是平台约束，见[官方文档](https://help.aliyun.com/zh/yunxiao/user-guide/how-to-prompt-frequently-for-login-expired)。

## 已知限制

- 浏览器全部关闭后续登停止；重新打开云效页面时脚本会自动补签到期的续签
- SSO 主登录态过期（换浏览器 / 清 Cookie）后无法免密恢复，需手动登录一次，脚本会明确提示而非静默失败
- `flow.aliyun.com` 头部无导航组件，不注入主题切换按钮（暗色与续登正常生效）

## 隐私说明

脚本仅向 `devops.aliyun.com` 发送已登录的 GET 请求（心跳与换票），不收集、不上传任何数据，无外部代码依赖。

## 开发

见 [CONTRIBUTING.md](CONTRIBUTING.md)。开发调试时控制台过滤 `[云效增强]` 前缀可查看脚本日志。

## License

[MIT](LICENSE)
