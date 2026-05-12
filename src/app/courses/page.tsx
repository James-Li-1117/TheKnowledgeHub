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
      <h1 className="text-2xl font-bold text-white">课程</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map(({ course: c, progress: p }) => {
          const theme = getCourseTheme(c.themeKey);
          return (
            <Link
              key={c.id}
              href={`/courses/${c.id}`}
              className={`group rounded-2xl border border-white/10 bg-gradient-to-br p-5 transition hover:border-white/25 ${theme.bgGradient}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: c.accentColor }}>
                    {c.code}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-white">{c.title}</h2>
                  <p className="mt-1 text-xs text-slate-400">视觉主题：{theme.label}</p>
                </div>
                <span
                  className="rounded-full px-2 py-1 text-xs font-medium text-slate-900"
                  style={{ backgroundColor: c.accentColor }}
                >
                  {Math.round(p.fraction * 100)}%
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
                <div
                  className="h-full rounded-full transition-all group-hover:opacity-90"
                  style={{
                    width: `${Math.round(p.fraction * 100)}%`,
                    background: `linear-gradient(90deg, ${c.accentColor}, #ecfccb)`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                章节 {p.completedChapters}/{p.chapterCount} 已完成
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
