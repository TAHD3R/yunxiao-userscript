# Changelog

本项目的所有显著变更记录于此。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.5.1] - 2026-11-02

### Added

- `@icon`（云效官方 CDN 图标）与中文 `@description`、`@homepageURL` / `@supportURL`
- 仓库公开发布准备

## [0.5.0] - 2026-11-02

### Changed

- 主题切换按钮复用云效导航原生 `.tb-navigation-entrance` 结构（32x32，与帮助/铃铛同款观感，自带 hover 反馈）
- 悬浮提示改为 CSS 仿制站点深色气泡（含箭头），颜色按主题反转补偿

## [0.4.0] - 2026-11-02

### Added

- 导航栏头像左侧主题切换按钮：◐ 跟随系统 → ☾ 暗色 → ☀ 亮色，与油猴菜单共享持久化状态

## [0.3.0] - 2026-11-02

### Changed

- 暗色观感优化：`contrast(0.92)` 抬黑位恢复表面分层（修复死黑压平），`saturate(0.85)` 抑制霓虹感
- 弹窗阴影 `.next-dialog` 与弹层遮罩 `.next-overlay-backdrop` 反转补偿，消除白色光晕与白纱
- `titleDate` / `title-date` 连字符变体选择器补齐

## [0.2.0] - 2026-11-02

### Added

- 代码管理（codeup.aliyun.com）与流水线（flow.aliyun.com）域支持（`@match` 扩展）
- 暗色模式：WCAG 逐元素对比度审计与次级文字提亮；原生深色代码编辑器二次还原
- 续登改用 `GM_xmlhttpRequest` 跨域统一心跳；`GM_setValue` 时间戳节流（多标签页防重复）；「续登状态」弹窗

## [0.1.0] - 2026-11-02

### Added

- 首版：invert 暗黑模式（跟随系统 / 可锁定）、TB 心跳保活、401 掉线自动恢复
