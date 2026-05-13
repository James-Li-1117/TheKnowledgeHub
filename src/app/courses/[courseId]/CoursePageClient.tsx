"use client";

import dynamic from "next/dynamic";
import type { MindMapNodeDTO } from "@/components/tree/CourseMindMapView";

const CourseMindMapView = dynamic(
  () => import("@/components/tree/CourseMindMapView").then((m) => m.CourseMindMapView),
  { ssr: false, loading: () => <div className="h-[520px] animate-pulse rounded-3xl bg-slate-100" /> }
);

export function CoursePageClient({
  course,
  mindMapNodes,
}: {
  course: { id: string; code: string; title: string; themeKey: string; accentColor: string };
  mindMapNodes: MindMapNodeDTO[];
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-slate-800">课程思维导图</h2>
      <CourseMindMapView
        courseId={course.id}
        themeKey={course.themeKey}
        accentColor={course.accentColor}
        initialNodes={mindMapNodes}
      />
    </section>
  );
}
