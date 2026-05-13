import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

function isHttpUrl(s: string) {
  return s.startsWith("http://") || s.startsWith("https://");
}

export default async function NoteDetailPage({ params }: { params: Promise<{ noteId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { noteId } = await params;
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: {
      course: { select: { id: true, code: true, title: true } },
      chapter: { select: { id: true, title: true } },
      author: { select: { id: true, name: true, email: true } },
    },
  });
  if (!note) notFound();

  const isOwner = note.authorId === session.user.id;
  const fileUrl = note.fileUrl;
  const localPlaceholder = Boolean(fileUrl?.startsWith("local:"));
  const hasPublicFile = Boolean(fileUrl && !localPlaceholder && isHttpUrl(fileUrl));
  const looksPdf =
    note.mimeType?.toLowerCase().includes("pdf") || note.fileName?.toLowerCase().endsWith(".pdf");
  const canEmbedPdf = hasPublicFile && looksPdf;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/notes" className="font-medium text-emerald-600 hover:underline">
          ← 全部笔记
        </Link>
        <Link href={`/courses/${note.course.id}`} className="font-medium text-emerald-600 hover:underline">
          课程：{note.course.code}
        </Link>
      </div>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">{note.title}</h1>
        <p className="text-sm text-slate-600">
          作者：{note.author.name?.trim() || note.author.email}
          {isOwner ? (
            <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800">我</span>
          ) : (
            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">只读</span>
          )}
        </p>
        <p className="text-xs text-slate-500">
          {note.course.code} — {note.course.title}
          {note.chapter ? ` · ${note.chapter.title}` : ""}
        </p>
        {note.tags.length > 0 ? (
          <p className="text-xs text-slate-500">标签：{note.tags.join(", ")}</p>
        ) : null}
      </header>

      {note.content ? (
        <section className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">正文</h2>
          <pre className="whitespace-pre-wrap break-words text-sm text-slate-700">{note.content}</pre>
        </section>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">附件</h2>

        {!fileUrl ? (
          <p className="text-sm text-slate-600">该笔记没有上传附件。</p>
        ) : localPlaceholder ? (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium text-amber-900">当前环境未配置云存储</p>
            <p className="mt-2 text-xs leading-relaxed text-amber-900/85">
              附件仅在本地占位保存，无法在浏览器中预览 PDF。请在{" "}
              <code className="rounded bg-white/80 px-1">.env</code> 中填写{" "}
              <code className="rounded bg-white/80 px-1">NEXT_PUBLIC_SUPABASE_URL</code>、
              <code className="rounded bg-white/80 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>、
              <code className="rounded bg-white/80 px-1">SUPABASE_SERVICE_ROLE_KEY</code>，并在 Supabase 创建{" "}
              <code className="rounded bg-white/80 px-1">notes</code>（或你配置的）公开读 bucket 后重新上传笔记。
            </p>
          </div>
        ) : !hasPublicFile ? (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium text-amber-900">无法加载附件链接</p>
            <p className="mt-2 text-xs text-amber-900/85">
              附件地址不是可访问的 https 链接。若未配置 Supabase，请按上文说明配置后重新上传。
            </p>
          </div>
        ) : (
          <>
            {canEmbedPdf ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">下方为 PDF 内嵌预览（依赖浏览器与文件地址是否允许嵌入）。</p>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner">
                  <iframe
                    title="PDF 预览"
                    src={fileUrl}
                    className="h-[min(72vh,720px)] w-full min-h-[420px]"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-emerald-600"
                  >
                    新窗口打开 PDF
                  </a>
                  <a
                    href={fileUrl}
                    download={note.fileName ?? undefined}
                    className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    下载
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-slate-600">此附件不是 PDF 或无法在页面内嵌预览。</p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-emerald-600"
                >
                  打开或下载：{note.fileName || "附件"}
                </a>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
