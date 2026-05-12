import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { recomputeChapterMastery } from "@/lib/progress";

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

  await recomputeChapterMastery(session.user.id, chapterId);
  const progress = await prisma.chapterProgress.findUnique({
    where: { userId_chapterId: { userId: session.user.id, chapterId } },
  });

  const notes = await prisma.note.findMany({
    where: { courseId, chapterId, authorId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <Link href={`/courses/${courseId}`} className="text-sm font-medium text-emerald-600 hover:underline">
        ← 返回 {chapter.course.code}
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">{chapter.title}</h1>
      <p className="text-sm text-slate-600">
        状态：{progress?.completed ? "已完成" : "进行中"} · 掌握度约 {Math.round((progress?.mastery ?? 0) * 100)}%
      </p>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">本章笔记</h2>
        {notes.length === 0 ? (
          <p className="text-slate-600">暂无笔记。</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm">
                <p className="font-medium text-slate-900">{n.title}</p>
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
