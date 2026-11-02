import js from "@eslint/js";

export default [
  { ignores: ["node_modules/"] },
  js.configs.recommended,
  {
    files: ["**/*.user.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        // 浏览器全局（脚本实际用到的）
        document: "readonly",
        location: "readonly",
        matchMedia: "readonly",
        MutationObserver: "readonly",
        console: "readonly",
        setInterval: "readonly",
        fetch: "readonly",
        alert: "readonly",
        // 油猴 API
        GM_getValue: "readonly",
        GM_setValue: "readonly",
        GM_registerMenuCommand: "readonly",
        GM_xmlhttpRequest: "readonly",
      },
    },
  },
  {
    files: ["scripts/**/*.mjs", "eslint.config.mjs", "commitlint.config.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { URL: "readonly", console: "readonly", process: "readonly" },
    },
  },
];
