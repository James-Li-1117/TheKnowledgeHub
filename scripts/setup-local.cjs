/**
 * 本地首次配置辅助：创建 .env、生成 AUTH_SECRET（若为占位符）、检查 DATABASE_URL。
 * 用法：npm run setup:local
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");
const examplePath = path.join(root, "env.example");

function readEnv() {
  if (!fs.existsSync(envPath)) return null;
  return fs.readFileSync(envPath, "utf8");
}

function writeEnv(content) {
  fs.writeFileSync(envPath, content, "utf8");
}

// 1) 没有 .env 则从 env.example 复制
if (!fs.existsSync(envPath)) {
  if (!fs.existsSync(examplePath)) {
    console.error("缺少 env.example，无法创建 .env");
    process.exit(1);
  }
  fs.copyFileSync(examplePath, envPath);
  console.log("已创建 .env（从 env.example 复制）");
}

let env = readEnv();
if (!env) process.exit(1);

// 2) AUTH_SECRET：若是占位或太短，自动生成
const secretMatch = env.match(/^AUTH_SECRET=(.*)$/m);
const secretVal = secretMatch ? secretMatch[1].replace(/^["']|["']$/g, "") : "";
const needsSecret =
  !secretVal ||
  secretVal.includes("replace-with-random") ||
  secretVal.length < 32;

if (needsSecret) {
  const generated = crypto.randomBytes(32).toString("base64");
  if (/^AUTH_SECRET=.*$/m.test(env)) {
    env = env.replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET="${generated}"`);
  } else {
    env += `\nAUTH_SECRET="${generated}"\n`;
  }
  writeEnv(env);
  console.log("已写入随机 AUTH_SECRET（≥32 字符）");
}

// 3) 检查 DATABASE_URL
const dbMatch = env.match(/^DATABASE_URL=(.*)$/m);
const dbRaw = dbMatch ? dbMatch[1].trim() : "";
const dbVal = dbRaw.replace(/^["']|["']$/g, "");
const looksPlaceholder =
  !dbVal ||
  dbVal.includes("postgres.xxxxx") ||
  dbVal.includes("[YOUR-PASSWORD]");

if (looksPlaceholder) {
  console.log("");
  console.log("【需要你手动完成】在 .env 里把 DATABASE_URL 换成 Supabase「Connect」里复制的 URI。");
  console.log("  密码里的特殊字符要 URL 编码（例如 ? -> %3F , ! -> %21）。");
  console.log("  改完后执行: npx prisma db push && npm run db:seed && npm run dev");
  console.log("");
} else {
  console.log("DATABASE_URL 已填写（请自行确认密码与主机无误）。");
  const hasDirect = /^DIRECT_URL=/m.test(env);
  const usesPooler =
    dbVal.includes("pooler.supabase.com") ||
    dbVal.includes("pgbouncer=true") ||
    /:\s*6543\b/.test(dbVal);
  if (usesPooler && !hasDirect) {
    console.log("");
    console.log("【重要】你正在使用 Supabase 连接池(6543)。请在 .env 增加 DIRECT_URL（Connect 里的 Direct / :5432 那条），");
    console.log("  否则 prisma db push 容易一直卡住。已在 prisma/schema.prisma 启用 directUrl。");
    console.log("");
  }
  console.log("下一步建议: npm run db:push && npm run db:seed && npm run dev");
}
