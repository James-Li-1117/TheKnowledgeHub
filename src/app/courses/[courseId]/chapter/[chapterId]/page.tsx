import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export default async function ChapterDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { courseId, chapterId } = await params;
  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, courseId },
    include: { course: true },
  });
  if (!chapter) notFound();

  const notes = await prisma.note.findMany({
    where: { courseId, chapterId },
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <Link href={`/courses/${courseId}`} className="text-sm font-medium text-emerald-600 hover:underline">
        ← 返回 {chapter.course.code}
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">{chapter.title}</h1>
      <p className="text-sm text-slate-600">本章所有用户笔记（仅作者可编辑，见笔记列表）。</p>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">本章笔记</h2>
        {notes.length === 0 ? (
          <p className="text-slate-600">暂无笔记。</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm">
                <p className="font-medium text-slate-900">{n.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  提交者：{n.author.name || n.author.email}
                  {n.authorId === session.user.id ? (
                    <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">我</span>
                  ) : (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">只读</span>
                  )}
                </p>
                {n.content && <p className="mt-1 line-clamp-3 text-sm text-slate-600">{n.content}</p>}
                {n.fileUrl && (
                  <a
                    href={n.fileUrl}
                    className="mt-2 inline-block text-sm font-medium text-emerald-600 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    附件：{n.fileName || "下载"}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/notes/new?courseId=${courseId}&chapterId=${chapterId}`}
          className="mt-4 inline-block rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-600"
        >
          添加笔记
        </Link>
      </section>
    </div>
  );
}
