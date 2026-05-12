"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { TreeInput } from "@/components/tree/treeLayout";
import { flatChaptersToTree, type FlatChapter } from "@/lib/chapterTree";

const CourseBranchView = dynamic(
  () => import("@/components/tree/CourseBranchView").then((m) => m.CourseBranchView),
  { ssr: false, loading: () => <div className="h-[420px] animate-pulse rounded-2xl bg-white/5" /> }
);

export type ChapterRow = FlatChapter & {
  completed: boolean;
  mastery: number;
  noteCount: number;
};

export function CoursePageClient({
  course,
  chapters,
}: {
  course: { id: string; code: string; title: string; themeKey: string; accentColor: string };
  chapters: ChapterRow[];
}) {
  const [rows, setRows] = useState(chapters);
  const [busyId, setBusyId] = useState<string | null>(null);

  const tree: TreeInput = useMemo(
    () =>
      flatChaptersToTree(
        rows.map((c) => ({ id: c.id, title: c.title, parentId: c.parentId, order: c.order }))
      ),
    [rows]
  );

  const completedMap = useMemo(
    () => Object.fromEntries(rows.map((c) => [c.id, c.completed])),
    [rows]
  );
  const masteryMap = useMemo(() => Object.fromEntries(rows.map((c) => [c.id, c.mastery])), [rows]);

  async function toggle(chapterId: string, completed: boolean) {
    setBusyId(chapterId);
    try {
      const res = await fetch(`/api/chapters/${chapterId}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { progress?: { completed: boolean; mastery: number } };
      const p = data.progress;
      if (!p) return;
      setRows((prev) =>
        prev.map((r) => (r.id === chapterId ? { ...r, completed: p.completed, mastery: p.mastery } : r))
      );
    } finally {
      setBusyId(null);
    }
  }

  const sorted = useMemo(() => [...rows].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)), [rows]);

  return (
    <div className="space-y-8">
      <CourseBranchView
        themeKey={course.themeKey}
        accentColor={course.accentColor}
        tree={tree}
        completedMap={completedMap}
        masteryMap={masteryMap}
      />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">章节清单</h2>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-white/5 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">完成</th>
                <th className="px-4 py-3">章节</th>
                <th className="px-4 py-3">掌握度</th>
                <th className="px-4 py-3">笔记</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((ch) => (
                <tr key={ch.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={ch.completed}
                      disabled={busyId === ch.id}
                      onChange={(e) => void toggle(ch.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-slate-500">{ch.parentId ? "↳ " : ""}</span>
                    {ch.title}
                  </td>
                  <td className="px-4 py-2">{Math.round(ch.mastery * 100)}%</td>
                  <td className="px-4 py-2">{ch.noteCount}</td>
                  <td className="px-4 py-2 text-right">
                    <Link className="text-emerald-400 hover:underline" href={`/courses/${course.id}/chapter/${ch.id}`}>
                      详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
