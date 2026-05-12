# Deploy: Vercel + Supabase

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL**: run `npx prisma db push` or migrations against the Supabase Postgres connection string (Settings → Database → URI).
3. **Storage**: create a public or signed bucket named `notes` (or set `SUPABASE_STORAGE_BUCKET` in env).
4. Copy **Project URL**, **anon key**, and **service role key** (server only).

## 2. Environment variables

Set on Vercel (and locally in `.env`):

| Variable | Where |
|----------|--------|
| `DATABASE_URL` | Supabase **Transaction pooler**（常见 `:6543` + `pgbouncer=true`） |
| `DIRECT_URL` | Supabase **Session/Direct**（常见同一 host 的 `:5432`）；Prisma migrate / `db push` 需要，否则易卡住 |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` on Vercel |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role (never expose to client) |
| `SUPABASE_STORAGE_BUCKET` | default `notes` |

## 3. Build & migrate

```bash
npm install
npx prisma migrate deploy   # or db push for prototyping
npm run db:seed             # seed courses (re-run clears app data except users)
npm run build
```

## 4. Vercel

- Import Git repo; framework: Next.js.
- Add env vars; deploy.
- After first deploy, run seed against production DB from a trusted machine if needed.

## 5. Backups & monitoring

- Enable Supabase **daily backups** (plan-dependent).
- Use Vercel **Analytics / Logs** for errors; optional Sentry DSN later.

## 6. Auth notes

- Email/password via Credentials + JWT session; Prisma stores users.
- To add OAuth later, keep `Account` / `Session` models and extend `src/auth.ts` providers.
