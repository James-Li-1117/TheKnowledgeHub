# The Knowledge Hub

Multi-user study notes and a **knowledge tree** progress visualization for summer review (math + physics courses).

## 本地运行要准备什么

| 项目 | 说明 |
|------|------|
| **Node.js** | 建议 20 LTS；终端能执行 `node -v`、`npm -v` |
| **PostgreSQL** | 可用 Supabase 云端库；得到 `DATABASE_URL` |
| **`.env` 文件** | 项目根目录（与 `package.json` 同级），**不要**只改 `env.example` |
| **`DIRECT_URL`** | 与 `DATABASE_URL` 同页 Supabase 的 **Direct / :5432**；`db:push` 必需。本机单库可与 `DATABASE_URL` 相同 |
| **`AUTH_SECRET`** | 随机长字符串（≥32）；可运行 `npm run setup:local` 自动生成 |
| **`AUTH_TRUST_HOST`** | 本地开发设为 `true`（模板里已有） |

一键辅助（创建 `.env`、补全 `AUTH_SECRET`）：`npm run setup:local`  
之后你只需确认 `.env` 里的 `DATABASE_URL` 已是真实连接串。

## Setup

1. `npm install`
2. `npm run setup:local`（若无 `.env` 会从 `env.example` 创建，并写入随机 `AUTH_SECRET`）
3. 编辑 `.env`：填入 **`DATABASE_URL`**；若使用 Supabase **6543 连接池**，务必再填 **`DIRECT_URL`**（:5432 直连，见 `env.example`），否则 `db:push` 可能长时间无输出。
4. `npm run db:push`（或 `npm run db:migrate`）
5. `npm run db:seed`
6. `npm run dev`

（等价于旧流程：手动 `copy env.example .env` 再填变量。）

## Supabase storage (optional)

Create a bucket named `notes` (or set `SUPABASE_STORAGE_BUCKET`). Add URL and keys to `.env`. Without Supabase, file uploads store metadata only (you can paste URLs manually later).

## Deploy (Vercel + Supabase)

- Create a Supabase project: Postgres + Storage bucket `notes`.
- Set env vars on Vercel from `env.example`.
- Run migrations: `npx prisma migrate deploy` in CI or locally against production DB.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run setup:local` | 创建 `.env`、生成 `AUTH_SECRET`、提示填写 `DATABASE_URL` |
| `npm run db:reset-local` | `db:push` 后立刻 `db:seed`（本地开发省事） |
