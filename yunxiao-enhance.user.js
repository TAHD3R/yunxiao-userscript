// ==UserScript==
// @name         云效增强：暗黑模式 + 自动续登
// @namespace    https://devops.aliyun.com/
// @version      0.5.1
// @description  云效暗黑模式（跟随系统/可锁定）与自动续登（心跳保活 + 掉线静默恢复），支持 devops / codeup / flow
// @author       TAHD3R
// @homepageURL  https://github.com/TAHD3R/yunxiao-userscript
// @supportURL   https://github.com/TAHD3R/yunxiao-userscript/issues
// @icon         https://img.alicdn.com/imgextra/i2/O1CN01nIx1U11JaCIEA0Jix_!!6000000001044-2-tps-240-240.png
// @match        https://devops.aliyun.com/*
// @match        https://codeup.aliyun.com/*
// @match        https://flow.aliyun.com/*
// @connect      devops.aliyun.com
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// @noframes
// @license      MIT
// ==/UserScript==

(() => {
  "use strict";

  // ============ 暗黑模式 ============
  // invert 打底。contrast(0.92) 抬黑位做表面分层（解决死黑压平），saturate(0.85)
  // 抑制霓虹感。2026-11 实测：文字对比 p10 6.12，不达标 3/212 且均为亮色模式原生缺陷。
  // 三域均无文档级滚动，filter 放 html 上不破坏 fixed 弹窗。
  const DARK_CSS = `
    html { filter: invert(1) hue-rotate(180deg) saturate(0.85) brightness(1.02) contrast(0.92); background: #e8e8e8; }
    img, video, picture, canvas, iframe, embed, object, [style*="background-image"] {
      filter: invert(1) hue-rotate(-180deg) contrast(1.087) brightness(0.980) saturate(1.176);
    }
    /* 原生深色容器（代码编辑器）二次还原，避免被反转成浅色 */
    .CodeMirror, .monaco-editor, .ace_editor,
    pre:has(> .json-dict), pre:has(> code.hljs), pre:has(> code[class*="language-"]) {
      filter: invert(1) hue-rotate(-180deg) contrast(1.087) brightness(0.980) saturate(1.176);
    }
    /* 黑色阴影/遮罩 invert 后变白晕：声明亮色值，经反转渲染为暗色 */
    .next-dialog, .next-overlay-inner, .next-popup, .next-menu, .next-select-dropdown {
      box-shadow: 0 12px 48px rgba(255,255,255,0.5) !important;
    }
    .next-card { box-shadow: 0 3px 8px rgba(255,255,255,0.06) !important; }
    .next-overlay-backdrop { background: rgba(255,255,255,0.4) !important; }
    /* 原设计即不达标的次级文字：提亮（写的是反转前色值，显示为其反转） */
    span.aone-biz-today-work-workbench-calendar-week,
    div.tb-navigation-search-shortcut,
    span[class*="titleDate"], span[class*="title-date"],
    a[class*="panelcontentTitleLink"],
    div.src--cardLabel--1dmT1M2 { color: #6b6b6b !important; }
    span.search-bar-mask-text,
    .teamix-result .title, .teamix-result .desc { color: #5f5f5f !important; }
    input::placeholder, textarea::placeholder { color: #7f7f7f !important; opacity: 1; }
  `;
  const styleEl = document.createElement("style");
  styleEl.id = "yx-dark-style";

  // 仿站点深色悬浮提示；颜色随主题做反转补偿（暗色下声明亮色值渲染为深色）
  const TOOLTIP_CSS = (bg, fg) => `
    #yx-theme-toggle { position: relative; }
    #yx-theme-toggle::after {
      content: attr(data-tip); display: none; position: absolute; z-index: 10000;
      top: calc(100% + 10px); left: 50%; transform: translateX(-50%);
      background: ${bg}; color: ${fg}; font-size: 12px; line-height: 1;
      padding: 8px 12px; border-radius: 4px; white-space: nowrap; pointer-events: none;
    }
    #yx-theme-toggle::before {
      content: ""; display: none; position: absolute; z-index: 10000;
      top: calc(100% + 4px); left: 50%; transform: translateX(-50%);
      border: 6px solid transparent; border-bottom-color: ${bg}; pointer-events: none;
    }
    #yx-theme-toggle:hover::after, #yx-theme-toggle:hover::before { display: block; }
  `;

  const getMode = () => GM_getValue("yxThemeMode", "auto"); // auto | light | dark
  const systemDark = () => matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedDark = () => {
    const mode = getMode();
    return mode === "dark" || (mode === "auto" && systemDark());
  };
  const applyTheme = () => {
    styleEl.textContent = resolvedDark()
      ? DARK_CSS + TOOLTIP_CSS("#dcdcdc", "#131313")
      : TOOLTIP_CSS("#2b2b2b", "#e8e8e8");
    if (!styleEl.parentNode) document.documentElement.appendChild(styleEl);
  };

  applyTheme();
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getMode() === "auto") applyTheme();
  });

  for (const mode of ["auto", "light", "dark"]) {
    GM_registerMenuCommand(
      `主题：${{ auto: "跟随系统", light: "亮色", dark: "暗色" }[mode]}${getMode() === mode ? " ✓" : ""}`,
      () => {
        GM_setValue("yxThemeMode", mode);
        applyTheme();
        console.info(`[云效增强] 主题已切换为 ${mode}`);
      }
    );
  }

  // ============ 主题切换按钮（头像左侧） ============
  // 复用云效导航原生 .tb-navigation-entrance 结构（32x32，与帮助/铃铛同款观感；
  // 原生 hover 是 JS 驱动，故自带 hover 反馈）。导航栏 DOM 顺序为从右到左：
  // 插在头像 wrapper 之后即视觉左侧。flow 头部无此结构，不注入。
  const TOGGLE_ICONS = { auto: "◐", dark: "☾", light: "☀" };
  const TOGGLE_LABELS = { auto: "跟随系统", dark: "暗色", light: "亮色" };
  let toggleBtn = null;
  const renderToggle = () => {
    if (!toggleBtn) return;
    const mode = getMode();
    const tip = `主题：${TOGGLE_LABELS[mode]}（点击切换）`;
    toggleBtn.firstChild.textContent = TOGGLE_ICONS[mode];
    toggleBtn.dataset.tip = tip;
    toggleBtn.setAttribute("aria-label", tip);
  };
  const injectToggle = () => {
    if (document.getElementById("yx-theme-toggle")) return true;
    const bar = document.querySelector(".system-bar-right");
    const avatar = bar?.querySelector(".tb-navigation-avatar");
    if (!bar || !avatar) return false;
    const btn = document.createElement("div");
    btn.id = "yx-theme-toggle";
    btn.className = "tb-navigation-entrance";
    btn.style.cssText =
      "width:32px;height:32px;border-radius:4px;display:flex;align-items:center;justify-content:center;" +
      "cursor:pointer;color:#8f8f8f;font-size:16px;background:transparent;";
    btn.appendChild(document.createElement("span"));
    btn.addEventListener("mouseenter", () => { btn.style.background = "rgba(128,128,128,0.25)"; });
    btn.addEventListener("mouseleave", () => { btn.style.background = "transparent"; });
    btn.addEventListener("click", () => {
      const order = ["auto", "dark", "light"];
      GM_setValue("yxThemeMode", order[(order.indexOf(getMode()) + 1) % 3]);
      applyTheme();
      renderToggle();
    });
    avatar.parentElement.parentNode.insertBefore(btn, avatar.parentElement.nextSibling);
    toggleBtn = btn;
    renderToggle();
    return true;
  };
  // 头像由 SPA 异步渲染，出现后注入一次即停
  const toggleObserver = new MutationObserver(() => {
    if (injectToggle()) toggleObserver.disconnect();
  });
  const startToggleWatch = () => {
    if (!injectToggle()) toggleObserver.observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) startToggleWatch();
  else document.addEventListener("DOMContentLoaded", startToggleWatch, { once: true });

  // ============ 自动续登 ============
  // 凭据栈（2026-11 实测）：
  //   TB_ACCESS_TOKEN  72h 滑动，devops metric GET 响应换发 → 30min 心跳续
  //   AONE_SESSION     24h 固定不滑动，GET devops /login 无交互 302 回来并换新票 → 12h 主动换
  //   SSO 主登录态过期后 /login 链路需人工登录 → 自动恢复放弃并提示
  // 掉线信号：API 401 + errorCode:"Unauthorized"
  // 页面一打开即自动运行并按持久化时间戳补签到期的续签，无需任何手动操作。
  const HOST = "https://devops.aliyun.com";
  const TB_KEEPALIVE_URL = HOST + "/metric/api/card/project/workitem-done-distribution?phases=100&types=1,3&timeUsage=";
  const LOGIN_REFRESH_URL = HOST + "/login?next_url=" + encodeURIComponent(HOST + "/");
  const TB_INTERVAL = 30 * 60 * 1000;
  const AONE_INTERVAL = 12 * 60 * 60 * 1000;
  const TICK = 5 * 60 * 1000;

  const state = { recoveries: 0, gaveUp: false };

  // GM_xmlhttpRequest 跨域免 CORS、带 cookie，codeup/flow 页面也能续 devops 会话
  const gmFetch = (url) =>
    new Promise((resolve) => {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        anonymous: false,
        timeout: 20000,
        onload: (r) => resolve({ status: r.status, finalUrl: r.finalUrl || "" }),
        onerror: () => resolve({ status: "ERR:network" }),
        ontimeout: () => resolve({ status: "ERR:timeout" }),
      });
    });

  // /login 换票成功 = 200 且最终没有落在登录链路（SSO 失效时会 follow 到 account-devops/passport）
  const loginRefresh = async () => {
    const r = await gmFetch(LOGIN_REFRESH_URL);
    const ok = r.status === 200 && !/account-devops|passport|login\.htm/.test(r.finalUrl);
    if (ok) GM_setValue("yxLastAoneOk", Date.now());
    return ok ? "ok" : `fail(${r.status} ${r.finalUrl.slice(0, 60)})`;
  };

  const tryRecover = async () => {
    if (state.gaveUp || state.recoveries >= 3) return;
    const res = await loginRefresh();
    if (res === "ok") {
      state.recoveries++;
      console.info(`[云效增强] 会话已通过 /login 静默恢复（第 ${state.recoveries} 次）`);
    } else {
      state.gaveUp = true;
      console.warn(`[云效增强] 自动恢复失败（${res}），SSO 主登录态可能已过期，请手动登录一次`);
    }
  };

  const tick = async () => {
    if (state.gaveUp) return;
    if (Date.now() - GM_getValue("yxLastTbOk", 0) >= TB_INTERVAL) {
      const r = await gmFetch(TB_KEEPALIVE_URL);
      if (r.status === 200) GM_setValue("yxLastTbOk", Date.now());
      else if (r.status === 401) await tryRecover();
      else console.warn(`[云效增强] 心跳异常状态：${r.status}`);
    }
    if (Date.now() - GM_getValue("yxLastAoneOk", 0) >= AONE_INTERVAL) {
      const res = await loginRefresh();
      if (res !== "ok") console.warn(`[云效增强] AONE_SESSION 换票：${res}`);
    }
  };

  tick();
  setInterval(tick, TICK);

  GM_registerMenuCommand("续登状态", () => {
    const fmt = (k) => {
      const t = GM_getValue(k, 0);
      return t ? new Date(t).toLocaleString() : "从未";
    };
    alert(
      `自动续签${state.gaveUp ? "已停止（需手动登录）" : "运行中"}\n` +
        `TB 心跳上次成功：${fmt("yxLastTbOk")}\n` +
        `AONE 换票上次成功：${fmt("yxLastAoneOk")}\n` +
        `本次页面恢复次数：${state.recoveries}`
    );
  });
})();
