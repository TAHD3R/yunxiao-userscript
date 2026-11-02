// 用户脚本元块校验：必备字段、语义化版本、版本不回退、@connect 覆盖脚本内请求域名
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const scriptPath = new URL("../yunxiao-enhance.user.js", import.meta.url);
const src = readFileSync(scriptPath, "utf8");

const metaMatch = src.match(/==UserScript==([\s\S]*?)==\/UserScript==/);
if (!metaMatch) {
  console.error("✗ 未找到 ==UserScript== 元块");
  process.exit(1);
}
const meta = metaMatch[1];
const body = src.slice(metaMatch.index + metaMatch[0].length);

const field = (name) =>
  [...meta.matchAll(new RegExp(`^//\\s*@${name}\\s+(.+)$`, "gm"))].map((m) => m[1].trim());

const errors = [];

for (const f of ["name", "version", "description", "match", "grant", "license"]) {
  if (field(f).length === 0) errors.push(`缺少 @${f}`);
}

const [version] = field("version");
if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
  errors.push(`@version "${version}" 不是语义化版本`);
}

// 版本不得低于最新 tag（日常提交可持平，发版前需递增）
let lastTag = null;
try {
  lastTag =
    execSync("git tag --sort=-v:refname", { stdio: ["pipe", "pipe", "ignore"] })
      .toString()
      .trim()
      .split("\n")[0] || null;
} catch {
  /* 尚无 tag */
}
if (lastTag && version) {
  const last = lastTag.replace(/^v/, "");
  const pa = version.split(".").map(Number);
  const pb = last.split(".").map(Number);
  const older = pa.slice(0, 3).some((x, i) => x < (pb[i] ?? 0)) && !pa.slice(0, 3).some((x, i) => x > (pb[i] ?? 0));
  if (older) errors.push(`@version ${version} 低于最新 tag ${lastTag}`);
}

// @connect 必须覆盖脚本正文出现的所有 https 域名
const connects = field("connect");
const hosts = [...new Set([...body.matchAll(/https:\/\/([\w.-]+\.\w+)/g)].map((m) => m[1]))];
for (const h of hosts) {
  const covered = connects.some((c) => h === c || h.endsWith("." + c) || c === "*");
  if (!covered) errors.push(`@connect 未声明脚本内请求的域名 ${h}`);
}

if (errors.length) {
  console.error("✗ 元块校验失败：\n  - " + errors.join("\n  - "));
  process.exit(1);
}
console.log(`✓ 元块校验通过（version ${version}，@connect 覆盖 ${hosts.length} 个域名）`);
