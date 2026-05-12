"use client";

import dynamic from "next/dynamic";
import type { GlobalCourseStat } from "./GlobalKnowledgeTree";

const Inner = dynamic(() => import("./GlobalKnowledgeTree").then((m) => m.GlobalKnowledgeTree), {
  ssr: false,
  loading: () => <div className="h-[520px] animate-pulse rounded-2xl bg-white/5" />,
});

export function GlobalKnowledgeTreeDynamic({ courses }: { courses: GlobalCourseStat[] }) {
  return <Inner courses={courses} />;
}
