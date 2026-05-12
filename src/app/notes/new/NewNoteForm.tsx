"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CourseOpt = {
  id: string;
  code: string;
  title: string;
  chapters: { id: string; title: string; parentId: string | null }[];
};

export function NewNoteForm({
  courses,
  initialCourseId,
  initialChapterId,
}: {
  courses: CourseOpt[];
  initialCourseId?: string;
  initialChapterId?: string;
}) {
  const router = useRouter();
  const [courseId, setCourseId] = useState(initialCourseId || courses[0]?.id || "");
  const [chapterId, setChapterId] = useState(initialChapterId || "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const chapters = useMemo(() => courses.find((c) => c.id === courseId)?.chapters ?? [], [courses, courseId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.set("title", title);
    fd.set("courseId", courseId);
    if (chapterId) fd.set("chapterId", chapterId);
    fd.set("content", content);
    fd.set("tags", tags);
    if (file) fd.set("file", file);

    const res = await fetch("/api/notes", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "上传失败");
      return;
    }
    router.push("/notes");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-6">
      <div>
        <label className="text-xs text-slate-400">课程</label>
        <select
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            setChapterId("");
          }}
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-400">章节（可选）</label>
        <select
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
          value={chapterId}
          onChange={(e) => setChapterId(e.target.value)}
        >
          <option value="">未指定</option>
          {chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-400">标题</label>
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-xs text-slate-400">内容（Markdown 纯文本）</label>
        <textarea
          className="mt-1 min-h-[140px] w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-slate-400">标签（逗号分隔）</label>
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-slate-400">附件（≤12MB，配置 Supabase 后上传云端）</label>
        <input
          type="file"
          className="mt-1 w-full text-sm text-slate-300"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "提交中…" : "保存笔记"}
      </button>
    </form>
  );
}
