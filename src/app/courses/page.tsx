import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { getCourseTheme } from "@/lib/courseThemes";

export default async function CoursesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const courses = await prisma.course.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">课程</h1>
        <Link
          href="/notes/new"
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-600"
        >
          上传笔记
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((c) => {
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
                  <p className="mt-1 text-xs text-slate-600">打开课程思维导图与笔记</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
