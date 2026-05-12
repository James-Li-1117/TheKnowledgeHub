import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserCourseProgress } from "@/lib/progress";
import Link from "next/link";
import { getCourseTheme } from "@/lib/courseThemes";

export default async function CoursesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const courses = await prisma.course.findMany({ orderBy: { sortOrder: "asc" } });
  const rows = await Promise.all(
    courses.map(async (c) => {
      const p = await getUserCourseProgress(session.user.id, c.id);
      return { course: c, progress: p };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">课程</h1>
        <Link
          href="/notes/new"
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-600"
        >
          快速上传笔记
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map(({ course: c, progress: p }) => {
          const theme = getCourseTheme(c.themeKey);
          return (
            <Link
              key={c.id}
              href={`/courses/${c.id}`}
              className={`group rounded-2xl border border-slate-100 bg-gradient-to-br p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${theme.bgGradient}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: c.accentColor }}>
                    {c.code}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">{c.title}</h2>
                  <p className="mt-1 text-xs text-slate-600">视觉主题：{theme.label}</p>
                </div>
                <span
                  className="rounded-full px-2 py-1 text-xs font-semibold text-white shadow"
                  style={{ backgroundColor: c.accentColor }}
                >
                  {Math.round(p.fraction * 100)}%
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/80">
                <div
                  className="h-full rounded-full transition-all group-hover:opacity-95"
                  style={{
                    width: `${Math.round(p.fraction * 100)}%`,
                    background: `linear-gradient(90deg, ${c.accentColor}, #bbf7d0)`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-600">
                章节 {p.completedChapters}/{p.chapterCount} 已完成
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
