/**
 * 一键本地启动：
 * 1) npm install
 * 2) npm run setup:local
 * 3) 校验 DATABASE_URL 是否为真实值
 * 4) npm run db:push
 * 5) npm run db:seed
 * 6) npm run dev
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");

function runStep(command, args, title) {
  console.log(`\n=== ${title} ===`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function readDatabaseUrl() {
  if (!fs.existsSync(envPath)) return "";
  const env = fs.readFileSync(envPath, "utf8");
  const match = env.match(/^DATABASE_URL=(.*)$/m);
  if (!match) return "";
  return match[1].trim().replace(/^["']|["']$/g, "");
}

function isPlaceholderDatabaseUrl(url) {
  return (
    !url ||
    url.includes("postgres.xxxxx") ||
    url.includes("[YOUR-PASSWORD]")
  );
}

console.log("开始一键本地启动 The Knowledge Hub...");
runStep("npm", ["install"], "安装依赖");
runStep("npm", ["run", "setup:local"], "初始化本地环境");

const databaseUrl = readDatabaseUrl();
if (isPlaceholderDatabaseUrl(databaseUrl)) {
  console.log("\n检测到 .env 里的 DATABASE_URL 仍是占位值。");
  console.log("请先填写真实数据库连接串，然后再执行: npm run start:local");
  process.exit(1);
}

runStep("npm", ["run", "db:push"], "同步数据库结构");
runStep("npm", ["run", "db:seed"], "填充种子数据");
runStep("npm", ["run", "dev"], "启动开发服务器");
