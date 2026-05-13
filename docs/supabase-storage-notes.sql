-- Supabase Storage：为「笔记附件 + 便签缩略图」准备公开读 bucket（与代码中 getPublicUrl 一致）
-- 在 Supabase Dashboard → SQL Editor 中粘贴执行（可按需改 bucket 名，并与 .env 中 SUPABASE_STORAGE_BUCKET 一致）
--
-- 若已通过 Dashboard 手动创建了同名 bucket，可跳过 INSERT，仅执行策略部分。

-- 1) 创建公开 bucket `notes`（id 与 name 通常与 bucket 名一致）
insert into storage.buckets (id, name, public)
values ('notes', 'notes', true)
on conflict (id) do update
  set public = excluded.public;

-- 2) 允许匿名读取该 bucket 中的对象（浏览器 iframe / img 拉取公网 URL 时需要）
drop policy if exists "notes_public_select" on storage.objects;
create policy "notes_public_select"
on storage.objects
for select
to public
using (bucket_id = 'notes');

-- 说明：本应用服务端使用 Service Role 上传文件，上传走 Admin API，一般不受 storage.objects 写入策略限制。
-- 若你在 Dashboard 中关闭了「Service role 绕过 RLS」或遇到上传 403，再在 Supabase 文档中补充 INSERT 策略（面向 service_role 或 authenticated）。
