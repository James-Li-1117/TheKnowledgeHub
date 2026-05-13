# The Knowledge Hub

多用户 **课程思维导图**（自由子节点 + 节点绑定笔记与预览）与 **笔记上传**；登录用户可查看全部笔记及**提交者**，**仅作者可编辑**自己的笔记。

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

如果你希望“一条命令直接跑起来”，可用：`npm run start:local`  
它会自动执行：安装依赖 -> 初始化 `.env` -> `db:push` -> `db:seed` -> 启动开发服务器。

## Setup

1. `npm install`
2. `npm run setup:local`（若无 `.env` 会从 `env.example` 创建，并写入随机 `AUTH_SECRET`）
3. 编辑 `.env`：填入 **`DATABASE_URL`**；若使用 Supabase **6543 连接池**，务必再填 **`DIRECT_URL`**（:5432 直连，见 `env.example`），否则 `db:push` 可能长时间无输出。
4. `npm run db:push`（或 `npm run db:migrate`）
5. `npm run db:seed`
6. `npm run dev`

或直接：

- `npm run start:local`（自动完成 1~6 的常见流程；若 `DATABASE_URL` 仍是占位值会提示你先填写）

（等价于旧流程：手动 `copy env.example .env` 再填变量。）

## Supabase storage（可选）

创建名为 `notes` 的 bucket（或设置 `SUPABASE_STORAGE_BUCKET`），在 `.env` 中填写 URL 与密钥。未配置时附件仅保存占位元数据；思维导图节点仍可生成文字类预览。

## Deploy（Vercel + Supabase）

- 创建 Supabase 项目：Postgres + Storage bucket `notes`。
- 在 Vercel 上从 `env.example` 同步环境变量。
- 在 CI 或本地对生产库执行：`npx prisma migrate deploy`（或 `db push` 视你的流程而定）。

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |
| `npm run setup:local` | 创建 `.env`、生成 `AUTH_SECRET`、提示填写 `DATABASE_URL` |
| `npm run db:reset-local` | `db:push` 后立刻 `db:seed`（本地开发省事） |
