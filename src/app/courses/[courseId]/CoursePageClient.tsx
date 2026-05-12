"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { TreeInput } from "@/components/tree/treeLayout";
import { flatChaptersToTree, type FlatChapter } from "@/lib/chapterTree";
import type { MindMapNodeDTO } from "@/components/tree/CourseMindMapView";

const CourseBranchView = dynamic(
  () => import("@/components/tree/CourseBranchView").then((m) => m.CourseBranchView),
  { ssr: false, loading: () => <div className="h-[420px] animate-pulse rounded-2xl bg-slate-100" /> }
);

const CourseMindMapView = dynamic(
  () => import("@/components/tree/CourseMindMapView").then((m) => m.CourseMindMapView),
  { ssr: false, loading: () => <div className="h-[520px] animate-pulse rounded-3xl bg-slate-100" /> }
);

export type ChapterRow = FlatChapter & {
  completed: boolean;
  mastery: number;
  noteCount: number;
};

export function CoursePageClient({
  course,
  chapters,
  mindMapNodes,
}: {
  course: { id: string; code: string; title: string; themeKey: string; accentColor: string };
  chapters: ChapterRow[];
  mindMapNodes: MindMapNodeDTO[];
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
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">课程思维导图</h2>
        <CourseMindMapView
          courseId={course.id}
          themeKey={course.themeKey}
          accentColor={course.accentColor}
          initialNodes={mindMapNodes}
        />
      </section>

      <details className="group rounded-2xl border border-slate-200 bg-white/80 shadow-sm open:shadow-md">
        <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-slate-800 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 group-open:hidden">
              展开
            </span>
            <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 group-open:inline">
              收起
            </span>
            章节树与清单（进阶）
          </span>
        </summary>
        <div className="space-y-6 border-t border-slate-100 px-2 pb-4 pt-4">
          <CourseBranchView
            themeKey={course.themeKey}
            accentColor={course.accentColor}
            tree={tree}
            completedMap={completedMap}
            masteryMap={masteryMap}
          />

          <section>
            <h3 className="mb-3 text-base font-semibold text-slate-800">章节清单</h3>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
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
                    <tr key={ch.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={ch.completed}
                          disabled={busyId === ch.id}
                          onChange={(e) => void toggle(ch.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-slate-400">{ch.parentId ? "↳ " : ""}</span>
                        {ch.title}
                      </td>
                      <td className="px-4 py-2">{Math.round(ch.mastery * 100)}%</td>
                      <td className="px-4 py-2">{ch.noteCount}</td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          className="font-medium text-emerald-600 hover:underline"
                          href={`/courses/${course.id}/chapter/${ch.id}`}
                        >
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
      </details>
    </div>
  );
}
