"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type NoteRow = {
  id: string;
  title: string;
  content: string | null;
  tags: string[];
  course: { code: string; id: string };
  chapter: { title: string; id: string } | null;
};

export function NotesListClient({ notes, createdId }: { notes: NoteRow[]; createdId: string | null }) {
  const highlightRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (createdId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [createdId]);

  if (notes.length === 0) {
    return (
      <>
        {createdId ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            未找到刚保存的笔记（可能已删除或链接过期）。你可以继续
            <Link href="/notes/new" className="mx-1 font-medium text-emerald-600 underline">
              上传笔记
            </Link>
            。
          </p>
        ) : null}
        <p className="text-slate-600">还没有笔记，去上传第一篇吧。</p>
      </>
    );
  }

  return (
    <ul className="space-y-3">
      {notes.map((n) => {
        const isNew = createdId === n.id;
        return (
          <li
            key={n.id}
            ref={isNew ? highlightRef : undefined}
            className={`rounded-2xl border p-4 transition-shadow ${
              isNew
                ? "border-emerald-300 bg-emerald-50/90 shadow-md ring-2 ring-emerald-400/50"
                : "border-slate-200 bg-white/95 shadow-sm"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">
                  {n.title}
                  {isNew ? (
                    <span className="ml-2 rounded-md bg-emerald-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-900">
                      刚保存
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {n.course.code}
                  {n.chapter ? ` · ${n.chapter.title}` : ""}
                </p>
              </div>
              {n.chapter && (
                <Link
                  className="text-xs font-medium text-emerald-600 hover:underline"
                  href={`/courses/${n.course.id}/chapter/${n.chapter.id}`}
                >
                  章节
                </Link>
              )}
            </div>
            {n.content && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{n.content}</p>}
            {n.tags.length > 0 && <p className="mt-2 text-xs text-slate-500">标签：{n.tags.join(", ")}</p>}
          </li>
        );
      })}
    </ul>
  );
}
