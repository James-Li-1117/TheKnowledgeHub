import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function NotesListPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const notes = await prisma.note.findMany({
    where: { authorId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      course: { select: { code: true, id: true } },
      chapter: { select: { title: true, id: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">我的笔记</h1>
        <Link href="/notes/new" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
          新建笔记
        </Link>
      </div>
      {notes.length === 0 ? (
        <p className="text-slate-500">还没有笔记，去上传第一篇吧。</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">{n.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {n.course.code}
                    {n.chapter ? ` · ${n.chapter.title}` : ""}
                  </p>
                </div>
                {n.chapter && (
                  <Link
                    className="text-xs text-emerald-400 hover:underline"
                    href={`/courses/${n.course.id}/chapter/${n.chapter.id}`}
                  >
                    章节
                  </Link>
                )}
              </div>
              {n.content && <p className="mt-2 line-clamp-3 text-sm text-slate-400">{n.content}</p>}
              {n.tags.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">标签：{n.tags.join(", ")}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
