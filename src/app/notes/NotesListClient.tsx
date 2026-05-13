"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type NoteRow = {
  id: string;
  title: string;
  content: string | null;
  tags: string[];
  authorId: string;
  author: { name: string | null; email: string };
  course: { code: string; id: string };
  chapter: { title: string; id: string } | null;
};

export function NotesListClient({
  notes,
  currentUserId,
  createdId,
}: {
  notes: NoteRow[];
  currentUserId: string;
  createdId: string | null;
}) {
  const router = useRouter();
  const highlightRef = useRef<HTMLLIElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (createdId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [createdId]);

  function startEdit(n: NoteRow) {
    setEditingId(n.id);
    setEditTitle(n.title);
    setEditContent(n.content || "");
    setEditTags(n.tags.join(", "));
    setSaveError(null);
  }

  async function saveEdit(noteId: string) {
    setSaveError(null);
    setSaving(true);
    try {
      const tags = editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim() || null,
          tags,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setSaveError(data.error || "保存失败");
        return;
      }
      setEditingId(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function authorLabel(a: NoteRow["author"]) {
    return a.name?.trim() || a.email;
  }

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
        const isOwner = n.authorId === currentUserId;
        const isEditing = editingId === n.id;
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
                  提交者：{authorLabel(n.author)}
                  {isOwner ? (
                    <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800">我</span>
                  ) : (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">只读</span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {n.course.code}
                  {n.chapter ? ` · ${n.chapter.title}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/notes/${n.id}`}
                  className="rounded-lg bg-emerald-500 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-600"
                >
                  查看详情
                </Link>
                {n.chapter && (
                  <Link
                    className="text-xs font-medium text-emerald-600 hover:underline"
                    href={`/courses/${n.course.id}/chapter/${n.chapter.id}`}
                  >
                    章节
                  </Link>
                )}
                {isOwner && !isEditing ? (
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => startEdit(n)}
                  >
                    编辑
                  </button>
                ) : null}
              </div>
            </div>

            {isEditing ? (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                <div>
                  <label className="text-[11px] text-slate-500">标题</label>
                  <input
                    className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">内容</label>
                  <textarea
                    className="mt-0.5 min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">标签（逗号分隔）</label>
                  <input
                    className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                  />
                </div>
                {saveError ? <p className="text-sm text-rose-600">{saveError}</p> : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving || !editTitle.trim()}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                    onClick={() => void saveEdit(n.id)}
                  >
                    {saving ? "保存中…" : "保存"}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                    onClick={() => setEditingId(null)}
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <>
                {n.content && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{n.content}</p>}
                {n.tags.length > 0 && <p className="mt-2 text-xs text-slate-500">标签：{n.tags.join(", ")}</p>}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
