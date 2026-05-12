"use client";

import { useState } from "react";

type CourseLite = { id: string; code: string; title: string };

export function StudyLogForm({ courses }: { courses: CourseLite[] }) {
  const [minutes, setMinutes] = useState(25);
  const [courseId, setCourseId] = useState<string>("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/study-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        minutes,
        courseId: courseId || null,
        note: note || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setMsg("记录失败");
      return;
    }
    setMsg("已记录，继续加油！");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-6">
      <div>
        <label className="text-xs text-slate-400">学习分钟</label>
        <input
          type="number"
          min={1}
          max={600}
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        />
      </div>
      <div>
        <label className="text-xs text-slate-400">关联课程（可选）</label>
        <select
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
        >
          <option value="">无</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-400">备注</label>
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {msg && <p className="text-sm text-emerald-300">{msg}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "提交中…" : "打卡"}
      </button>
    </form>
  );
}
