import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { NotesListClient } from "./NotesListClient";

export default async function NotesListPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const sp = await searchParams;
  const createdId = sp.created?.trim() || null;

  const notes = await prisma.note.findMany({
    where: { authorId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      course: { select: { code: true, id: true } },
      chapter: { select: { title: true, id: true } },
    },
  });

  const listPayload = notes.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    tags: n.tags,
    course: n.course,
    chapter: n.chapter,
  }));

  const highlightFound = createdId ? notes.some((n) => n.id === createdId) : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">我的笔记</h1>
        <Link
          href="/notes/new"
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-600"
        >
          上传笔记
        </Link>
      </div>

      {createdId && highlightFound ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          以下高亮条目为你刚刚保存的笔记。
        </p>
      ) : null}

      {createdId && !highlightFound && notes.length > 0 ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/90">
          未在列表中找到对应笔记，可能排序已变化。你可前往
          <Link href="/notes/new" className="mx-1 text-emerald-400 underline">
            上传笔记
          </Link>
          继续添加。
        </p>
      ) : null}

      <NotesListClient notes={listPayload} createdId={createdId} />
    </div>
  );
}
