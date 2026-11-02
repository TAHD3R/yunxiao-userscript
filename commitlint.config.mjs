export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      ["dark", "keepalive", "toggle", "meta", "repo", "deps", "ci", "docs"],
    ],
  },
};
