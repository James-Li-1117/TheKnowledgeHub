"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_FILE_BYTES = 12 * 1024 * 1024;

type CourseOpt = {
  id: string;
  code: string;
  title: string;
  chapters: { id: string; title: string; parentId: string | null }[];
};

export type UploadSummary = {
  noteId: string;
  chapterProgress: {
    beforeMastery: number;
    afterMastery: number;
    delta: number;
  } | null;
  newlyUnlockedAchievements: { key: string; title: string }[];
};

type SubmitStage = "idle" | "validate" | "upload" | "save" | "success";

function postFormDataWithProgress(
  fd: FormData,
  onUploadProgress: (percent: number, phase: "upload" | "processing") => void
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/notes");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        const pct = Math.min(100, Math.round((e.loaded / e.total) * 100));
        onUploadProgress(pct, "upload");
        if (e.loaded >= e.total) {
          onUploadProgress(100, "processing");
        }
      } else {
        onUploadProgress(0, "upload");
      }
    };
    xhr.onload = () => {
      let data: Record<string, unknown> = {};
      try {
        data = xhr.responseText ? (JSON.parse(xhr.responseText) as Record<string, unknown>) : {};
      } catch {
        data = {};
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
    };
    xhr.onerror = () => reject(new Error("网络错误，请稍后重试"));
    xhr.onabort = () => reject(new Error("已取消"));
    xhr.send(fd);
  });
}

function flowStepIndex(stage: SubmitStage, hasFile: boolean): number {
  if (stage === "idle" || stage === "validate") return 0;
  if (stage === "upload") return 1;
  if (stage === "save") return hasFile ? 2 : 2;
  if (stage === "success") return 3;
  return 0;
}

const STEP_LABELS = ["填写内容", "上传文件", "保存笔记", "完成"];

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
  const [submitStage, setSubmitStage] = useState<SubmitStage>("idle");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [successSummary, setSuccessSummary] = useState<UploadSummary | null>(null);

  const chapters = useMemo(() => courses.find((c) => c.id === courseId)?.chapters ?? [], [courses, courseId]);
  const hasFile = Boolean(file && file.size > 0);
  const stepIdx = flowStepIndex(submitStage, hasFile);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessSummary(null);
    setSubmitStage("validate");
    setUploadPercent(0);

    const t = title.trim();
    if (!t) {
      setError("请填写标题");
      setSubmitStage("idle");
      return;
    }
    if (file && file.size > MAX_FILE_BYTES) {
      setError("附件不能超过 12MB");
      setSubmitStage("idle");
      return;
    }

    const fd = new FormData();
    fd.set("title", t);
    fd.set("courseId", courseId);
    if (chapterId) fd.set("chapterId", chapterId);
    fd.set("content", content);
    fd.set("tags", tags);
    if (file && file.size > 0) fd.set("file", file);

    setLoading(true);
    try {
      if (hasFile) {
        setSubmitStage("upload");
        const res = await postFormDataWithProgress(fd, (pct, phase) => {
          setUploadPercent(pct);
          setSubmitStage(phase === "processing" ? "save" : "upload");
        });
        if (!res.ok) {
          setError(String(res.data.error || "上传失败"));
          setSubmitStage("idle");
          setUploadPercent(0);
          return;
        }
        const summary = res.data.uploadSummary as UploadSummary | undefined;
        if (!summary?.noteId) {
          setError("服务器响应异常");
          setSubmitStage("idle");
          setUploadPercent(0);
          return;
        }
        setSuccessSummary(summary);
        setSubmitStage("success");
        window.setTimeout(() => {
          router.push(`/notes?created=${encodeURIComponent(summary.noteId)}`);
        }, 2500);
      } else {
        setSubmitStage("save");
        const res = await fetch("/api/notes", { method: "POST", body: fd });
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (!res.ok) {
          setError(String(data.error || "上传失败"));
          setSubmitStage("idle");
          return;
        }
        const summary = data.uploadSummary as UploadSummary | undefined;
        if (!summary?.noteId) {
          setError("服务器响应异常");
          setSubmitStage("idle");
          return;
        }
        setSuccessSummary(summary);
        setSubmitStage("success");
        window.setTimeout(() => {
          router.push(`/notes?created=${encodeURIComponent(summary.noteId)}`);
        }, 2500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
      setSubmitStage("idle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <ol className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3 text-[11px] shadow-sm">
        {STEP_LABELS.map((label, i) => {
          const noFileSkip = !hasFile && i === 1;
          let variant: "todo" | "active" | "done" | "skip" = "todo";
          if (noFileSkip) {
            if (stepIdx >= 2) variant = "skip";
            else variant = "todo";
          } else if (stepIdx > i) {
            variant = "done";
          } else if (stepIdx === i) {
            variant = "active";
          }
          return (
            <li
              key={label}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                variant === "done"
                  ? "bg-emerald-100 text-emerald-800"
                  : variant === "active"
                    ? "bg-pink-100 text-pink-800"
                    : variant === "skip"
                      ? "border border-dashed border-slate-300 bg-slate-50 text-slate-500"
                      : "bg-slate-100 text-slate-500"
              }`}
            >
              <span className="font-mono opacity-70">{i + 1}</span>
              {label}
              {variant === "skip" ? <span className="text-[10px] text-slate-500">跳过</span> : null}
            </li>
          );
        })}
      </ol>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div>
          <label className="text-xs text-slate-500">课程</label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-50"
            value={courseId}
            disabled={loading || submitStage === "success"}
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
          <label className="text-xs text-slate-500">章节（可选）</label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-50"
            value={chapterId}
            disabled={loading || submitStage === "success"}
            onChange={(e) => setChapterId(e.target.value)}
          >
            <option value="">未指定</option>
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.title}
              </option>
            ))}
          </select>
          {!chapterId ? (
            <p className="mt-1.5 text-xs text-amber-700">
              未选章节时笔记仍会保存，但不会更新章节掌握度。
            </p>
          ) : null}
        </div>
        <div>
          <label className="text-xs text-slate-500">标题</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-50"
            value={title}
            disabled={loading || submitStage === "success"}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">内容（Markdown 纯文本）</label>
          <textarea
            className="mt-1 min-h-[140px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-50"
            value={content}
            disabled={loading || submitStage === "success"}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">标签（逗号分隔）</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-50"
            value={tags}
            disabled={loading || submitStage === "success"}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">附件（≤12MB，配置 Supabase 后上传云端）</label>
          <input
            type="file"
            className="mt-1 w-full text-sm text-slate-600 disabled:opacity-50"
            disabled={loading || submitStage === "success"}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f && f.size > MAX_FILE_BYTES) {
                setError("附件不能超过 12MB");
              } else if (error === "附件不能超过 12MB") {
                setError(null);
              }
            }}
          />
        </div>

        {(submitStage === "upload" || submitStage === "save") && hasFile ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex justify-between text-xs text-slate-500">
              <span>{submitStage === "upload" ? "正在上传附件…" : "服务器正在保存…"}</span>
              {submitStage === "upload" && uploadPercent > 0 ? <span>{uploadPercent}%</span> : null}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-150"
                style={{
                  width:
                    submitStage === "save" ? "100%" : uploadPercent > 0 ? `${uploadPercent}%` : "8%",
                }}
              />
            </div>
          </div>
        ) : null}

        {submitStage === "save" && !hasFile ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            正在保存笔记…
          </div>
        ) : null}

        {error && <p className="text-sm text-rose-600">{error}</p>}

        {successSummary && submitStage === "success" ? (
          <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
            <p className="font-semibold text-emerald-800">保存成功</p>
            {successSummary.chapterProgress ? (
              <p className="text-xs text-slate-600">
                章节掌握度：{Math.round(successSummary.chapterProgress.beforeMastery * 100)}% →{" "}
                {Math.round(successSummary.chapterProgress.afterMastery * 100)}%
                {successSummary.chapterProgress.delta !== 0 ? (
                  <span className="text-emerald-700">
                    {" "}
                    （{successSummary.chapterProgress.delta > 0 ? "+" : ""}
                    {Math.round(successSummary.chapterProgress.delta * 100)}%）
                  </span>
                ) : null}
              </p>
            ) : (
              <p className="text-xs text-slate-600">本次未绑定章节，掌握度未更新。</p>
            )}
            {successSummary.newlyUnlockedAchievements.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-emerald-800">新解锁成就</p>
                <ul className="mt-1 list-inside list-disc text-xs text-slate-600">
                  {successSummary.newlyUnlockedAchievements.map((a) => (
                    <li key={a.key}>{a.title}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="text-xs text-slate-500">即将跳转到笔记列表…</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || submitStage === "success"}
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600 disabled:opacity-50"
        >
          {loading
            ? submitStage === "upload"
              ? "上传中…"
              : submitStage === "save"
                ? "保存中…"
                : "提交中…"
            : submitStage === "success"
              ? "已完成"
              : "保存笔记"}
        </button>
      </form>
    </div>
  );
}
